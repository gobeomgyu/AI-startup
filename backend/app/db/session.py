"""SQLite engine and request scoped sessions."""

import asyncio
import os
from collections.abc import AsyncGenerator, Generator
from pathlib import Path
from typing import Annotated

from fastapi import Depends
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = PROJECT_ROOT / ".local" / "todo.sqlite3"
DATABASE_URL = os.getenv("TODO_DATABASE_URL", f"sqlite:///{DEFAULT_DATABASE_PATH}")
SQLITE_POOL_SIZE = 5
SQLITE_MAX_OVERFLOW = 35
SQLITE_POOL_TIMEOUT_SECONDS = 60
SQLITE_BUSY_TIMEOUT_SECONDS = 30.0


def make_engine(database_url: str = DATABASE_URL) -> Engine:
    """Create a database engine with SQLite foreign keys enabled."""
    url = make_url(database_url)
    if url.drivername.startswith("sqlite") and url.database not in (None, ":memory:"):
        Path(url.database).resolve().parent.mkdir(parents=True, exist_ok=True)
    if url.drivername.startswith("sqlite"):
        engine = create_engine(
            database_url,
            connect_args={
                "check_same_thread": False,
                "timeout": SQLITE_BUSY_TIMEOUT_SECONDS,
            },
            pool_size=SQLITE_POOL_SIZE,
            max_overflow=SQLITE_MAX_OVERFLOW,
            pool_timeout=SQLITE_POOL_TIMEOUT_SECONDS,
        )
        event.listen(engine, "connect", _enable_sqlite_foreign_keys)
        return engine
    return create_engine(database_url)


def _enable_sqlite_foreign_keys(connection: object, record: object) -> None:
    del record
    cursor = connection.cursor()  # type: ignore[attr-defined]
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute(f"PRAGMA busy_timeout={int(SQLITE_BUSY_TIMEOUT_SECONDS * 1000)}")
    cursor.close()


engine = make_engine()
SessionFactory = sessionmaker(bind=engine, expire_on_commit=False)
_SQLITE_WRITE_LOCK = asyncio.Lock()


def get_session() -> Generator[Session, None, None]:
    """Yield one session per request."""
    with SessionFactory() as session:
        yield session


async def get_write_session(
    session: Annotated[Session, Depends(get_session)],
) -> AsyncGenerator[Session, None]:
    """Serialize API writes before they acquire a SQLite connection."""
    async with _SQLITE_WRITE_LOCK:
        try:
            yield session
        finally:
            session.rollback()
