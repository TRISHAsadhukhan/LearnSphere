import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Text, DateTime,
    ForeignKey, Boolean, Float, Enum as SAEnum
)
from sqlalchemy.orm import relationship

from src.utils.db import base


class OptionLabel(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"


# ── Exam ──────────────────────────────────────────────────────────
class Exam(base):
    __tablename__ = "exams"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.class_id", ondelete="CASCADE"), nullable=False, index=True)
    created_by   = Column(Integer, ForeignKey("Users.u_id",          ondelete="SET NULL"), nullable=True)

    title        = Column(String(255), nullable=False)
    description  = Column(Text,        nullable=True)

    start_time   = Column(DateTime, nullable=False)
    end_time     = Column(DateTime, nullable=False)

    created_at   = Column(DateTime, default=datetime.utcnow, nullable=False)

    # relationships
    classroom    = relationship("classroom_model", backref="exams")
    creator      = relationship("User_db",         foreign_keys=[created_by])
    questions    = relationship("ExamQuestion",    back_populates="exam", cascade="all, delete-orphan")
    attempts     = relationship("ExamAttempt",     back_populates="exam", cascade="all, delete-orphan")


# ── Question ──────────────────────────────────────────────────────
class ExamQuestion(base):
    __tablename__ = "exam_questions"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    exam_id      = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)

    question_text = Column(Text, nullable=False)
    option_a      = Column(String(500), nullable=False)
    option_b      = Column(String(500), nullable=False)
    option_c      = Column(String(500), nullable=False)
    option_d      = Column(String(500), nullable=False)
    correct_option = Column(SAEnum(OptionLabel), nullable=False)  # A / B / C / D

    order         = Column(Integer, nullable=False, default=0)   # question order in exam

    # relationships
    exam          = relationship("Exam",       back_populates="questions")
    answers       = relationship("ExamAnswer", back_populates="question", cascade="all, delete-orphan")


# ── Attempt (one per member per exam) ─────────────────────────────
class ExamAttempt(base):
    __tablename__ = "exam_attempts"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    exam_id      = Column(Integer, ForeignKey("exams.id",   ondelete="CASCADE"), nullable=False, index=True)
    user_id      = Column(Integer, ForeignKey("Users.u_id", ondelete="CASCADE"), nullable=False, index=True)

    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    score        = Column(Float,    nullable=True)   # filled only after exam ends
    total        = Column(Integer,  nullable=True)   # total questions at time of attempt

    # relationships
    exam         = relationship("Exam",       back_populates="attempts")
    user         = relationship("User_db",    foreign_keys=[user_id])
    answers      = relationship("ExamAnswer", back_populates="attempt", cascade="all, delete-orphan")


# ── Per-question answer inside an attempt ─────────────────────────
class ExamAnswer(base):
    __tablename__ = "exam_answers"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    attempt_id   = Column(Integer, ForeignKey("exam_attempts.id",   ondelete="CASCADE"), nullable=False)
    question_id  = Column(Integer, ForeignKey("exam_questions.id",  ondelete="CASCADE"), nullable=False)

    selected_option = Column(SAEnum(OptionLabel), nullable=False)   # what the member chose
    is_correct      = Column(Boolean, nullable=True)                # filled after exam ends

    # relationships
    attempt      = relationship("ExamAttempt",  back_populates="answers")
    question     = relationship("ExamQuestion", back_populates="answers")