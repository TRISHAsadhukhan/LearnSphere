
from pydantic import BaseModel

class classroomSchema(BaseModel):
    
    class_name : str 
    title : str
  

  
class classroomUpdateSchema(BaseModel):
    
    class_name : str | None = None
    title : str | None = None
 
 
    
class ClassroomResponseSchema(BaseModel):
    
    class_id : int = None
    class_name : str = None
    title : str = None
    room_key : str = None
    creator_id : int = None