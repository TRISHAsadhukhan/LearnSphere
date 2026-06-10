from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.utils.db import get_db
from src.utils.helpers import is_authenticated
from src.user.user_model import User_db
from src.exams import exam_controller
from src.exams.exam_dtos import (
    ExamCreateDTO, SubmitExamDTO,
    ExamResponseDTO, ExamDetailDTO,
    AttemptResultDTO, ExamResultsSummaryDTO,
)


router = APIRouter(
    prefix="/classroom",
    tags=["Exams"],
)


# ── CREATOR ───────────────────────────────────────────────────────

@router.post(
    "/{class_id}/exams",
    response_model=ExamResponseDTO,
    status_code=status.HTTP_201_CREATED,
    summary="Create an MCQ exam  [Creator only]",
)
def create_exam(
    class_id: int,
    body: ExamCreateDTO,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return exam_controller.create_exam(db, class_id, user.u_id, body)


@router.get(
    "/{class_id}/exams",
    response_model=list[ExamResponseDTO],
    status_code=status.HTTP_200_OK,
    summary="List all exams in classroom  [Creator + Members]",
)
def get_all_exams(
    class_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return exam_controller.get_all_exams(db, class_id, user.u_id)


@router.get(
    "/{class_id}/exams/history",
    status_code=status.HTTP_200_OK,
    summary="Creator exam history with attempt counts  [Creator only]",
)
def get_creator_exam_history(
    class_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return exam_controller.get_creator_exam_history(db, class_id, user.u_id)


@router.get(
    "/{class_id}/exams/{exam_id}/results",
    response_model=ExamResultsSummaryDTO,
    status_code=status.HTTP_200_OK,
    summary="See all member results for an exam  [Creator only]",
)
def get_exam_results(
    class_id: int,
    exam_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return exam_controller.get_exam_results(db, class_id, exam_id, user.u_id)


# ── MEMBER ────────────────────────────────────────────────────────

@router.get(
    "/{class_id}/exams/{exam_id}",
    response_model=ExamDetailDTO,
    status_code=status.HTTP_200_OK,
    summary="Get exam with questions  [Members only]",
)
def get_exam_detail(
    class_id: int,
    exam_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return exam_controller.get_exam_detail(db, class_id, exam_id, user.u_id)


@router.post(
    "/{class_id}/exams/{exam_id}/submit",
    status_code=status.HTTP_200_OK,
    summary="Submit exam answers  [Members only, once only]",
)
def submit_exam(
    class_id: int,
    exam_id: int,
    body: SubmitExamDTO,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return exam_controller.submit_exam(db, class_id, exam_id, user.u_id, body)


@router.get(
    "/{class_id}/exams/{exam_id}/my-result",
    response_model=AttemptResultDTO,
    status_code=status.HTTP_200_OK,
    summary="Get my result after exam ends  [Members only]",
)
def get_my_result(
    class_id: int,
    exam_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return exam_controller.get_my_result(db, class_id, exam_id, user.u_id)


@router.get(
    "/{class_id}/exams-history",
    status_code=status.HTTP_200_OK,
    summary="Member's exam history for this classroom  [Members only]",
)
def get_member_exam_history(
    class_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return exam_controller.get_member_exam_history(db, class_id, user.u_id)


@router.delete(
    "/{class_id}/exams/{exam_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete an exam  [Creator only]",
)
def delete_exam(
    class_id: int,
    exam_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return exam_controller.delete_exam(db, class_id, exam_id, user.u_id)