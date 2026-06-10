from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from src.materials.material_model import MaterialFileType


# ─────────────────────────────────────────────────────────────────
#  Constants
# ─────────────────────────────────────────────────────────────────

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

ALLOWED_EXTENSIONS: set[str] = {
    ".pdf", ".doc", ".docx",
    ".xls", ".xlsx",
    ".jpg", ".jpeg", ".png", ".gif",
}

MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024   # 20 MB

MIME_TO_FILE_TYPE: dict[str, MaterialFileType] = {
    "application/pdf":                                                          MaterialFileType.pdf,
    "application/msword":                                                       MaterialFileType.doc,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":  MaterialFileType.docx,
    "application/vnd.ms-excel":                                                 MaterialFileType.xls,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":        MaterialFileType.xlsx,
    "image/jpg":                                                                MaterialFileType.jpg,
    "image/jpeg":                                                               MaterialFileType.jpeg,
    "image/png":                                                                MaterialFileType.png,
    "image/gif":                                                                MaterialFileType.gif,
}


# ─────────────────────────────────────────────────────────────────
#  Response DTOs
# ─────────────────────────────────────────────────────────────────

class UploaderDTO(BaseModel):
    id:   int
    name: str

    model_config = {"from_attributes": True}


class MaterialResponseDTO(BaseModel):
    id:           int
    classroom_id: int
    title:        str
    description:  Optional[str]
    file_name:    str
    file_type:    MaterialFileType
    file_size:    int
    uploaded_at:  datetime
    uploader:     Optional[UploaderDTO] = None
    download_url: Optional[str]        = None

    model_config = {"from_attributes": True}


class MaterialListResponseDTO(BaseModel):
    total:     int
    materials: list[MaterialResponseDTO]


class MaterialDeleteResponseDTO(BaseModel):
    message:     str = "Material deleted successfully."
    material_id: int