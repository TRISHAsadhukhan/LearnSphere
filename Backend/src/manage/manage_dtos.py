from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ── Member detail (creator view) ──────────────────────────────────

class MemberDetailDTO(BaseModel):
    user_id:   int
    name:      str
    email:     str
    joined_at: Optional[datetime] = None


class MemberListDTO(BaseModel):
    total:   int
    members: list[MemberDetailDTO]


# ── Kick ──────────────────────────────────────────────────────────

class KickResponseDTO(BaseModel):
    message: str = "Member removed from classroom."
    user_id: int


# ── Scores ────────────────────────────────────────────────────────

class ExamScoreDTO(BaseModel):
    exam_id:      int
    title:        str
    score:        Optional[float]   # None = not attempted or exam not ended
    total:        Optional[int]
    submitted_at: Optional[datetime]
    attempted:    bool
    status:       str               # upcoming / active / ended


class AssignmentScoreDTO(BaseModel):
    assignment_id: int
    title:         str
    marks:         Optional[float]  # None = not submitted or not marked yet
    submitted:     bool
    status:        str              # upcoming / active / ended


class MemberScoresDTO(BaseModel):
    user_id:     int
    name:        str
    exam_scores:       list[ExamScoreDTO]       = []
    assignment_scores: list[AssignmentScoreDTO] = []   # populated once assignments are built


# ── Member self-view ──────────────────────────────────────────────

class MyScoresDTO(BaseModel):
    classroom_id:      int
    exam_scores:       list[ExamScoreDTO]       = []
    assignment_scores: list[AssignmentScoreDTO] = []