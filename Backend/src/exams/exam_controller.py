from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.exams.exam_model import Exam, ExamQuestion, ExamAttempt, ExamAnswer
from src.exams.exam_dtos import (
    ExamCreateDTO, SubmitExamDTO,
    ExamResponseDTO, ExamDetailDTO, QuestionResponseDTO, QuestionWithAnswerDTO,
    AttemptResultDTO, AnswerResultDTO,
    ExamResultsSummaryDTO, MemberResultDTO,
)
from src.classrooms.classroom_model import classroom_model
from src.members.member_model import member_model
from src.user.user_model import User_db


# ──────────────────────────────────────────────────────────────────
#  Helpers
# ──────────────────────────────────────────────────────────────────

def _get_classroom_or_404(db: Session, classroom_id: int) -> classroom_model:
    classroom = db.query(classroom_model).filter(classroom_model.class_id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found.")
    return classroom


def _get_exam_or_404(db: Session, exam_id: int, classroom_id: int) -> Exam:
    exam = db.query(Exam).filter(
        Exam.id == exam_id,
        Exam.classroom_id == classroom_id
    ).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")
    return exam


def _require_creator(classroom: classroom_model, user_id: int) -> None:
    if classroom.creator_id != user_id:
        raise HTTPException(status_code=403, detail="Only the class creator can perform this action.")


def _require_member_or_creator(db: Session, classroom: classroom_model, user_id: int) -> None:
    if classroom.creator_id == user_id:
        return
    member = db.query(member_model).filter(
        member_model.class_id == classroom.class_id,
        member_model.user_id  == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this classroom.")


def _require_member_only(db: Session, classroom: classroom_model, user_id: int) -> None:
    """Blocks creator from attempting their own exam."""
    if classroom.creator_id == user_id:
        raise HTTPException(status_code=403, detail="Creators cannot attempt their own exam.")
    member = db.query(member_model).filter(
        member_model.class_id == classroom.class_id,
        member_model.user_id  == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this classroom.")


def _validate_exam_times(start_time: datetime, end_time: datetime) -> None:
    now = datetime.utcnow()
    if start_time <= now:
        raise HTTPException(status_code=422, detail="start_time must be in the future.")
    if (start_time - now).total_seconds() > 3 * 24 * 3600:
        raise HTTPException(status_code=422, detail="start_time cannot be more than 3 days from now.")
    if end_time <= start_time:
        raise HTTPException(status_code=422, detail="end_time must be after start_time.")
    if (end_time - start_time).total_seconds() > 7 * 24 * 3600:
        raise HTTPException(status_code=422, detail="end_time cannot be more than 1 week after start_time.")


def _build_exam_response(exam: Exam) -> ExamResponseDTO:
    return ExamResponseDTO(
        id=exam.id,
        classroom_id=exam.classroom_id,
        title=exam.title,
        description=exam.description,
        start_time=exam.start_time,
        end_time=exam.end_time,
        created_at=exam.created_at,
        total_questions=len(exam.questions),
    )


# ──────────────────────────────────────────────────────────────────
#  CREATOR — create exam
# ──────────────────────────────────────────────────────────────────

def create_exam(
    db: Session,
    classroom_id: int,
    current_user_id: int,
    body: ExamCreateDTO,
) -> ExamResponseDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_creator(classroom, current_user_id)
    _validate_exam_times(body.start_time, body.end_time)

    exam = Exam(
        classroom_id=classroom_id,
        created_by=current_user_id,
        title=body.title.strip(),
        description=body.description.strip() if body.description else None,
        start_time=body.start_time,
        end_time=body.end_time,
    )
    db.add(exam)
    db.flush()  # get exam.id before adding questions

    for idx, q in enumerate(body.questions):
        question = ExamQuestion(
            exam_id=exam.id,
            question_text=q.question_text.strip(),
            option_a=q.option_a.strip(),
            option_b=q.option_b.strip(),
            option_c=q.option_c.strip(),
            option_d=q.option_d.strip(),
            correct_option=q.correct_option,
            order=idx + 1,
        )
        db.add(question)

    db.commit()
    db.refresh(exam)
    return _build_exam_response(exam)


# ──────────────────────────────────────────────────────────────────
#  CREATOR — get all exams in classroom
# ──────────────────────────────────────────────────────────────────

def get_all_exams(
    db: Session,
    classroom_id: int,
    current_user_id: int,
) -> list[ExamResponseDTO]:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_member_or_creator(db, classroom, current_user_id)

    exams = db.query(Exam).filter(Exam.classroom_id == classroom_id)\
               .order_by(Exam.created_at.desc()).all()

    return [_build_exam_response(e) for e in exams]


# ──────────────────────────────────────────────────────────────────
#  MEMBER — get exam detail with questions (no correct answers)
# ──────────────────────────────────────────────────────────────────

def get_exam_detail(
    db: Session,
    classroom_id: int,
    exam_id: int,
    current_user_id: int,
) -> ExamDetailDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_member_or_creator(db, classroom, current_user_id)

    exam = _get_exam_or_404(db, exam_id, classroom_id)
    now  = datetime.utcnow()

    if now < exam.start_time:
        raise HTTPException(status_code=400, detail="Exam has not started yet.")

    questions = sorted(exam.questions, key=lambda q: q.order)
    return ExamDetailDTO(
        id=exam.id,
        classroom_id=exam.classroom_id,
        title=exam.title,
        description=exam.description,
        start_time=exam.start_time,
        end_time=exam.end_time,
        created_at=exam.created_at,
        total_questions=len(questions),
        questions=[QuestionResponseDTO.model_validate(q) for q in questions],
    )


# ──────────────────────────────────────────────────────────────────
#  MEMBER — submit exam (only once, only within timeline)
# ──────────────────────────────────────────────────────────────────

def submit_exam(
    db: Session,
    classroom_id: int,
    exam_id: int,
    current_user_id: int,
    body: SubmitExamDTO,
) -> dict:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_member_only(db, classroom, current_user_id)

    exam = _get_exam_or_404(db, exam_id, classroom_id)
    now  = datetime.utcnow()

    if now < exam.start_time:
        raise HTTPException(status_code=400, detail="Exam has not started yet.")
    if now > exam.end_time:
        raise HTTPException(status_code=400, detail="Exam timeline has ended.")

    # check already attempted
    existing = db.query(ExamAttempt).filter(
        ExamAttempt.exam_id == exam_id,
        ExamAttempt.user_id == current_user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted this exam.")

    # validate all question IDs belong to this exam
    exam_question_ids = {q.id for q in exam.questions}
    submitted_ids     = {a.question_id for a in body.answers}
    invalid = submitted_ids - exam_question_ids
    if invalid:
        raise HTTPException(status_code=422, detail=f"Invalid question IDs: {invalid}")

    attempt = ExamAttempt(
        exam_id=exam_id,
        user_id=current_user_id,
        total=len(exam.questions),
    )
    db.add(attempt)
    db.flush()

    for ans in body.answers:
        db.add(ExamAnswer(
            attempt_id=attempt.id,
            question_id=ans.question_id,
            selected_option=ans.selected_option,
        ))

    db.commit()
    return {"message": "Exam submitted successfully. Results will be available after the exam ends."}


# ──────────────────────────────────────────────────────────────────
#  MEMBER — get my result (only after exam ends)
# ──────────────────────────────────────────────────────────────────

def get_my_result(
    db: Session,
    classroom_id: int,
    exam_id: int,
    current_user_id: int,
) -> AttemptResultDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_member_only(db, classroom, current_user_id)

    exam = _get_exam_or_404(db, exam_id, classroom_id)
    now  = datetime.utcnow()

    if now <= exam.end_time:
        raise HTTPException(status_code=400, detail="Results are available only after the exam ends.")

    attempt = db.query(ExamAttempt).filter(
        ExamAttempt.exam_id == exam_id,
        ExamAttempt.user_id == current_user_id,
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="You did not attempt this exam.")

    # calculate score if not done yet
    if attempt.score is None:
        _calculate_score(db, attempt)

    answers_out = []
    for ans in attempt.answers:
        answers_out.append(AnswerResultDTO(
            question_id=ans.question_id,
            question_text=ans.question.question_text,
            selected_option=ans.selected_option,
            correct_option=ans.question.correct_option,
            is_correct=ans.is_correct or False,
        ))

    return AttemptResultDTO(
        attempt_id=attempt.id,
        submitted_at=attempt.submitted_at,
        score=attempt.score,
        total=attempt.total,
        answers=answers_out,
    )


# ──────────────────────────────────────────────────────────────────
#  MEMBER — exam history (all exams in classroom)
# ──────────────────────────────────────────────────────────────────

def get_member_exam_history(
    db: Session,
    classroom_id: int,
    current_user_id: int,
) -> list[dict]:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_member_only(db, classroom, current_user_id)

    exams   = db.query(Exam).filter(Exam.classroom_id == classroom_id).all()
    now     = datetime.utcnow()
    history = []

    for exam in exams:
        attempt = db.query(ExamAttempt).filter(
            ExamAttempt.exam_id == exam.id,
            ExamAttempt.user_id == current_user_id,
        ).first()

        ended = now > exam.end_time

        # calculate score if exam ended and attempt exists but score not yet set
        if ended and attempt and attempt.score is None:
            _calculate_score(db, attempt)

        history.append({
            "exam_id":    exam.id,
            "title":      exam.title,
            "start_time": exam.start_time,
            "end_time":   exam.end_time,
            "attempted":  attempt is not None,
            "score":      attempt.score if (attempt and ended) else None,
            "total":      attempt.total if attempt else None,
            "status":     "ended" if ended else ("active" if now >= exam.start_time else "upcoming"),
        })

    return history


# ──────────────────────────────────────────────────────────────────
#  CREATOR — see all results for an exam
# ──────────────────────────────────────────────────────────────────

def get_exam_results(
    db: Session,
    classroom_id: int,
    exam_id: int,
    current_user_id: int,
) -> ExamResultsSummaryDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_creator(classroom, current_user_id)

    exam = _get_exam_or_404(db, exam_id, classroom_id)
    now  = datetime.utcnow()

    if now <= exam.end_time:
        raise HTTPException(status_code=400, detail="Results are available only after the exam ends.")

    members = db.query(member_model).filter(member_model.class_id == classroom_id).all()
    results = []

    for m in members:
        user    = db.query(User_db).filter(User_db.u_id == m.user_id).first()
        attempt = db.query(ExamAttempt).filter(
            ExamAttempt.exam_id == exam_id,
            ExamAttempt.user_id == m.user_id,
        ).first()

        if attempt and attempt.score is None:
            _calculate_score(db, attempt)

        results.append(MemberResultDTO(
            user_id=m.user_id,
            name=user.name if user else "Unknown",
            submitted_at=attempt.submitted_at if attempt else None,
            score=attempt.score if attempt else None,
            total=attempt.total if attempt else None,
            attempted=attempt is not None,
        ))

    attempted_count = sum(1 for r in results if r.attempted)

    return ExamResultsSummaryDTO(
        exam_id=exam.id,
        title=exam.title,
        total_members=len(members),
        attempted=attempted_count,
        not_attempted=len(members) - attempted_count,
        results=results,
    )


# ──────────────────────────────────────────────────────────────────
#  CREATOR — exam history (all exams with attempt counts)
# ──────────────────────────────────────────────────────────────────

def get_creator_exam_history(
    db: Session,
    classroom_id: int,
    current_user_id: int,
) -> list[dict]:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_creator(classroom, current_user_id)

    exams   = db.query(Exam).filter(Exam.classroom_id == classroom_id).all()
    now     = datetime.utcnow()
    history = []

    for exam in exams:
        total_members   = db.query(member_model).filter(member_model.class_id == classroom_id).count()
        total_attempted = db.query(ExamAttempt).filter(ExamAttempt.exam_id == exam.id).count()

        history.append({
            "exam_id":        exam.id,
            "title":          exam.title,
            "start_time":     exam.start_time,
            "end_time":       exam.end_time,
            "total_questions": len(exam.questions),
            "total_members":  total_members,
            "attempted":      total_attempted,
            "not_attempted":  total_members - total_attempted,
            "status":         "ended" if now > exam.end_time else ("active" if now >= exam.start_time else "upcoming"),
        })

    return history


# ──────────────────────────────────────────────────────────────────
#  Internal — calculate and persist score
# ──────────────────────────────────────────────────────────────────

def _calculate_score(db: Session, attempt: ExamAttempt) -> None:
    score = 0
    for ans in attempt.answers:
        is_correct = ans.selected_option == ans.question.correct_option
        ans.is_correct = is_correct
        if is_correct:
            score += 1
    attempt.score = score
    db.commit()


def delete_exam(
    db: Session,
    classroom_id: int,
    exam_id: int,
    current_user_id: int,
) -> dict:
    """Creator only — delete exam and all its questions/attempts."""
    classroom = _get_classroom_or_404(db, classroom_id)
    _require_creator(classroom, current_user_id)

    exam = _get_exam_or_404(db, exam_id, classroom_id)
    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted successfully.", "exam_id": exam_id}