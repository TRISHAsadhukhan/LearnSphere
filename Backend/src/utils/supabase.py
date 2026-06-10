from supabase import create_client, Client
from src.utils.settings import setting
 
_supabase: Client | None = None
 
def get_supabase_client() -> Client:
        global _supabase
        if _supabase is None:
            _supabase = create_client(
                setting.SUPABASE_URL,
                setting.SUPABASE_SERVICE_ROLE_KEY,
            )
        return _supabase