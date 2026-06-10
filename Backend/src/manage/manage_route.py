from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.utils.db import get_db
from src.utils.helpers import is_authenticated
from src.user.user_model import User_db
from src.manage import manage_controller
from src.manage.manage_dtos import (
    MemberListDTO, KickResponseDTO,
    MemberScoresDTO, MyScoresDTO,
)


router = APIRouter(
    prefix="/classroom",
    tags=["Manage"],
)


# ── CREATOR ───────────────────────────────────────────────────────

@router.get(
    "/{class_id}/manage/members",
    response_model=MemberListDTO,
    status_code=status.HTTP_200_OK,
    summary="List all members with details  [Creator only]",
)
def get_all_members(
    class_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return manage_controller.get_all_members(db, class_id, user.u_id)


@router.delete(
    "/{class_id}/manage/members/{user_id}",
    response_model=KickResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="Kick a member from classroom  [Creator only]",
)
def kick_member(
    class_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return manage_controller.kick_member(db, class_id, user_id, user.u_id)


@router.get(
    "/{class_id}/manage/members/{user_id}/scores",
    response_model=MemberScoresDTO,
    status_code=status.HTTP_200_OK,
    summary="See a specific member's exam and assignment scores  [Creator only]",
)
def get_member_scores(
    class_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return manage_controller.get_member_scores(db, class_id, user_id, user.u_id)


# ── MEMBER ────────────────────────────────────────────────────────

# @router.delete(
#     "/{class_id}/leave",
#     status_code=status.HTTP_200_OK,
#     summary="Leave a classroom  [Members only]",
# )
# def leave_classroom(
#     class_id: int,
#     db: Session = Depends(get_db),
#     user: User_db = Depends(is_authenticated),
# ):
#     return manage_controller.leave_classroom(db, class_id, user.u_id)


@router.get(
    "/{class_id}/my-scores",
    response_model=MyScoresDTO,
    status_code=status.HTTP_200_OK,
    summary="See my own exam and assignment scores  [Members only]",
)
def get_my_scores(
    class_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return manage_controller.get_my_scores(db, class_id, user.u_id)