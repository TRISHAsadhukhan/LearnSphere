from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, model_validator

from src.exams.exam_model import OptionLabel


# ─────────────────────────────────────────────
#  Request DTOs
# ─────────────────────────────────────────────

class QuestionCreateDTO(BaseModel):
    question_text:  str        = Field(..., min_length=1)
    option_a:       str        = Field(..., min_length=1, max_length=500)
    option_b:       str        = Field(..., min_length=1, max_length=500)
    option_c:       str        = Field(..., min_length=1, max_length=500)
    option_d:       str        = Field(..., min_length=1, max_length=500)
    correct_option: OptionLabel                          # must be A / B / C / D


class ExamCreateDTO(BaseModel):
    title:       str                    = Field(..., min_length=1, max_length=255)
    description: Optional[str]          = None
    start_time:  datetime
    end_time:    datetime
    questions:   list[QuestionCreateDTO] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_times(self):
        now = datetime.now(timezone.utc)

        start = self.start_time if self.start_time.tzinfo else self.start_time.replace(tzinfo=timezone.utc)
        end   = self.end_time   if self.end_time.tzinfo   else self.end_time.replace(tzinfo=timezone.utc)

        if start <= now:
            raise ValueError("start_time must be in the future.")
        if (start - now).total_seconds() > 3 * 24 * 3600:
            raise ValueError("start_time cannot be more than 3 days from now.")
        if end <= start:
            raise ValueError("end_time must be after start_time.")
        if (end - start).total_seconds() > 7 * 24 * 3600:
            raise ValueError("end_time cannot be more than 1 week after start_time.")
        return self


class SubmitExamDTO(BaseModel):
    answers: list["AnswerSubmitDTO"] = Field(..., min_length=1)


class AnswerSubmitDTO(BaseModel):
    question_id:     int
    selected_option: OptionLabel


# ─────────────────────────────────────────────
#  Response DTOs
# ─────────────────────────────────────────────

class QuestionResponseDTO(BaseModel):
    id:            int
    question_text: str
    option_a:      str
    option_b:      str
    option_c:      str
    option_d:      str
    order:         int
    # correct_option is intentionally excluded — shown only after exam ends

    model_config = {"from_attributes": True}


class QuestionWithAnswerDTO(QuestionResponseDTO):
    """Includes correct answer — returned only after exam ends."""
    correct_option: OptionLabel


class ExamResponseDTO(BaseModel):
    id:           int
    classroom_id: int
    title:        str
    description:  Optional[str]
    start_time:   datetime
    end_time:     datetime
    created_at:   datetime
    total_questions: int = 0

    model_config = {"from_attributes": True}


class ExamDetailDTO(ExamResponseDTO):
    """Full exam with questions — no correct answers."""
    questions: list[QuestionResponseDTO] = []


# ── Attempt response ──────────────────────────────────────────────

class AnswerResultDTO(BaseModel):
    question_id:     int
    question_text:   str
    selected_option: OptionLabel
    correct_option:  OptionLabel   # shown after exam ends
    is_correct:      bool

    model_config = {"from_attributes": True}


class AttemptResultDTO(BaseModel):
    attempt_id:   int
    submitted_at: datetime
    score:        Optional[float]  # None until exam ends
    total:        Optional[int]
    answers:      list[AnswerResultDTO] = []

    model_config = {"from_attributes": True}


# ── Creator views ─────────────────────────────────────────────────

class MemberResultDTO(BaseModel):
    user_id:      int
    name:         str
    submitted_at: Optional[datetime]
    score:        Optional[float]
    total:        Optional[int]
    attempted:    bool


class ExamResultsSummaryDTO(BaseModel):
    exam_id:       int
    title:         str
    total_members: int
    attempted:     int
    not_attempted: int
    results:       list[MemberResultDTO]