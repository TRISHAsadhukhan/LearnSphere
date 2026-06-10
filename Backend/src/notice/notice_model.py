from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from src.utils.db import base
from src.user.user_model import User_db
from datetime import datetime
import enum


class ReactionType(str, enum.Enum):
    like    = "like"
    dislike = "dislike"


class Notice_db(base):

    __tablename__ = "Notices"

    notice_id   = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), nullable=False)
    description = Column(String, nullable=True)

    class_id   = Column(Integer, ForeignKey("classrooms.class_id", ondelete="CASCADE"), nullable=False)
    creator_id = Column(Integer, ForeignKey(User_db.u_id,       ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # relationships
    reactions = relationship("Reaction_db", back_populates="notice", cascade="all, delete-orphan")


class Reaction_db(base):

    __tablename__ = "Reactions"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey(User_db.u_id,          ondelete="CASCADE"), nullable=False)
    notice_id     = Column(Integer, ForeignKey(Notice_db.notice_id,   ondelete="CASCADE"), nullable=False)
    reaction_type = Column(Enum(ReactionType), nullable=False)  # "like" | "dislike"

    # relationships
    notice = relationship("Notice_db", back_populates="reactions")

    __table_args__ = (
        UniqueConstraint("user_id", "notice_id", name="unique_user_notice_reaction"),
    )