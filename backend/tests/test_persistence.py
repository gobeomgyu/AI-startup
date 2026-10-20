"""SQLite persistence and constraint tests."""

import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from sqlalchemy import event, select, text
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import make_engine
from app.models import Member

WORKER_COUNT = 40


def test_sqlite_data_survives_engine_restart(tmp_path: Path) -> None:
    """Persist rows on disk and enforce SQLite foreign keys after reconnect."""
    database_path = tmp_path / "todo.sqlite3"
    database_url = f"sqlite:///{database_path.as_posix()}"
    engine = make_engine(database_url)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Member(name="저장 확인"))
        session.commit()
    engine.dispose()

    restarted_engine = make_engine(database_url)
    with restarted_engine.connect() as connection:
        assert connection.execute(text("PRAGMA foreign_keys")).scalar_one() == 1
    with Session(restarted_engine) as session:
        assert session.scalar(select(Member.name)) == "저장 확인"
    restarted_engine.dispose()


def test_sqlite_pool_supports_concurrent_writes(tmp_path: Path) -> None:
    """Check out 40 connections together and serialize concurrent SQLite writes."""
    database_url = f"sqlite:///{(tmp_path / 'concurrent.sqlite3').as_posix()}"
    engine = make_engine(database_url)
    Base.metadata.create_all(engine)
    barrier = threading.Barrier(WORKER_COUNT)
    counter_lock = threading.Lock()
    counts = {"active": 0, "peak": 0}

    def on_checkout(
        dbapi_connection: object,
        connection_record: object,
        connection_proxy: object,
    ) -> None:
        del dbapi_connection, connection_record, connection_proxy
        with counter_lock:
            counts["active"] += 1
            counts["peak"] = max(counts["peak"], counts["active"])

    def on_checkin(dbapi_connection: object, connection_record: object) -> None:
        del dbapi_connection, connection_record
        with counter_lock:
            counts["active"] -= 1

    event.listen(engine, "checkout", on_checkout)
    event.listen(engine, "checkin", on_checkin)

    def insert_member(index: int) -> None:
        with Session(engine) as session:
            session.connection()
            barrier.wait(timeout=30)
            session.add(Member(name=f"member-{index}"))
            session.commit()

    with ThreadPoolExecutor(max_workers=WORKER_COUNT) as executor:
        futures = [
            executor.submit(insert_member, index) for index in range(WORKER_COUNT)
        ]
        for future in futures:
            future.result(timeout=45)

    assert counts["peak"] == WORKER_COUNT
    assert counts["active"] == 0
    with Session(engine) as session:
        assert len(session.scalars(select(Member.id)).all()) == WORKER_COUNT
    engine.dispose()
