import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger, Text, Enum as SAEnum
from sqlalchemy.orm import relationship

from src.utils.db import base


class MaterialFileType(str, enum.Enum):
    pdf  = "pdf"
    doc  = "doc"
    docx = "docx"
    xls  = "xls"
    xlsx = "xlsx"
    jpg  = "jpg"
    jpeg = "jpeg"
    png  = "png"
    gif  = "gif"


class ClassMaterial(base):
    __tablename__ = "class_materials"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.class_id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by  = Column(Integer, ForeignKey("Users.u_id",          ondelete="SET NULL"), nullable=True)

    title       = Column(String(255), nullable=False)
    description = Column(Text,        nullable=True)
    file_path   = Column(String(512), nullable=False)
    file_name   = Column(String(255), nullable=False)
    file_type   = Column(SAEnum(MaterialFileType), nullable=False)
    file_size   = Column(BigInteger,  nullable=False)

    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    classroom = relationship("classroom_model", back_populates="materials")
    uploader  = relationship("User_db",         back_populates="uploaded_materials")