from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator


# ── Allowed file types (same as materials) ────────────────────────
ALLOWED_EXTENSIONS: set[str] = {
    ".pdf", ".doc", ".docx",
    ".xls", ".xlsx",
    ".jpg", ".jpeg", ".png", ".gif",
}

ALLOWED_MIME_TYPES: set[str] = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpg",
    "image/jpeg",
    "image/png",
    "image/gif",
}

MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024   # 20 MB


# ── Request DTOs ──────────────────────────────────────────────────

class GiveMarksDTO(BaseModel):
    marks: float = Field(..., ge=0, description="Marks to assign to this submission")


# ── Response DTOs ─────────────────────────────────────────────────

class AssignmentResponseDTO(BaseModel):
    id:                  int
    classroom_id:        int
    title:               str
    description:         Optional[str]
    question_file_name:  str
    question_download_url: Optional[str] = None   # presigned URL
    start_time:          datetime
    end_time:            datetime
    created_at:          datetime
    status:              str              # upcoming / active / ended
    total_marks: int
    model_config = {"from_attributes": True}


class SubmissionResponseDTO(BaseModel):
    id:               int
    assignment_id:    int
    user_id:          int
    member_name:      str
    answer_file_name: str
    answer_download_url: Optional[str] = None   # presigned URL
    submitted_at:     datetime
    marks:            Optional[float]
    marked_at:        Optional[datetime]
    
    model_config = {"from_attributes": True}


class MySubmissionDTO(BaseModel):
    submitted:           bool
    answer_file_name:    Optional[str]   = None
    submitted_at:        Optional[datetime] = None
    marks:               Optional[float] = None
    marked_at:           Optional[datetime] = None
    assignment_status:   str             # upcoming / active / ended


class AssignmentListDTO(BaseModel):
    total:       int
    assignments: list[AssignmentResponseDTO]


class SubmissionListDTO(BaseModel):
    total:       int
    submitted:   int
    not_submitted: int
    submissions: list[SubmissionResponseDTO]