
from sqlalchemy import Column , Integer , String 
from sqlalchemy.orm import relationship
from src.utils.db import base

class User_db(base):
    
    __tablename__="Users"
    
    u_id = Column(Integer, primary_key=True)
    name = Column(String , nullable=False)
    email = Column(String , nullable=False)
    hashed_password = Column(String , nullable=False)

    uploaded_materials = relationship("ClassMaterial", back_populates="uploader", foreign_keys="ClassMaterial.uploaded_by")


