

from fastapi import APIRouter , status


health_check_route = APIRouter(prefix="/user")

@health_check_route.get("/healthcheck" , status_code = status.HTTP_200_OK)
def handle_health_check():
    # This is the equivalent of your ApiResponse class structure
    response = {
        "statusCode": 200,
        "data": None,
        "message": "Server is up and running",
        "success": True
    }
    return response