
from fastapi import APIRouter , status , Depends , Request , BackgroundTasks
from src.user import user_controller
from src. user.user_dtos import UserResponseSchema , UserSchema  , LoginSchema ,change_passwordSchema ,  forgot_passwordSchema , otpSchema
from src.user.user_model import User_db
from src.utils.helpers import is_authenticated
from sqlalchemy.orm import Session
from src.utils.db import get_db



user_route = APIRouter(prefix="/user")

@user_route.post("/register" , response_model = UserResponseSchema , status_code=status.HTTP_201_CREATED)
def register_route(body : UserSchema , db : Session = Depends(get_db) ):
    return user_controller.register(body , db)


@user_route.post("/login" , status_code=status.HTTP_202_ACCEPTED)
def login_route(body : LoginSchema , db : Session = Depends(get_db) ):
    return user_controller.login(body , db)


@user_route.get("/is_auth" ,response_model = UserResponseSchema , status_code=status.HTTP_200_OK)
def is_auth_route(user : User_db = Depends(is_authenticated)):
    return user


@user_route.put("/ch_pw" , status_code= status.HTTP_201_CREATED)
def change_password_route(body : change_passwordSchema , db : Session = Depends(get_db) , user : User_db = Depends(is_authenticated)):
    return user_controller.change_password(body , db , user)



# @user_route.post("/forgot-password" , status_code = status.HTTP_200_OK)
# def forgot_password_route(background_tasks: BackgroundTasks , body :  forgot_passwordSchema ,  db : Session = Depends(get_db)):
#     return user_controller.forgot_password_otp_send(background_tasks , body , db)


# @user_route.post("/otp-verify" , status_code = status.HTTP_200_OK)
# def otp_verify_route(background_tasks: BackgroundTasks , email : str ,  db : Session = Depends(get_db)):
#     return user_controller.forgot_password_otp_send(background_tasks , email , db)



@user_route.post("/forgot-password")
async def forgot_password(body :  forgot_passwordSchema ,  db : Session = Depends(get_db)):
   return await user_controller.forgot_password_controller(body , db)


@user_route.post("/verify-otp")
def verify_otp(otp: otpSchema , request : Request):
    return user_controller.verify_otp_controller(otp , request)


@user_route.post("/reset-password")
def reset_password(body: change_passwordSchema , request : Request ,  db : Session = Depends(get_db) ):
    return user_controller.reset_password_controller(body , request , db)