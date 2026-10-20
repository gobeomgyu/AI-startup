"""Pydantic API schemas."""

from datetime import date, datetime
from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator

EMPTY_NAME_ERROR = "이름은 공백일 수 없습니다"
EMPTY_TITLE_ERROR = "제목은 공백일 수 없습니다"
EMPTY_TAG_ERROR = "태그 이름은 공백일 수 없습니다"
NULL_ENUM_ERROR = "상태와 우선순위는 null일 수 없습니다"


class Status(StrEnum):
    """Supported task states."""

    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class Priority(StrEnum):
    """Supported task priorities."""

    LOW = "낮음"
    NORMAL = "보통"
    HIGH = "높음"


class MemberCreate(BaseModel):
    """Member creation input."""

    name: Annotated[str, Field(min_length=1, max_length=200)]

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        """Trim whitespace and reject an empty name."""
        value = value.strip()
        if not value:
            raise ValueError(EMPTY_NAME_ERROR)
        return value


class MemberPatch(BaseModel):
    """Partial member update input."""

    name: Annotated[str, Field(min_length=1, max_length=200)] | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        """Trim an updated name and reject an empty value."""
        if value is None:
            raise ValueError(EMPTY_NAME_ERROR)
        value = value.strip()
        if not value:
            raise ValueError(EMPTY_NAME_ERROR)
        return value


class MemberRead(BaseModel):
    """Member response model."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime
    updated_at: datetime


class TaskCreate(BaseModel):
    """Task creation input."""

    title: Annotated[str, Field(min_length=1, max_length=300)]
    description: str | None = None
    assignee_id: int | None = None
    due_date: date | None = None
    priority: Priority = Priority.NORMAL
    status: Status = Status.TODO
    tags: list[Annotated[str, Field(min_length=1, max_length=100)]] = Field(
        default_factory=list
    )

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        """Trim whitespace and reject an empty title."""
        value = value.strip()
        if not value:
            raise ValueError(EMPTY_TITLE_ERROR)
        return value

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, values: list[str]) -> list[str]:
        """Trim tag names and remove duplicates while preserving order."""
        cleaned = [value.strip() for value in values]
        if any(not value for value in cleaned):
            raise ValueError(EMPTY_TAG_ERROR)
        result: dict[str, str] = {}
        for value in cleaned:
            result.setdefault(value.casefold(), value)
        return list(result.values())


class TaskPatch(BaseModel):
    """Partial task update input."""

    title: Annotated[str, Field(min_length=1, max_length=300)] | None = None
    description: str | None = None
    assignee_id: int | None = None
    due_date: date | None = None
    priority: Priority | None = None
    status: Status | None = None
    tags: list[Annotated[str, Field(min_length=1, max_length=100)]] = Field(
        default_factory=list
    )

    @field_validator("priority", "status")
    @classmethod
    def validate_non_nullable_fields(
        cls, value: Priority | Status | None
    ) -> Priority | Status:
        """Reject null for fields that have required values."""
        if value is None:
            raise ValueError(NULL_ENUM_ERROR)
        return value

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        """Trim an updated title and reject an empty value."""
        if value is None:
            raise ValueError(EMPTY_TITLE_ERROR)
        value = value.strip()
        if not value:
            raise ValueError(EMPTY_TITLE_ERROR)
        return value

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, values: list[str]) -> list[str]:
        """Trim updated tags and remove duplicates while preserving order."""
        cleaned = [value.strip() for value in values]
        if any(not value for value in cleaned):
            raise ValueError(EMPTY_TAG_ERROR)
        result: dict[str, str] = {}
        for value in cleaned:
            result.setdefault(value.casefold(), value)
        return list(result.values())


class TaskRead(BaseModel):
    """Task response model."""

    id: int
    title: str
    description: str | None
    assignee_id: int | None
    due_date: date | None
    priority: Priority
    status: Status
    tags: list[str]
    created_at: datetime
    updated_at: datetime
