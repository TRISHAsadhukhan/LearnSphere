import os
import uuid
from datetime import datetime , timezone , timedelta
# from zoneinfo import ZoneInfo


from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from src.assignments.assignment_model import Assignment, AssignmentSubmission
from src.assignments.assignment_dtos import (
    ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES,
    AssignmentResponseDTO, AssignmentListDTO,
    SubmissionResponseDTO, SubmissionListDTO,
    MySubmissionDTO, GiveMarksDTO,
)
from src.classrooms.classroom_model import classroom_model
from src.members.member_model import member_model
from src.user.user_model import User_db
from src.utils.supabase import get_supabase_client


STORAGE_BUCKET = "leansphere-materials"


# ──────────────────────────────────────────────────────────────────
#  Helpers
# ──────────────────────────────────────────────────────────────────

def _get_classroom_or_404(db: Session, classroom_id: int) -> classroom_model:
    classroom = db.query(classroom_model).filter(
        classroom_model.class_id == classroom_id
    ).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found.")
    return classroom


def _get_assignment_or_404(db: Session, assignment_id: int, classroom_id: int) -> Assignment:
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.classroom_id == classroom_id,
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    return assignment


def _require_creator(classroom: classroom_model, user_id: int) -> None:
    if classroom.creator_id != user_id:
        raise HTTPException(status_code=403, detail="Only the class creator can perform this action.")


def _require_member(db: Session, classroom: classroom_model, user_id: int) -> None:
    if classroom.creator_id == user_id:
        raise HTTPException(status_code=403, detail="Creators cannot submit assignments.")
    member = db.query(member_model).filter(
        member_model.class_id == classroom.class_id,
        member_model.user_id  == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this classroom.")


def _require_member_or_creator(db: Session, classroom: classroom_model, user_id: int) -> None:
    if classroom.creator_id == user_id:
        return
    member = db.query(member_model).filter(
        member_model.class_id == classroom.class_id,
        member_model.user_id  == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this classroom.")


def _validate_file(file: UploadFile) -> None:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=422, detail=f"MIME type '{file.content_type}' not allowed.")


def _validate_times(start_time: datetime, end_time: datetime) -> None:
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)

    if end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    
    # now = datetime.utcnow()
    if start_time <= now:
        raise HTTPException(status_code=422, detail="start_time must be in the future.")
    if (start_time - now).total_seconds() > 3 * 24 * 3600:
        raise HTTPException(status_code=422, detail="start_time cannot be more than 3 days from now.")
    if end_time <= start_time:
        raise HTTPException(status_code=422, detail="end_time must be after start_time.")
    if (end_time - start_time).total_seconds() > 7 * 24 * 3600:
        raise HTTPException(status_code=422, detail="end_time cannot be more than 1 week after start_time.")


def _get_status(assignment: Assignment) -> str:
    now = datetime.utcnow()
    if now < assignment.start_time:
        return "upcoming"
    elif now <= assignment.end_time:
        return "active"
    return "ended"


async def _upload_to_supabase(file: UploadFile, folder: str) -> tuple[str, str, bytes]:
    """Upload file to Supabase, return (storage_path, original_name, contents)."""
    contents  = await file.read()
    file_size = len(contents)

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 20 MB limit.")

    ext          = os.path.splitext(file.filename or "")[1].lower()
    storage_name = f"{uuid.uuid4()}{ext}"
    storage_path = f"{folder}/{storage_name}"

    supabase = get_supabase_client()
    response = supabase.storage.from_(STORAGE_BUCKET).upload(
        path=storage_path,
        file=contents,
        file_options={"content-type": file.content_type},
    )
    if hasattr(response, "error") and response.error:
        raise HTTPException(status_code=500, detail="Failed to upload file to storage.")

    return storage_path, file.filename or storage_name, contents


def _get_signed_url(file_path: str) -> str | None:
    supabase = get_supabase_client()
    signed   = supabase.storage.from_(STORAGE_BUCKET).create_signed_url(
        path=file_path, expires_in=3600
    )
    if signed and not (hasattr(signed, "error") and signed.error):
        return signed.get("signedURL")
    return None


def _build_assignment_response(assignment: Assignment) -> AssignmentResponseDTO:
    return AssignmentResponseDTO(
        id=assignment.id,
        classroom_id=assignment.classroom_id,
        title=assignment.title,
        description=assignment.description,
        question_file_name=assignment.question_file_name,
        question_download_url=_get_signed_url(assignment.question_file_path),
        start_time=assignment.start_time,
        end_time=assignment.end_time,
        total_marks=assignment.total_marks,
        created_at=assignment.created_at,
        status=_get_status(assignment),
    )


def _build_submission_response(submission: AssignmentSubmission) -> SubmissionResponseDTO:
    user = submission.user
    return SubmissionResponseDTO(
        id=submission.id,
        assignment_id=submission.assignment_id,
        user_id=submission.user_id,
        member_name=user.name if user else "Unknown",
        answer_file_name=submission.answer_file_name,
        answer_download_url=_get_signed_url(submission.answer_file_path),
        submitted_at=submission.submitted_at,
        marks=submission.marks,
        marked_at=submission.marked_at,
    )


# ──────────────────────────────────────────────────────────────────
#  CREATOR — create assignment
# ──────────────────────────────────────────────────────────────────

async def create_assignment(
    db: Session,
    classroom_id: int,
    current_user_id: int,
    file: UploadFile,
    title: str,
    description: str | None,
    start_time: datetime,
    end_time: datetime,
    total_marks : int
) -> AssignmentResponseDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_creator(classroom, current_user_id)
    _validate_file(file)
    _validate_times(start_time, end_time)

    storage_path, original_name, _ = await _upload_to_supabase(
        file, folder=f"assignments/{classroom_id}/questions"
    )
    
    if total_marks <= 0:
        raise HTTPException(
        status_code=400,
        detail="Total marks must be greater than 0"
    )

    assignment = Assignment(
        classroom_id=classroom_id,
        created_by=current_user_id,
        title=title.strip(),
        description=description.strip() if description else None,
        question_file_path=storage_path,
        question_file_name=original_name,
        start_time=start_time,
        end_time=end_time,
        total_marks=total_marks
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return _build_assignment_response(assignment)


# ──────────────────────────────────────────────────────────────────
#  BOTH — list all assignments
# ──────────────────────────────────────────────────────────────────

def get_all_assignments(
    db: Session,
    classroom_id: int,
    current_user_id: int,
) -> AssignmentListDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_member_or_creator(db, classroom, current_user_id)

    assignments = db.query(Assignment).filter(
        Assignment.classroom_id == classroom_id
    ).order_by(Assignment.created_at.desc()).all()

    result = [_build_assignment_response(a) for a in assignments]
    return AssignmentListDTO(total=len(result), assignments=result)


# ──────────────────────────────────────────────────────────────────
#  MEMBER — submit assignment (once only, within timeline)
# ──────────────────────────────────────────────────────────────────

async def submit_assignment(
    db: Session,
    classroom_id: int,
    assignment_id: int,
    current_user_id: int,
    file: UploadFile,
) -> dict:

    classroom  = _get_classroom_or_404(db, classroom_id)
    _require_member(db, classroom, current_user_id)
    assignment = _get_assignment_or_404(db, assignment_id, classroom_id)
    _validate_file(file)

    now = datetime.utcnow()
    print("NOW:", now)
    print("START:", assignment.start_time)
    print("END:", assignment.end_time)
    
    if now < assignment.start_time:
        raise HTTPException(status_code=400, detail="Assignment has not started yet.")
    if now > assignment.end_time:
        raise HTTPException(status_code=400, detail="Assignment deadline has passed.")

    existing = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.user_id       == current_user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted this assignment.")

    storage_path, original_name, _ = await _upload_to_supabase(
        file, folder=f"assignments/{classroom_id}/submissions/{assignment_id}"
    )

    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        user_id=current_user_id,
        answer_file_path=storage_path,
        answer_file_name=original_name,
    )
    db.add(submission)
    db.commit()
    

    return {"message": "Assignment submitted successfully."}


# ──────────────────────────────────────────────────────────────────
#  MEMBER — see my submission status
# ──────────────────────────────────────────────────────────────────

def get_my_submission(
    db: Session,
    classroom_id: int,
    assignment_id: int,
    current_user_id: int,
) -> MySubmissionDTO:

    classroom  = _get_classroom_or_404(db, classroom_id)
    _require_member(db, classroom, current_user_id)
    assignment = _get_assignment_or_404(db, assignment_id, classroom_id)

    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.user_id       == current_user_id,
    ).first()

    if not submission:
        return MySubmissionDTO(
            submitted=False,
            assignment_status=_get_status(assignment),
        )

    return MySubmissionDTO(
        submitted=True,
        answer_file_name=submission.answer_file_name,
        submitted_at=submission.submitted_at,
        marks=submission.marks,
        marked_at=submission.marked_at,
        assignment_status=_get_status(assignment),
    )


# ──────────────────────────────────────────────────────────────────
#  CREATOR — see all submissions for an assignment
# ──────────────────────────────────────────────────────────────────

def get_all_submissions(
    db: Session,
    classroom_id: int,
    assignment_id: int,
    current_user_id: int,
) -> SubmissionListDTO:

    classroom  = _get_classroom_or_404(db, classroom_id)
    _require_creator(classroom, current_user_id)
    assignment = _get_assignment_or_404(db, assignment_id, classroom_id)

    total_members = db.query(member_model).filter(
        member_model.class_id == classroom_id
    ).count()

    submissions = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id
    ).all()

    result = [_build_submission_response(s) for s in submissions]

    return SubmissionListDTO(
        total=total_members,
        submitted=len(result),
        not_submitted=total_members - len(result),
        submissions=result,
    )


# ──────────────────────────────────────────────────────────────────
#  CREATOR — give marks for a submission
# ──────────────────────────────────────────────────────────────────

def give_marks(
    db: Session,
    classroom_id: int,
    assignment_id: int,
    submission_id: int,
    current_user_id: int,
    body: GiveMarksDTO,
) -> SubmissionResponseDTO:

    classroom = _get_classroom_or_404(
        db,
        classroom_id
    )

    _require_creator(
        classroom,
        current_user_id
    )

    assignment = _get_assignment_or_404(
        db,
        assignment_id,
        classroom_id
    )

    submission = db.query(
        AssignmentSubmission
    ).filter(
        AssignmentSubmission.id == submission_id,
        AssignmentSubmission.assignment_id == assignment_id,
    ).first()

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="Submission not found."
        )

    if body.marks < 0:
        raise HTTPException(
            status_code=400,
            detail="Marks cannot be negative"
        )

    if body.marks > assignment.total_marks:
        raise HTTPException(
            status_code=400,
            detail=f"Marks cannot exceed {assignment.total_marks}"
        )

    submission.marks = body.marks
    submission.marked_at = datetime.utcnow()

    db.commit()
    db.refresh(submission)

    return _build_submission_response(
        submission
    )


async def delete_assignment(
    db: Session,
    classroom_id: int,
    assignment_id: int,
    current_user_id: int,
) -> dict:
    """Creator only — delete assignment and all submissions from storage and DB."""
    classroom = _get_classroom_or_404(db, classroom_id)
    _require_creator(classroom, current_user_id)

    assignment = _get_assignment_or_404(db, assignment_id, classroom_id)

    # Remove question file from Supabase Storage
    supabase = get_supabase_client()
    supabase.storage.from_(STORAGE_BUCKET).remove([assignment.question_file_path])

    # Remove all submission files from storage
    submissions = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id
    ).all()
    if submissions:
        supabase.storage.from_(STORAGE_BUCKET).remove(
            [s.answer_file_path for s in submissions]
        )

    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted successfully.", "assignment_id": assignment_id}