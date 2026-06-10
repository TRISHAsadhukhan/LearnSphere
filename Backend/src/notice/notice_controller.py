from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from src.notice.notice_model import Notice_db, Reaction_db, ReactionType
from src.notice.notice_dtos import NoticeBody, NoticeResponseBody, ReactionResponseBody
from src.user.user_model import User_db


# ──────────────────────────────────────────────────────────
#  PRIVATE HELPERS
# ──────────────────────────────────────────────────────────

def _get_notice_or_404(notice_id: int, db: Session) -> Notice_db:
    notice = db.query(Notice_db).filter(Notice_db.notice_id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notice not found")
    return notice


def _assert_class_member(class_id: int, user_id: int, db: Session):
    """Ensures user is a member OR creator of the class."""
    from src.members.member_model import member_model
    from src.classrooms.classroom_model import classroom_model

    # check if user is the creator
    is_creator = (
        db.query(classroom_model)
        .filter(classroom_model.class_id == class_id, classroom_model.creator_id == user_id)
        .first()
    )

    # check if user is a joined member
    is_member = (
        db.query(member_model)
        .filter(member_model.class_id == class_id, member_model.user_id == user_id)
        .first()
    )

    if not is_creator and not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this class"
        )


def _assert_creator(class_id: int, user: User_db, db: Session):
    """Ensures user is the creator of the class."""
    from src.classrooms.classroom_model import classroom_model
    classroom = db.query(classroom_model).filter(classroom_model.class_id == class_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
    if classroom.creator_id != user.u_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class creator can perform this action"
        )


def _reaction_counts(notice_id: int, db: Session) -> dict:
    rows = (
        db.query(Reaction_db.reaction_type, func.count(Reaction_db.id))
        .filter(Reaction_db.notice_id == notice_id)
        .group_by(Reaction_db.reaction_type)
        .all()
    )
    counts = {r: c for r, c in rows}
    return {
        "like_count":    counts.get(ReactionType.like,    0),
        "dislike_count": counts.get(ReactionType.dislike, 0),
    }


def _build_response(notice: Notice_db, db: Session, user_id: int) -> NoticeResponseBody:
    counts = _reaction_counts(notice.notice_id, db)
    my_row = (
        db.query(Reaction_db)
        .filter(Reaction_db.notice_id == notice.notice_id, Reaction_db.user_id == user_id)
        .first()
    )
    creator = db.query(User_db).filter(User_db.u_id == notice.creator_id).first()
    creator_name = creator.name if creator else "Teacher"
    creator_avatar = creator.name[0].upper() if creator else "T"
    
    return NoticeResponseBody(
        notice_id=notice.notice_id,
        title=notice.title,
        description=notice.description,
        class_id=notice.class_id,
        creator_id=notice.creator_id,
        creator_name=creator_name,
        creator_avatar=creator_avatar,
        created_at=notice.created_at,
        like_count=counts["like_count"],
        dislike_count=counts["dislike_count"],
        my_reaction=my_row.reaction_type if my_row else None,
    )


# ──────────────────────────────────────────────────────────
#  NOTICE CONTROLLERS
# ──────────────────────────────────────────────────────────

def create_notice(class_id: int, body: NoticeBody, db: Session, user: User_db) -> NoticeResponseBody:
    _assert_creator(class_id, user, db)

    notice = Notice_db(
        title=body.title,
        description=body.description,
        class_id=class_id,
        creator_id=user.u_id,
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    return _build_response(notice, db, user.u_id)


def get_all_notices(class_id: int, db: Session, user: User_db) -> list[NoticeResponseBody]:
    _assert_class_member(class_id, user.u_id, db)   # allows both creator and members

    notices = (
        db.query(Notice_db)
        .filter(Notice_db.class_id == class_id)
        .order_by(Notice_db.created_at.desc())
        .all()
    )
    return [_build_response(n, db, user.u_id) for n in notices]


def update_notice(notice_id: int, body: NoticeBody, db: Session, user: User_db) -> NoticeResponseBody:
    notice = _get_notice_or_404(notice_id, db)
    _assert_creator(notice.class_id, user, db)

    notice.title       = body.title
    notice.description = body.description
    db.commit()
    db.refresh(notice)

    return _build_response(notice, db, user.u_id)


def delete_notice(notice_id: int, db: Session, user: User_db) -> None:
    notice = _get_notice_or_404(notice_id, db)
    _assert_creator(notice.class_id, user, db)

    db.delete(notice)
    db.commit()


# ──────────────────────────────────────────────────────────
#  REACTION CONTROLLERS
# ──────────────────────────────────────────────────────────

def react_to_notice_controller(notice_id: int, body, db: Session, user: User_db) -> ReactionResponseBody:
    """
    Like or dislike a notice.
      - No reaction yet          → create
      - Same reaction sent again → toggle OFF (remove)
      - Opposite reaction sent   → switch
    """
    notice = _get_notice_or_404(notice_id, db)
    _assert_class_member(notice.class_id, user.u_id, db)

    existing = (
        db.query(Reaction_db)
        .filter(Reaction_db.notice_id == notice_id, Reaction_db.user_id == user.u_id)
        .first()
    )

    final_reaction = body.reaction_type

    if existing:
        if existing.reaction_type == body.reaction_type:
            # same → toggle off
            db.delete(existing)
            final_reaction = None
        else:
            # opposite → switch
            existing.reaction_type = body.reaction_type
    else:
        db.add(Reaction_db(
            user_id=user.u_id,
            notice_id=notice_id,
            reaction_type=body.reaction_type,
        ))

    db.commit()

    counts = _reaction_counts(notice_id, db)
    return ReactionResponseBody(
        notice_id=notice_id,
        user_id=user.u_id,
        reaction_type=final_reaction,
        **counts,
    )


def get_reactions_controller(notice_id: int, db: Session, user: User_db) -> ReactionResponseBody:
    notice = _get_notice_or_404(notice_id, db)
    _assert_class_member(notice.class_id, user.u_id, db)

    counts = _reaction_counts(notice_id, db)
    my_row = (
        db.query(Reaction_db)
        .filter(Reaction_db.notice_id == notice_id, Reaction_db.user_id == user.u_id)
        .first()
    )
    return ReactionResponseBody(
        notice_id=notice_id,
        user_id=user.u_id,
        reaction_type=my_row.reaction_type if my_row else None,
        **counts,
    )