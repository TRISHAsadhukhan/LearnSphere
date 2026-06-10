
from sqlalchemy import Column , Integer , String , Boolean , ForeignKey 
from src.utils.db import base
from src.user.user_model import User_db
from sqlalchemy.orm import relationship

class classroom_model(base):
    
    __tablename__="classrooms"
    
    class_id = Column(Integer, primary_key=True)
    class_name = Column(String  , nullable=False)
    title = Column(String , nullable=False)
    room_key = Column(String , nullable=False) 
    creator_id = Column(Integer , ForeignKey(User_db.u_id , ondelete = "CASCADE") , nullable=False )
    
    materials = relationship("ClassMaterial", back_populates="classroom", cascade="all, delete-orphan")