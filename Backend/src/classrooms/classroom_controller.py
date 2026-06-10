
from src.classrooms.classroom_model import classroom_model
from src.classrooms.classroom_dtos import classroomSchema , classroomUpdateSchema , ClassroomResponseSchema

from sqlalchemy.orm import Session
from src.user.user_model import User_db
from fastapi import HTTPException
import uuid
from src.utils.helpers import generate_unique_room_key




def create_classroom(body: classroomSchema , db : Session , user : User_db):
    
    data = body.model_dump()
    
    room_key = generate_unique_room_key(db)
    
    new_classroom = classroom_model(class_name = data["class_name"] , title = data["title"] , room_key = room_key , creator_id = user.u_id)
    
    db.add(new_classroom)
    db.commit()
    db.refresh(new_classroom)
    
    return new_classroom


def get_all_created_classes( user : User_db , db : Session):
    classrooms = db.query(classroom_model).filter(classroom_model.creator_id == user.u_id).all()
    return classrooms


# def get_one_task(task_id : int , db : Session):
    
#     one_task = db.query(Tasks_db).get(task_id)
#     if not one_task :
#         raise HTTPException(
#             status_code=404, 
#             detail="Task not found"
#         )       
#     return one_task


def update_classroom(class_id : int , body : classroomUpdateSchema , db : Session , user : User_db):
    
    one_task = db.query(classroom_model).get(class_id)
    if not one_task :
         raise HTTPException(
            status_code=404, 
            detail="class not found"
        ) 
    
    if one_task.creator_id != user.u_id :
         raise HTTPException(
            status_code=401, 
            detail="unauthorized , only creator can edit"
        )      
     
    
    # data = body.model_dump()
    
    # for field , value in data.items():
    #     setattr(one_task,field,value)
    
    class_name = body.class_name
    title = body.title
    
    if not class_name and not title:
        raise HTTPException(
            status_code=401, 
            detail="name or title is required"
        ) 
    
    elif class_name is None:
        one_task.title = title
    
    elif title is None:
        one_task.class_name = class_name
        
    else:
        one_task.title = title
        one_task.class_name = class_name

        
    db.add(one_task)
    db.commit()
    db.refresh(one_task)
    
    return one_task

    
    
def delete_classroom(class_id : int , db : Session , user : User_db):
    one_task = db.query(classroom_model).get(class_id)
    if not one_task :
         raise HTTPException(
            status_code=400, 
            detail="Task not found"
        )  
         
    if one_task.creator_id != user.u_id :
         raise HTTPException(
            status_code=401, 
            detail="unauthorized , only creator can delete"
        )  
         
    db.delete(one_task)
    db.commit()
    
    return None



# ADD this function to the bottom of src/classrooms/classroom_controller.py

def regenerate_room_key(class_id: int, db: Session, user: User_db):

    classroom = db.query(classroom_model).get(class_id)

    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found.")

    if classroom.creator_id != user.u_id:
        raise HTTPException(status_code=401, detail="Unauthorized. Only the creator can regenerate the room key.")

    classroom.room_key = generate_unique_room_key(db)

    db.add(classroom)
    db.commit()
    db.refresh(classroom)

    return classroom
    