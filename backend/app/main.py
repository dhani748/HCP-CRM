# backend/app/main.py
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import OperationalError as SAOperationalError

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware

from app.database.base import Base
from app.database.database import engine
from app.interaction_records.interaction_routes import router
from app.api.chat import router as ai_router
from app.api.hcp import router as hcp_router

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except SAOperationalError as e:
        logger.error(f"Failed to create database tables: {e}")
        raise
    yield


app = FastAPI(
    title="AI-Powered HCP CRM",
    description="An AI-powered CRM module for logging interactions with Healthcare Professionals",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return a structured error response."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    detail = str(exc)

    if isinstance(exc, SAOperationalError) or "readonly database" in detail or "OperationalError" in detail:
        detail = (
            "Unable to save interaction because the database is not writable. "
            "Check that the database file and its directory have write permissions. "
            "If the issue persists, set the DATABASE_URL environment variable to a PostgreSQL connection string."
        )
    elif "GROQ_API_KEY" in detail:
        detail = "GROQ_API_KEY is not set or invalid. Set the GROQ_API_KEY environment variable and restart."
    elif "LangGraph" in detail or "langgraph" in detail:
        detail = f"LangGraph initialization failed: {detail}"
    elif "Connection" in detail and "refused" in detail:
        detail = "Database connection refused. Check that the database is available."

    return JSONResponse(
        status_code=500,
        content={"detail": detail},
    )


@app.get("/health", tags=["System"])
async def health_check():
    """Return API liveness status."""
    return {"status": "ok", "service": "HCP CRM API"}


app.include_router(router)
app.include_router(ai_router)
app.include_router(hcp_router)


static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")