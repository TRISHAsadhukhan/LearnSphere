
from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):
    
    model_config = SettingsConfigDict(env_file=".env",extra="ignore")
    
    DB_CONNECTION:str
    
    SECRET_KEY : str
    ALGORITHM : str
    EXP_TIME : int
    
    
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_STARTTLS: bool
    MAIL_SSL_TLS: bool
    
    SUPABASE_URL : str
    SUPABASE_SERVICE_ROLE_KEY : str
    


    
setting=Settings()

print(setting.DB_CONNECTION)