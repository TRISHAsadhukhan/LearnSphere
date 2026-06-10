from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from src.notice.notice_model import ReactionType


# ──────────────────────────────────────────────────────────
#  NOTICE
# ──────────────────────────────────────────────────────────

class NoticeBody(BaseModel):
    """Request body — creator posts or edits a notice."""
    title:       str            = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class NoticeResponseBody(BaseModel):
    """Response shape for a single notice."""
    notice_id:   int
    title:       str
    description: Optional[str]
    class_id:    int
    creator_id:  int
    creator_name: str
    creator_avatar: Optional[str] = "T"
    created_at:  datetime

    like_count:    int                    = 0
    dislike_count: int                    = 0
    my_reaction:   Optional[ReactionType] = None   # current user's reaction

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────
#  REACTION
# ──────────────────────────────────────────────────────────

class ReactionSchema(BaseModel):
    """
    Request body — member reacts to a notice.
    Sending the same reaction_type again toggles it OFF.
    Sending the opposite switches the reaction.
    """
    reaction_type: ReactionType   # "like" | "dislike"


class ReactionResponseBody(BaseModel):
    """Response after a react / un-react action."""
    notice_id:     int
    user_id:       int
    reaction_type: Optional[ReactionType]   # None = reaction was removed
    like_count:    int
    dislike_count: int