# backend/app/main.py
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import engine
from app.database.base import Base
from app.interaction_records.interaction_routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="AI-Powered HCP CRM",
    description="An AI-powered CRM module for logging interactions with Healthcare Professionals",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0)(:\\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
async def health_check():
    """Return API liveness status."""
    return {"status": "ok", "service": "HCP CRM API"}


app.include_router(router)