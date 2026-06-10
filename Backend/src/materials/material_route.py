from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, status
from sqlalchemy.orm import Session

from src.utils.db import get_db
from src.utils.helpers import is_authenticated
from src.user.user_model import User_db

from src.materials import material_controller
from src.materials.material_dtos import (
    MaterialResponseDTO,
    MaterialListResponseDTO,
    MaterialDeleteResponseDTO,
)


router = APIRouter(
    prefix="/classroom",
    tags=["Materials"],
)


@router.post(
    "/{class_id}/materials",
    response_model=MaterialResponseDTO,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a class material  [Creator only]",
)
async def upload_material(
    class_id: int,
    file: UploadFile = File(...),
    title: str = Form(..., min_length=1, max_length=255),
    description: str | None = Form(None, max_length=1000),
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return await material_controller.upload_material(
        db=db,
        classroom_id=class_id,
        current_user_id=user.u_id,
        file=file,
        title=title,
        description=description,
    )


@router.get(
    "/{class_id}/materials",
    response_model=MaterialListResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="List all class materials  [Creator + Members]",
)
async def get_all_materials(
    class_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return await material_controller.get_all_materials(
        db=db,
        classroom_id=class_id,
        current_user_id=user.u_id,
    )


@router.get(
    "/{class_id}/materials/{material_id}",
    response_model=MaterialResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="Get single material download URL  [Creator + Members]",
)
async def get_single_material(
    class_id: int,
    material_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return await material_controller.get_single_material(
        db=db,
        classroom_id=class_id,
        material_id=material_id,
        current_user_id=user.u_id,
    )


@router.delete(
    "/{class_id}/materials/{material_id}",
    response_model=MaterialDeleteResponseDTO,
    status_code=status.HTTP_200_OK,
    summary="Delete a class material  [Creator only]",
)
async def delete_material(
    class_id: int,
    material_id: int,
    db: Session = Depends(get_db),
    user: User_db = Depends(is_authenticated),
):
    return await material_controller.delete_material(
        db=db,
        classroom_id=class_id,
        material_id=material_id,
        current_user_id=user.u_id,
    )