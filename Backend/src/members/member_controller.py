
from src.classrooms.classroom_model import classroom_model
from src.members.member_model import member_model
from src.classrooms.classroom_dtos import classroomSchema , classroomUpdateSchema , ClassroomResponseSchema
from src.members.member_dtos import MemberResponseSchema , MemberSchema
from src.user.user_model import User_db


from sqlalchemy.orm import Session
from fastapi import HTTPException




def join_classroom(body: MemberSchema , db : Session , user : User_db):
    
    
    room_key = body.room_key
    
    join_classroom = db.query(classroom_model).filter(classroom_model.room_key == room_key).first()
    
    class_id = join_classroom.class_id
    
    if join_classroom.creator_id == user.u_id :
        raise HTTPException(400 , detail="you are the creator , cannot join")
    
    is_member = db.query(member_model).filter(member_model.user_id == user.u_id , member_model.class_id == class_id).first()
    
    if is_member:
        raise HTTPException(400 , detail="you are already a member , cannot join")
    
    
    new_member = member_model(user_id = user.u_id , class_id = class_id )
 
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    return new_member




def get_all_joined_classes( user : User_db , db : Session):
    
    is_member = db.query(member_model).filter(member_model.user_id == user.u_id).all()
    
    if not is_member :
        return []
    
    class_ids = [
        member.class_id
        for member in is_member
    ]

    classrooms = db.query(classroom_model).filter(
        classroom_model.class_id.in_(class_ids)
    ).all()
        
    return classrooms

    


 
def leave_classroom(class_id : int , db : Session , user : User_db):
    
    one_task = db.query(classroom_model).get(class_id)
    if not one_task :
         raise HTTPException(
            status_code=400, 
            detail="classroom not found"
        )  
         
    if one_task.creator_id == user.u_id :
         raise HTTPException(
            status_code=401, 
            detail="unauthorized , creator can not leave"
        ) 
         
    is_member = db.query(member_model).filter(member_model.user_id == user.u_id , member_model.class_id == class_id).first()
    
    if is_member:
        db.delete(is_member)
        db.commit()
    
    return None
    