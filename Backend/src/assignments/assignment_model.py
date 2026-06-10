from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship

from src.utils.db import base


# ── Assignment (created by creator) ───────────────────────────────
class Assignment(base):
    __tablename__ = "assignments"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.class_id", ondelete="CASCADE"), nullable=False, index=True)
    created_by   = Column(Integer, ForeignKey("Users.u_id", ondelete="SET NULL"), nullable=True)

    title        = Column(String(255), nullable=False)
    description  = Column(Text, nullable=True)

    # question file stored in Supabase Storage
    question_file_path = Column(String(512), nullable=False)
    question_file_name = Column(String(255), nullable=False)

    start_time   = Column(DateTime, nullable=False)
    end_time     = Column(DateTime, nullable=False)
    created_at   = Column(DateTime, default=datetime.utcnow, nullable=False)

    # relationships
    classroom    = relationship("classroom_model", backref="assignments")
    creator      = relationship("User_db", foreign_keys=[created_by])
    submissions  = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")
    total_marks = Column(Integer, nullable=False, default=100)


# ── Submission (one per member per assignment) ────────────────────
class AssignmentSubmission(base):
    __tablename__ = "assignment_submissions"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id       = Column(Integer, ForeignKey("Users.u_id",     ondelete="CASCADE"), nullable=False, index=True)

    # answer file stored in Supabase Storage
    answer_file_path = Column(String(512), nullable=False)
    answer_file_name = Column(String(255), nullable=False)

    submitted_at  = Column(DateTime, default=datetime.utcnow, nullable=False)
    marks         = Column(Float,   nullable=True)    # filled by creator after reviewing
    marked_at     = Column(DateTime, nullable=True)

    # relationships
    assignment    = relationship("Assignment", back_populates="submissions")
    user          = relationship("User_db", foreign_keys=[user_id])
    
