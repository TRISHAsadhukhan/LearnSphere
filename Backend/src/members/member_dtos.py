
from pydantic import BaseModel

class MemberSchema(BaseModel):
    
    room_key : str
  
 
    
class MemberResponseSchema(BaseModel):
    
    class_id : int = None
    member_id : int = None
    user_id : int = None
    