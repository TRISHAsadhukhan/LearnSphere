from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from src.utils.db import get_db
from src.utils.helpers import is_authenticated
from src.user.user_model import User_db
from src.assignments import assignment_controller
from src.assignments.assignment_dtos import (
    AssignmentResponseDTO, AssignmentListDTO,
    SubmissionResponseDTO, SubmissionListDTO,
    MySubmissionDTO, GiveMarksDTO,
)


router = APIRouter(
    prefix="/classroom",
    tags=["Assignments"],
)


# ── CREATOR ───────────────────────────────────────────────────────

@router.post(
    "/{class_id}/assignments",
    response_model=AssignmentResponseDTO,
    status_code=status.HTTP_201_CREATED,
    summary="Create an assignment with question file  [Creator only]",
)
async def create_assignment(
    class_id: int,
    file: UploadFile = File(..., description="PDF, DOC, DOCX, XLS, XLSX, JPG, PNG — max 20 MB"),
    title: str = Form(..., min_length=1, max_length=255),
    description: str | None = Form(None, max_length=1000),
    start_time: datetime = Form(...),
    end_time: datetime = Form(...),
    total_marks: int = Form(...),
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return await assignment_controller.create_assignment(
        db=db,
        classroom_id=class_id,
        current_user_id=user.u_id,
        file=file,
        title=title,
        description=description,
        start_time=start_time,
        end_time=end_time,
        total_marks = total_marks
    )


@router.get(
    "/{class_id}/assignments",
    response_model=AssignmentListDTO,
    status_code=status.HTTP_200_OK,
    summary="List all assignments  [Creator + Members]",
)
def get_all_assignments(
    class_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return assignment_controller.get_all_assignments(db, class_id, user.u_id)


@router.get(
    "/{class_id}/assignments/{assignment_id}/submissions",
    response_model=SubmissionListDTO,
    status_code=status.HTTP_200_OK,
    summary="See all member submissions with download URLs  [Creator only]",
)
def get_all_submissions(
    class_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return assignment_controller.get_all_submissions(db, class_id, assignment_id, user.u_id)


@router.patch(
    "/{class_id}/assignments/{assignment_id}/submissions/{submission_id}/marks",
    response_model=SubmissionResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="Give marks for a submission  [Creator only]",
)
def give_marks(
    class_id: int,
    assignment_id: int,
    submission_id: int,
    body: GiveMarksDTO,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return assignment_controller.give_marks(
        db, class_id, assignment_id, submission_id, user.u_id, body
    )


# ── MEMBER ────────────────────────────────────────────────────────

@router.post(
    "/{class_id}/assignments/{assignment_id}/submit",
    status_code=status.HTTP_200_OK,
    summary="Submit assignment answer file  [Members only, once only]",
)
async def submit_assignment(
    class_id: int,
    assignment_id: int,
    file: UploadFile = File(..., description="PDF, DOC, DOCX, XLS, XLSX, JPG, PNG — max 20 MB"),
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return await assignment_controller.submit_assignment(
        db=db,
        classroom_id=class_id,
        assignment_id=assignment_id,
        current_user_id=user.u_id,
        file=file,
    )


@router.get(
    "/{class_id}/assignments/{assignment_id}/my-submission",
    response_model=MySubmissionDTO,
    status_code=status.HTTP_200_OK,
    summary="See my submission status and marks  [Members only]",
)
def get_my_submission(
    class_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return assignment_controller.get_my_submission(db, class_id, assignment_id, user.u_id)


@router.delete(
    "/{class_id}/assignments/{assignment_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete an assignment  [Creator only]",
)
async def delete_assignment(
    class_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return await assignment_controller.delete_assignment(db, class_id, assignment_id, user.u_id)