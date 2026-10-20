"""Versioned REST API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_session, get_write_session
from app.models import Member, Tag, Task
from app.schemas import (
    MemberCreate,
    MemberPatch,
    MemberRead,
    Priority,
    Status,
    TaskCreate,
    TaskPatch,
    TaskRead,
)

router = APIRouter(prefix="/api/v1")
SessionDependency = Annotated[Session, Depends(get_session)]
WriteSessionDependency = Annotated[Session, Depends(get_write_session)]


def _member_or_404(session: Session, member_id: int) -> Member:
    member = session.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="팀원을 찾을 수 없습니다")
    return member


def _task_or_404(session: Session, task_id: int) -> Task:
    task = session.scalar(
        select(Task).where(Task.id == task_id).options(selectinload(Task.tags))
    )
    if task is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다")
    return task


def _tags_for(session: Session, names: list[str]) -> list[Tag]:
    tags: list[Tag] = []
    for name in names:
        normalized_name = name.casefold()
        tag = session.scalar(select(Tag).where(Tag.normalized_name == normalized_name))
        if tag is None:
            tag = Tag(name=name, normalized_name=normalized_name)
            session.add(tag)
            session.flush()
        tags.append(tag)
    return tags


def _task_read(task: Task) -> TaskRead:
    return TaskRead(
        id=task.id,
        title=task.title,
        description=task.description,
        assignee_id=task.assignee_id,
        due_date=task.due_date,
        priority=Priority(task.priority),
        status=Status(task.status),
        tags=[tag.name for tag in task.tags],
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.get("/members", response_model=list[MemberRead])
def list_members(session: SessionDependency) -> list[Member]:
    """List all members."""
    return list(session.scalars(select(Member).order_by(Member.id)).all())


@router.post("/members", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
def create_member(payload: MemberCreate, session: WriteSessionDependency) -> Member:
    """Create a member."""
    member = Member(name=payload.name)
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@router.get("/members/{member_id}", response_model=MemberRead)
def get_member(member_id: int, session: SessionDependency) -> Member:
    """Get one member."""
    return _member_or_404(session, member_id)


@router.patch("/members/{member_id}", response_model=MemberRead)
def patch_member(
    member_id: int, payload: MemberPatch, session: WriteSessionDependency
) -> Member:
    """Update part of a member."""
    member = _member_or_404(session, member_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    session.commit()
    session.refresh(member)
    return member


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(member_id: int, session: WriteSessionDependency) -> Response:
    """Delete a member and clear task assignments."""
    member = _member_or_404(session, member_id)
    session.delete(member)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/tasks")
def list_tasks(session: SessionDependency) -> list[TaskRead]:
    """List all tasks."""
    tasks = session.scalars(
        select(Task).order_by(Task.id).options(selectinload(Task.tags))
    ).all()
    return [_task_read(task) for task in tasks]


@router.post("/tasks", status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, session: WriteSessionDependency) -> TaskRead:
    """Create a task."""
    if (
        payload.assignee_id is not None
        and session.get(Member, payload.assignee_id) is None
    ):
        raise HTTPException(status_code=422, detail="담당 팀원이 존재하지 않습니다")
    task = Task(
        title=payload.title,
        description=payload.description,
        assignee_id=payload.assignee_id,
        due_date=payload.due_date,
        priority=payload.priority.value,
        status=payload.status.value,
        tags=_tags_for(session, payload.tags),
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return _task_read(task)


@router.get("/tasks/{task_id}")
def get_task(task_id: int, session: SessionDependency) -> TaskRead:
    """Get one task."""
    return _task_read(_task_or_404(session, task_id))


@router.patch("/tasks/{task_id}")
def patch_task(
    task_id: int, payload: TaskPatch, session: WriteSessionDependency
) -> TaskRead:
    """Update selected task fields and optionally replace tag links."""
    task = _task_or_404(session, task_id)
    changes = payload.model_dump(exclude_unset=True)
    if (
        "assignee_id" in changes
        and changes["assignee_id"] is not None
        and session.get(Member, changes["assignee_id"]) is None
    ):
        raise HTTPException(status_code=422, detail="담당 팀원이 존재하지 않습니다")
    if "tags" in changes:
        names = changes.pop("tags")
        if names is not None:
            task.tags = _tags_for(session, names)
    for field, value in changes.items():
        setattr(task, field, value.value if hasattr(value, "value") else value)
    session.commit()
    session.refresh(task)
    return _task_read(task)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, session: WriteSessionDependency) -> Response:
    """Permanently delete a task."""
    task = _task_or_404(session, task_id)
    session.delete(task)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
