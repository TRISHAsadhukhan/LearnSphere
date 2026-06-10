
from pydantic import BaseModel


class UserSchema(BaseModel):
      
    name : str
    email : str
    password : str
    
    
class UserResponseSchema(BaseModel):
      
    u_id : int
    name : str
    email : str
   
   
 
class LoginSchema(BaseModel):
      
    email : str
    password : str 
  
    
    
class change_passwordSchema(BaseModel):
    
    password : str
    

    
class forgot_passwordSchema(BaseModel):
    
    email : str
    
class otpSchema(BaseModel):
    
    otp : str
    
    


