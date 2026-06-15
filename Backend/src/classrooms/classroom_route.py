
from fastapi import APIRouter , Depends , status
from src.classrooms import classroom_controller
from src.classrooms.classroom_dtos import classroomSchema , classroomUpdateSchema , ClassroomResponseSchema
from src.utils.db import get_db
from sqlalchemy.orm import Session
from typing import List
from src.utils.helpers import is_authenticated
from src.user.user_model import User_db




classroom_route = APIRouter(prefix="/classroom")



@classroom_route.post("/create", response_model = ClassroomResponseSchema , status_code=status.HTTP_201_CREATED)
def create_classroom_route(body : classroomSchema, db : Session = Depends(get_db) , user : User_db = Depends(is_authenticated)):
    return classroom_controller.create_classroom(body , db , user)


@classroom_route.get("/all_created_classes", response_model = List[ClassroomResponseSchema] , status_code= status.HTTP_200_OK)
def get_all_classes_route( user : User_db = Depends(is_authenticated) , db : Session = Depends(get_db)):
    return classroom_controller.get_all_created_classes(user , db)


@classroom_route.put("/edit/{class_id}", response_model = ClassroomResponseSchema , status_code= status.HTTP_201_CREATED)
def update_classroom_route(class_id : int , body: classroomUpdateSchema , db : Session = Depends(get_db) , user : User_db = Depends(is_authenticated)):
    return classroom_controller.update_classroom(class_id , body , db , user)


@classroom_route.delete("/delete/{class_id}", response_model = None , status_code= status.HTTP_204_NO_CONTENT)
def delete_classroom_route(class_id : int ,db : Session = Depends(get_db) , user : User_db = Depends(is_authenticated)):
    return classroom_controller.delete_classroom(class_id , db , user)


@classroom_route.patch("/regen-key/{class_id}", response_model=ClassroomResponseSchema, status_code=200)
def regenerate_room_key_route(class_id: int , db: Session = Depends(get_db) , user: User_db = Depends(is_authenticated)):
    return classroom_controller.regenerate_room_key(class_id, db, user)