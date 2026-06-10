import os
import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from src.materials.material_model import ClassMaterial, MaterialFileType
from src.materials.material_dtos import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    MIME_TO_FILE_TYPE,
    MaterialResponseDTO,
    MaterialListResponseDTO,
    MaterialDeleteResponseDTO,
    UploaderDTO,
)
from src.classrooms.classroom_model import classroom_model
from src.members.member_model import member_model
from src.utils.supabase import get_supabase_client


STORAGE_BUCKET = "leansphere-materials"


# ──────────────────────────────────────────────────────────────────
#  Private helpers
# ──────────────────────────────────────────────────────────────────

def _get_classroom_or_404(db: Session, classroom_id: int) -> classroom_model:
    classroom = db.query(classroom_model).filter(classroom_model.class_id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found."
        )
    return classroom


def _require_creator(classroom: classroom_model, user_id: int) -> None:
    if classroom.creator_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class creator can perform this action."
        )


def _require_member_or_creator(
    db: Session,
    classroom: classroom_model,
    user_id: int
) -> None:
    if classroom.creator_id == user_id:
        return
    member = (
        db.query(member_model)
        .filter(
            member_model.class_id == classroom.class_id,
            member_model.user_id  == user_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this classroom."
        )


def _validate_file(file: UploadFile) -> None:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File extension '{ext}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"MIME type '{file.content_type}' not allowed."
        )


def _resolve_file_type(filename: str, content_type: str) -> MaterialFileType:
    if content_type in MIME_TO_FILE_TYPE:
        return MIME_TO_FILE_TYPE[content_type]
    ext = os.path.splitext(filename)[1].lower().lstrip(".")
    try:
        return MaterialFileType(ext)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot resolve file type."
        )


def _build_response(
    material: ClassMaterial,
    download_url: str | None = None
) -> MaterialResponseDTO:
    uploader = None
    if material.uploader:
        uploader = UploaderDTO(
            id=material.uploader.u_id,
            name=material.uploader.name,
        )
    return MaterialResponseDTO(
        id=material.id,
        classroom_id=material.classroom_id,
        title=material.title,
        description=material.description,
        file_name=material.file_name,
        file_type=material.file_type,
        file_size=material.file_size,
        uploaded_at=material.uploaded_at,
        uploader=uploader,
        download_url=download_url,
    )


# ──────────────────────────────────────────────────────────────────
#  Controller functions
# ──────────────────────────────────────────────────────────────────

async def upload_material(
    db: Session,
    classroom_id: int,
    current_user_id: int,
    file: UploadFile,
    title: str,
    description: str | None,
) -> MaterialResponseDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_creator(classroom, current_user_id)
    _validate_file(file)

    contents  = await file.read()
    file_size = len(contents)

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 20 MB limit."
        )

    ext          = os.path.splitext(file.filename or "")[1].lower()
    storage_name = f"{uuid.uuid4()}{ext}"
    storage_path = f"materials/{classroom_id}/{storage_name}"

    supabase = get_supabase_client()
    response = supabase.storage.from_(STORAGE_BUCKET).upload(
        path=storage_path,
        file=contents,
        file_options={"content-type": file.content_type},
    )
    if hasattr(response, "error") and response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file to storage."
        )

    material = ClassMaterial(
        classroom_id=classroom_id,
        uploaded_by=current_user_id,
        title=title.strip(),
        description=description.strip() if description else None,
        file_path=storage_path,
        file_name=file.filename or storage_name,
        file_type=_resolve_file_type(file.filename or storage_name, file.content_type),
        file_size=file_size,
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    return _build_response(material)


async def get_all_materials(
    db: Session,
    classroom_id: int,
    current_user_id: int,
) -> MaterialListResponseDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_member_or_creator(db, classroom, current_user_id)

    materials = (
        db.query(ClassMaterial)
        .filter(ClassMaterial.classroom_id == classroom_id)
        .order_by(ClassMaterial.uploaded_at.desc())
        .all()
    )

    if not materials:
        return MaterialListResponseDTO(total=0, materials=[])

    supabase = get_supabase_client()
    paths    = [m.file_path for m in materials]
    signed   = supabase.storage.from_(STORAGE_BUCKET).create_signed_urls(
        paths=paths,
        expires_in=3600
    )

    url_map: dict[str, str] = {}
    if signed and not (hasattr(signed, "error") and signed.error):
        for item in signed:
            url_map[item.get("path", "")] = item.get("signedURL", "")

    result = [
        _build_response(m, download_url=url_map.get(m.file_path))
        for m in materials
    ]
    return MaterialListResponseDTO(total=len(result), materials=result)


async def get_single_material(
    db: Session,
    classroom_id: int,
    material_id: int,
    current_user_id: int,
) -> MaterialResponseDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_member_or_creator(db, classroom, current_user_id)

    material = (
        db.query(ClassMaterial)
        .filter(
            ClassMaterial.id          == material_id,
            ClassMaterial.classroom_id == classroom_id,
        )
        .first()
    )
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found."
        )

    supabase     = get_supabase_client()
    signed       = supabase.storage.from_(STORAGE_BUCKET).create_signed_url(
        path=material.file_path,
        expires_in=3600,
    )
    download_url = None
    if signed and not (hasattr(signed, "error") and signed.error):
        download_url = signed.get("signedURL")

    return _build_response(material, download_url=download_url)


async def delete_material(
    db: Session,
    classroom_id: int,
    material_id: int,
    current_user_id: int,
) -> MaterialDeleteResponseDTO:

    classroom = _get_classroom_or_404(db, classroom_id)
    _require_creator(classroom, current_user_id)

    material = (
        db.query(ClassMaterial)
        .filter(
            ClassMaterial.id          == material_id,
            ClassMaterial.classroom_id == classroom_id,
        )
        .first()
    )
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found."
        )

    supabase = get_supabase_client()
    supabase.storage.from_(STORAGE_BUCKET).remove([material.file_path])

    db.delete(material)
    db.commit()

    return MaterialDeleteResponseDTO(material_id=material_id)