# backend/app/database/database.py
import os
import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

from .base import Base

logger = logging.getLogger(__name__)

_db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
_db_path = os.path.abspath(os.path.join(_db_dir, "hcp_crm.db"))

# Allow override via environment variable, fall back to absolute path
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_db_path}")

logger.info(f"Database path: {_db_path}")
logger.info(f"Database URL: {DATABASE_URL}")

# Verify the directory is writable
if not os.access(_db_dir, os.W_OK):
    raise PermissionError(
        f"Cannot write to database directory: {_db_dir}. "
        "Check permissions or set DATABASE_URL to a writable location."
    )

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Yield a database session and ensure it is closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
