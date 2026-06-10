from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ── import ALL models so Alembic can see every table ──────────────
from src.user.user_model import User_db
from src.classrooms.classroom_model import classroom_model
from src.members.member_model import member_model
from src.notice.notice_model import  Notice_db , Reaction_db       
from src.materials.material_model import ClassMaterial
from src.exams.exam_model import Exam , ExamAnswer , ExamAttempt , ExamQuestion
from src.assignments.assignment_model import Assignment, AssignmentSubmission
# ──────────────────────────────────────────────────────────────────

from src.utils.db import base
from src.utils.settings import setting

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = base.metadata

config.set_main_option("sqlalchemy.url", setting.DB_CONNECTION)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()