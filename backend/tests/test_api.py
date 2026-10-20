"""API behavior tests based on the product test cases."""

from fastapi.testclient import TestClient
from starlette import status

CREATED = status.HTTP_201_CREATED
OK = status.HTTP_200_OK
NO_CONTENT = status.HTTP_204_NO_CONTENT
NOT_FOUND = status.HTTP_404_NOT_FOUND
UNPROCESSABLE = status.HTTP_422_UNPROCESSABLE_CONTENT


def test_member_crud_and_delete_unassigns_tasks(client: TestClient) -> None:
    """Exercise member CRUD and the assignee clearing delete policy."""
    member_response = client.post("/api/v1/members", json={"name": "김민수"})
    assert member_response.status_code == CREATED
    member = member_response.json()
    assert member["name"] == "김민수"

    task_response = client.post(
        "/api/v1/tasks", json={"title": "준비", "assignee_id": member["id"]}
    )
    assert task_response.status_code == CREATED
    task_id = task_response.json()["id"]

    assert client.get("/api/v1/members").status_code == OK
    assert client.get(f"/api/v1/members/{member['id']}").status_code == OK
    assert (
        client.patch(
            f"/api/v1/members/{member['id']}", json={"name": "김민수(기획)"}
        ).json()["name"]
        == "김민수(기획)"
    )
    deleted = client.delete(f"/api/v1/members/{member['id']}")
    assert deleted.status_code == NO_CONTENT
    assert deleted.content == b""
    assert client.get(f"/api/v1/tasks/{task_id}").json()["assignee_id"] is None


def test_member_validation_and_missing_ids(client: TestClient) -> None:
    """Reject invalid member inputs and report unknown member IDs."""
    assert client.post("/api/v1/members", json={}).status_code == UNPROCESSABLE
    assert (
        client.post("/api/v1/members", json={"name": "  "}).status_code == UNPROCESSABLE
    )
    member = client.post("/api/v1/members", json={"name": "민수"}).json()
    assert (
        client.patch(f"/api/v1/members/{member['id']}", json={"name": None}).status_code
        == UNPROCESSABLE
    )
    assert client.get("/api/v1/members/999").status_code == NOT_FOUND
    assert (
        client.patch("/api/v1/members/999", json={"name": "A"}).status_code == NOT_FOUND
    )
    assert client.delete("/api/v1/members/999").status_code == NOT_FOUND


def test_task_crud_tags_and_patch_replacement(client: TestClient) -> None:
    """Exercise task CRUD, tag normalization, and replacement behavior."""
    member = client.post("/api/v1/members", json={"name": "김민수"}).json()
    created = client.post(
        "/api/v1/tasks",
        json={
            "title": "기능 검토",
            "assignee_id": member["id"],
            "due_date": "2026-11-30",
            "priority": "높음",
            "status": "in_progress",
            "tags": [" 기획 ", "Review", "review", "Straße", "STRASSE"],
        },
    )
    assert created.status_code == CREATED
    task = created.json()
    task_id = task["id"]
    assert task["priority"] == "높음"
    assert task["tags"] == ["기획", "Review", "Straße"]

    listed = client.get("/api/v1/tasks")
    assert listed.status_code == OK
    assert len(listed.json()) == 1
    assert client.get(f"/api/v1/tasks/{task_id}").status_code == OK

    patched = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "done", "tags": [" 검토 "], "assignee_id": None},
    )
    assert patched.status_code == OK
    assert patched.json()["status"] == "done"
    assert patched.json()["title"] == "기능 검토"
    assert patched.json()["assignee_id"] is None
    assert patched.json()["tags"] == ["검토"]

    kept_tags = client.post("/api/v1/tasks", json={"title": "다른 작업"}).json()
    retained = client.post(
        "/api/v1/tasks", json={"title": "재사용", "tags": ["검토"]}
    ).json()
    assert kept_tags["tags"] == []
    assert retained["tags"] == ["검토"]

    deleted = client.delete(f"/api/v1/tasks/{task_id}")
    assert deleted.status_code == NO_CONTENT
    assert deleted.content == b""
    assert client.get(f"/api/v1/tasks/{task_id}").status_code == NOT_FOUND


def test_task_validation_and_missing_ids(client: TestClient) -> None:
    """Reject invalid task fields and report unknown task IDs."""
    assert client.post("/api/v1/tasks", json={}).status_code == UNPROCESSABLE
    assert (
        client.post("/api/v1/tasks", json={"title": "  "}).status_code == UNPROCESSABLE
    )
    for invalid in (
        {"title": "상태", "status": "blocked"},
        {"title": "우선순위", "priority": "긴급"},
        {"title": "담당자", "assignee_id": 999},
        {"title": "날짜", "due_date": "2026-13-45"},
        {"title": "태그", "tags": ["   "]},
        {"title": "널 상태", "status": None},
        {"title": "널 우선순위", "priority": None},
        {"title": None},
        {"title": "널 태그", "tags": None},
    ):
        assert client.post("/api/v1/tasks", json=invalid).status_code == UNPROCESSABLE
    assert client.get("/api/v1/tasks/999").status_code == NOT_FOUND
    assert (
        client.patch("/api/v1/tasks/999", json={"title": "수정"}).status_code
        == NOT_FOUND
    )
    assert client.delete("/api/v1/tasks/999").status_code == NOT_FOUND


def test_task_defaults_and_partial_patch(client: TestClient) -> None:
    """Use task defaults and preserve omitted fields on patch."""
    created = client.post("/api/v1/tasks", json={"title": "기본 작업"})
    assert created.status_code == CREATED
    task = created.json()
    assert task["status"] == "todo"
    assert task["priority"] == "보통"
    assert task["assignee_id"] is None
    assert task["due_date"] is None

    updated = client.patch(f"/api/v1/tasks/{task['id']}", json={"description": "내용"})
    assert updated.status_code == OK
    assert updated.json()["title"] == "기본 작업"
    assert updated.json()["description"] == "내용"
    assert updated.json()["tags"] == []
