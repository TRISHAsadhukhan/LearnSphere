
from sqlalchemy import Column , Integer , String , Boolean , ForeignKey
from src.utils.db import base
from src.user.user_model import User_db
from src.classrooms.classroom_model import classroom_model

class member_model(base):
    
    __tablename__="members"
    
    member_id = Column(Integer, primary_key=True)
    user_id = Column(Integer , ForeignKey(User_db.u_id , ondelete = "CASCADE") , nullable=False )
    class_id = Column(Integer , ForeignKey(classroom_model.class_id , ondelete = "CASCADE") , nullable=False )