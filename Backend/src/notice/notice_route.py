from fastapi import APIRouter, Depends, status
from src.notice import notice_controller
from src.notice.notice_dtos import NoticeBody, NoticeResponseBody, ReactionSchema, ReactionResponseBody
from src.utils.db import get_db
from sqlalchemy.orm import Session
from typing import List
from src.utils.helpers import is_authenticated
from src.user.user_model import User_db


notice_route = APIRouter(prefix="/notice")


# ──────────────────────────────────────────────────────────
#  NOTICE ROUTES
# ──────────────────────────────────────────────────────────

@notice_route.post(
    "/{class_id}/create",
    response_model=NoticeResponseBody,
    status_code=status.HTTP_201_CREATED
)
def create_notices_route(
    class_id: int,
    body: NoticeBody,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated)
):
    return notice_controller.create_notice(class_id, body, db, user)


@notice_route.get(
    "/{class_id}/all_notices",
    response_model=List[NoticeResponseBody],
    status_code=status.HTTP_200_OK
)
def get_all_notices_route(
    class_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated)
):
    return notice_controller.get_all_notices(class_id, db, user)


@notice_route.put(
    "/edit/{notice_id}",
    response_model=NoticeResponseBody,
    status_code=status.HTTP_200_OK
)
def update_notice_route(
    notice_id: int,
    body: NoticeBody,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated)
):
    return notice_controller.update_notice(notice_id, body, db, user)


@notice_route.delete(
    "/delete/{notice_id}",
    response_model=None,
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_notice_route(
    notice_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated)
):
    return notice_controller.delete_notice(notice_id, db, user)


# ──────────────────────────────────────────────────────────
#  REACTION ROUTES
# ──────────────────────────────────────────────────────────

@notice_route.post(
    "/{notice_id}/reaction",
    response_model=ReactionResponseBody,
    status_code=status.HTTP_200_OK
)
def react_to_notice(
    notice_id: int,
    body: ReactionSchema,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated)
):
    return notice_controller.react_to_notice_controller(notice_id, body, db, user)


@notice_route.get(
    "/{notice_id}/reactions",
    response_model=ReactionResponseBody,
    status_code=status.HTTP_200_OK
)
def get_reactions(
    notice_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated)
):
    return notice_controller.get_reactions_controller(notice_id, db, user)