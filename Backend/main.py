
from fastapi import FastAPI
from src.utils.db import base , engine
# from notice.notice_route import task_route
from src.user.user_route import user_route
from src.classrooms.classroom_route import classroom_route
from src.members.member_route import member_route
from src.notice.notice_route import notice_route
from src.materials.material_route import router as material_router
from src.exams.exam_route import router as exam_router
from src.assignments.assignment_route import router as assignment_router
from src.manage.manage_route import router as manage_router
from fastapi.middleware.cors import CORSMiddleware


# base.metadata.create_all(engine)


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "learn-sphere-ashen-three.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],  # replace after Vercel deploy
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# app.include_router(task_route)

app.include_router(user_route)
app.include_router(classroom_route)
app.include_router(member_route)
app.include_router(notice_route)
app.include_router(material_router)
app.include_router(exam_router)
app.include_router(manage_router)
app.include_router(assignment_router)





