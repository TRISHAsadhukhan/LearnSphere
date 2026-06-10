
from fastapi import APIRouter , Depends , status
from src.members import member_controller
from src.classrooms.classroom_dtos import classroomSchema , classroomUpdateSchema , ClassroomResponseSchema
from src.members.member_dtos import MemberResponseSchema , MemberSchema

from src.utils.db import get_db
from sqlalchemy.orm import Session
from typing import List
from src.utils.helpers import is_authenticated
from src.user.user_model import User_db




member_route = APIRouter(prefix="/classroom/member")



@member_route.post("/join", response_model = MemberResponseSchema , status_code=status.HTTP_201_CREATED)
def join_classroom_route(body : MemberSchema, db : Session = Depends(get_db) , user : User_db = Depends(is_authenticated)):
    return member_controller.join_classroom(body , db , user)


@member_route.get("/all_joined_classes", response_model = List[ClassroomResponseSchema] , status_code= status.HTTP_200_OK)
def get_all_joined_classes_route( user : User_db = Depends(is_authenticated) , db : Session = Depends(get_db)):
    return member_controller.get_all_joined_classes(user , db)



@member_route.delete("/leave/{class_id}", response_model = None , status_code= status.HTTP_204_NO_CONTENT)
def leave_classroom_route(class_id : int ,db : Session = Depends(get_db) , user : User_db = Depends(is_authenticated)):
    return member_controller.leave_classroom(class_id , db , user)
