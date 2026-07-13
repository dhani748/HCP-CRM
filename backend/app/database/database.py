import os
import logging

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

from .base import Base

logger = logging.getLogger(__name__)

_db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
_db_path = os.path.abspath(os.path.join(_db_dir, "hcp_crm.db"))

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_db_path}")

logger.info(f"Database path: {_db_path}")
logger.info(f"Database URL: {DATABASE_URL}")

if not os.access(_db_dir, os.W_OK):
    raise PermissionError(
        f"Cannot write to database directory: {_db_dir}. "
        "Check permissions or set DATABASE_URL to a writable location."
    )

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,
    },
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)


@event.listens_for(engine, "connect")
def set_sqlite_pragmas(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA busy_timeout=30000")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    except OperationalError as e:
        logger.error(f"Database operational error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
