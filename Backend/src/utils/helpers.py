
from fastapi import Request , HTTPException , Depends
from sqlalchemy.orm import Session
import jwt
from jwt.exceptions import InvalidTokenError
from src.user.user_model import User_db
from src.utils.settings import setting
from src.utils.db import get_db


def is_authenticated(request : Request , db : Session = Depends(get_db)):
    
    try:
        token = request.headers.get("authorization")
        
        if not token:
            raise HTTPException(400,detail="no token")
        
        token = token.split(" ")[-1]
        print(token)
               
        data = jwt.decode(token , setting.SECRET_KEY , setting.ALGORITHM)
        print(data)
        
        user_id = data.get("id")
        
        user = db.query(User_db).filter(User_db.u_id == user_id).first()
        
        if not user:
            raise HTTPException(400,detail="not a user")
        
        return user
           
    except InvalidTokenError:
        
        raise HTTPException(400,detail="expired")
    
    
 
 
 
 
   

from fastapi_mail import FastMail
from fastapi_mail import MessageSchema
from fastapi_mail import ConnectionConfig


conf = ConnectionConfig(

    MAIL_USERNAME=setting.MAIL_USERNAME,

    MAIL_PASSWORD=setting.MAIL_PASSWORD,

    MAIL_FROM=setting.MAIL_FROM,

    MAIL_PORT=setting.MAIL_PORT,

    MAIL_SERVER=setting.MAIL_SERVER,

    MAIL_STARTTLS=setting.MAIL_STARTTLS,

    MAIL_SSL_TLS=setting.MAIL_SSL_TLS,

    USE_CREDENTIALS=True
)


async def send_email(
    receiver_email: str,
    subject: str,
    body: str
):

    message = MessageSchema(

        subject=subject,

        recipients=[receiver_email],

        body=body,

        subtype="plain"
    )

    fm = FastMail(conf)

    await fm.send_message(message)

 
    
import random
from datetime import datetime , timedelta


otp_storage = {}


def generate_otp():

    return str(
        random.randint(100000, 999999)
    )
 
   
    
def create_temp_token(
    email: str,
    otp: str
):

    payload = {
        "email": email,
        "otp": otp,
        "exp": datetime.utcnow() + timedelta(minutes=5)
    }

    token = jwt.encode(
        payload,
        setting.SECRET_KEY,
        algorithm=setting.ALGORITHM
    )

    return token



def create_verified_token(
    email: str
):

    payload = {
        "email": email,
        "verified": True,
        "exp": datetime.utcnow() + timedelta(minutes=5)
    }

    token = jwt.encode(
        payload,
        setting.SECRET_KEY,
        algorithm=setting.ALGORITHM
    )

    return token




def verify_token(token: str):

    print(token)
    try:

        payload = jwt.decode(
            token,
           setting.SECRET_KEY,
            algorithms=[setting.ALGORITHM,]
        )
        print(payload)
        return payload

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=400,
            detail="Token expired"
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=400,
            detail="Invalid token"
        )
        
        
        
import random
import string
from src.classrooms.classroom_model import classroom_model

def generate_unique_room_key(db):
    while True:
        room_key = ''.join(
            random.choices(
                string.ascii_uppercase + string.digits,
                k=6
            )
        )

        existing_room = db.query(classroom_model).filter(
            classroom_model.room_key == room_key
        ).first()

        if not existing_room:
            return room_key