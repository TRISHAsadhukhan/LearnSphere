from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.classrooms.classroom_model import classroom_model
from src.members.member_model import member_model
from src.user.user_model import User_db
from src.exams.exam_model import Exam, ExamAttempt

from src.manage.manage_dtos import (
    MemberDetailDTO, MemberListDTO,
    KickResponseDTO,
    ExamScoreDTO, AssignmentScoreDTO,
    MemberScoresDTO, MyScoresDTO,
)


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


def _require_creator(classroom: classroom_model, user_id: int) -> None:
    if classroom.creator_id != user_id:
        raise HTTPException(status_code=403, detail="Only the class creator can perform this action.")


def _require_member(db: Session, classroom: classroom_model, user_id: int) -> None:
    if classroom.creator_id == user_id:
        raise HTTPException(status_code=403, detail="Creators use the manage area, not the member score section.")
    member = db.query(member_model).filter(
        member_model.class_id == classroom.class_id,
        member_model.user_id  == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this classroom.")


def _get_exam_scores(db: Session, classroom_id: int, user_id: int) -> list[ExamScoreDTO]:
    """Get all exam scores for a specific user in a classroom."""
    exams = db.query(Exam).filter(Exam.classroom_id == classroom_id).all()
    now   = datetime.utcnow()
    scores = []

    for exam in exams:
        attempt = db.query(ExamAttempt).filter(
            ExamAttempt.exam_id == exam.id,
            ExamAttempt.user_id == user_id,
        ).first()

        ended = now > exam.end_time

        # calculate score lazily if exam ended and not yet calculated
        if ended and attempt and attempt.score is None:
            _calculate_score(db, attempt)

        if exam.start_time > now:
            exam_status = "upcoming"
        elif now <= exam.end_time:
            exam_status = "active"
        else:
            exam_status = "ended"

        scores.append(ExamScoreDTO(
            exam_id=exam.id,
            title=exam.title,
            score=attempt.score if (attempt and ended) else None,
            total=attempt.total if attempt else None,
            submitted_at=attempt.submitted_at if attempt else None,
            attempted=attempt is not None,
            status=exam_status,
        ))

    return scores


def _get_assignment_scores(db: Session, classroom_id: int, user_id: int) -> list[AssignmentScoreDTO]:
    from src.assignments.assignment_model import Assignment, AssignmentSubmission
    assignments = db.query(Assignment).filter(Assignment.classroom_id == classroom_id).all()
    now = datetime.utcnow()
    scores = []
    for assignment in assignments:
        submission = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment.id,
            AssignmentSubmission.user_id       == user_id,
        ).first()
        if assignment.start_time > now:
            a_status = "upcoming"
        elif now <= assignment.end_time:
            a_status = "active"
        else:
            a_status = "ended"
        scores.append(AssignmentScoreDTO(
            assignment_id=assignment.id,
            title=assignment.title,
            marks=submission.marks if submission else None,
            submitted=submission is not None,
            status=a_status,
        ))
    return scores


def _calculate_score(db: Session, attempt: ExamAttempt) -> None:
    score = 0
    for ans in attempt.answers:
        is_correct = ans.selected_option == ans.question.correct_option
        ans.is_correct = is_correct
        if is_correct:
            score += 1
    attempt.score = score
    db.commit()


# ──────────────────────────────────────────────────────────────────
#  CREATOR — list all members
# ──────────────────────────────────────────────────────────────────

def get_all_members(
    db: Session,
    classroom_id: int,
    current_user_id: int,
) -> MemberListDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_creator(classroom, current_user_id)

    members = db.query(member_model).filter(
        member_model.class_id == classroom_id
    ).all()

    result = []
    for m in members:
        user = db.query(User_db).filter(User_db.u_id == m.user_id).first()
        if user:
            result.append(MemberDetailDTO(
                user_id=user.u_id,
                name=user.name,
                email=user.email,
                joined_at=getattr(m, "joined_at", None),  # safe if column doesn't exist yet
            ))

    return MemberListDTO(total=len(result), members=result)


# ──────────────────────────────────────────────────────────────────
#  CREATOR — kick a member
# ──────────────────────────────────────────────────────────────────

def kick_member(
    db: Session,
    classroom_id: int,
    target_user_id: int,
    current_user_id: int,
) -> KickResponseDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_creator(classroom, current_user_id)

    if target_user_id == current_user_id:
        raise HTTPException(status_code=400, detail="You cannot kick yourself.")

    member = db.query(member_model).filter(
        member_model.class_id == classroom_id,
        member_model.user_id  == target_user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in this classroom.")

    db.delete(member)
    db.commit()

    return KickResponseDTO(user_id=target_user_id)


# ──────────────────────────────────────────────────────────────────
#  CREATOR — see a specific member's scores
# ──────────────────────────────────────────────────────────────────

def get_member_scores(
    db: Session,
    classroom_id: int,
    target_user_id: int,
    current_user_id: int,
) -> MemberScoresDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_creator(classroom, current_user_id)

    user = db.query(User_db).filter(User_db.u_id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    member = db.query(member_model).filter(
        member_model.class_id == classroom_id,
        member_model.user_id  == target_user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="This user is not a member of this classroom.")

    return MemberScoresDTO(
        user_id=user.u_id,
        name=user.name,
        exam_scores=_get_exam_scores(db, classroom_id, target_user_id),
        assignment_scores=_get_assignment_scores(db, classroom_id, target_user_id),
    )


# ──────────────────────────────────────────────────────────────────
#  MEMBER — leave classroom
# ──────────────────────────────────────────────────────────────────

def leave_classroom(
    db: Session,
    classroom_id: int,
    current_user_id: int,
) -> dict:

    classroom = _get_classroom_or_404(db, classroom_id)

    if classroom.creator_id == current_user_id:
        raise HTTPException(status_code=400, detail="Creators cannot leave their own classroom.")

    member = db.query(member_model).filter(
        member_model.class_id == classroom_id,
        member_model.user_id  == current_user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="You are not a member of this classroom.")

    db.delete(member)
    db.commit()

    return {"message": "You have left the classroom."}


# ──────────────────────────────────────────────────────────────────
#  MEMBER — see own scores
# ──────────────────────────────────────────────────────────────────

def get_my_scores(
    db: Session,
    classroom_id: int,
    current_user_id: int,
) -> MyScoresDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_member(db, classroom, current_user_id)

    return MyScoresDTO(
        classroom_id=classroom_id,
        exam_scores=_get_exam_scores(db, classroom_id, current_user_id),
        assignment_scores=_get_assignment_scores(db, classroom_id, current_user_id),
    )