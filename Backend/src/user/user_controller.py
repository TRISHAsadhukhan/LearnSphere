from src.user.user_dtos import UserSchema , LoginSchema , change_passwordSchema ,  forgot_passwordSchema , otpSchema
from sqlalchemy.orm import Session
from src.user.user_model import User_db
from fastapi import HTTPException , Request , BackgroundTasks
from pwdlib import PasswordHash
from src.utils.settings import setting
from datetime import datetime , timedelta , timezone
from src.utils.helpers import send_email , generate_otp , otp_storage , create_temp_token , verify_token , create_verified_token


import random

import jwt
from jwt.exceptions import InvalidTokenError


password_hash = PasswordHash.recommended()

def get_hashed_password(password):
    return password_hash.hash(password)

def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)




def register(body : UserSchema , db : Session):
    
    is_user = db.query(User_db).filter(User_db.email == body.email).first()
    
    if is_user :
        raise HTTPException(400,detail="User Already Exits")
    
    hashed_password = get_hashed_password(body.password)
    
    new_user = User_db(name = body.name , email = body.email , hashed_password = hashed_password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user




def login(body : LoginSchema , db : Session):
    
    user = db.query(User_db).filter(User_db.email == body.email).first()
    
    if not user:
        raise HTTPException(400 , detail="User Does not exsits")
    
    if not verify_password(body.password,user.hashed_password):
        raise HTTPException(400 , detail="password Does not exsits")
    
    exp_time = datetime.now() + timedelta(minutes=setting.EXP_TIME)
    # print(exp_time)
    
    token = jwt.encode({"id" : user.u_id , "exp" : exp_time.timestamp()} , setting.SECRET_KEY , setting.ALGORITHM)
   
    return {"Token" : token}




def change_password( body : change_passwordSchema , db : Session , user : User_db ):
    
    hashed_password = get_hashed_password(body.password)
    
    user.hashed_password = hashed_password
    
    db.commit()
    db.refresh(user)

    return {
        "message": "Password changed successfully"
    }
    
   
 
# from fastapi import HTTPException

# from helpers.otp_helper import generate_otp

# from helpers.jwt_helper import (
#     create_temp_token,
#     create_verified_token,
#     verify_token
# )

# from helpers.mail_helper import send_otp_email

# from helpers.password_helper import hash_password

# from database.db import users_collection


async def forgot_password_controller(body : forgot_passwordSchema , db : Session):

    email = body.email
    user = user = db.query(User_db).filter(User_db.email == email).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    otp = generate_otp()
    
    

    temp_token = create_temp_token(
        email,
        otp
    )
    
    sub = "Forget Password ?"
    body = f"Your One-Time-Password to reset your password is {otp}"

    send_email(email, sub, body)

    return {
        "message": "OTP sent successfully",
        "temp_token": temp_token
    }




def verify_otp_controller(
    otp: otpSchema,
    # temp_token: str
    request : Request 
):
    
    temp_token = request.headers.get("authorization")
    temp_token = temp_token.split(" ")[-1]
    print(temp_token)
    payload = verify_token(temp_token)

    stored_otp = payload["otp"]


    if otp.otp != stored_otp:

        raise HTTPException(
            status_code=400,
            detail="Invalid OTP"
        )

    verified_token = create_verified_token(
        payload["email"]
    )

    return {
        "message": "OTP verified",
        "verified_token": verified_token
    }



def reset_password_controller(body : change_passwordSchema , request : Request , db : Session):
    
    verified_token = request.headers.get("authorization")
    verified_token = verified_token.split(" ")[-1]

    payload = verify_token(
        verified_token
    )

    if not payload.get("verified"):

        raise HTTPException(
            status_code=401,
            detail="OTP verification required"
        )

    email = payload["email"]

    hashed_password = get_hashed_password(body.password)
    
    user = user = db.query(User_db).filter(User_db.email == email).first()
    user.hashed_password = hashed_password
    
    db.commit()
    db.refresh(user)

    return {
        "message": "Password reset successful"
    }
    



























# def is_authenticated(request : Request , db : Session):
    
#     try:
#         token = request.headers.get("authorization")
        
#         if not token:
#             raise HTTPException(400,detail="no token")
    
#         token = token.split(" ")[-1]
#         # print(token)
        
#         data = jwt.decode(token , setting.SECRET_KEY , setting.ALGORITHM)
#         # print(data)
        
#         user_id = data.get("id")
#         # exp_time = data.get("exp")
        
#         # print(type(exp_time))
        
#         # date_obj = datetime.fromtimestamp(exp_time)
#         # print(date_obj.strftime('%Y-%m-%d %H:%M:%S')) 
        
#         user = db.query(User_db).filter(User_db.u_id == user_id).first()
        
#         if not user:
#             raise HTTPException(400,detail="not a user")
        
#         return user
           
#     except InvalidTokenError:
        
#         raise HTTPException(400,detail="expired")

    