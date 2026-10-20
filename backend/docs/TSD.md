# TSD: Todo 앱 기술 설계

## 1. 목적과 설계 원칙

PRD의 요구사항을 로컬에서 실행 가능한 FastAPI 백엔드로 구현하기 위한 기술 설계다. 구조는 단순하게 유지하고, API·검증·데이터 접근 책임을 분리한다.

## 2. 기술 스택

| 영역 | 선택 |
|---|---|
| 언어 | Python 3.11 |
| API 프레임워크 | FastAPI |
| 요청·응답 검증 | Pydantic (FastAPI 호환 버전) |
| 데이터베이스 | SQLite |
| ORM | SQLAlchemy 2.x |
| 스키마 마이그레이션 | Alembic |
| ASGI 서버 | Uvicorn |
| Python 환경 및 패키지 관리 | uv |
| API 문서 | FastAPI 내장 Swagger UI 및 OpenAPI |

의존성은 `pyproject.toml`에서 관리하고, 재현 가능한 설치를 위해 `uv.lock`을 함께 유지한다. 설치 시에는 lock 파일 기준으로 동기화한다.

## 3. Python 환경 및 로컬 실행

- 프로젝트 Python 요구 버전은 `>=3.11`이며, 현재 로컬 환경은 Python 3.11을 사용한다.
- uv가 프로젝트 루트의 `.venv` 가상환경을 생성하고 사용한다.
- 새 환경 구성 또는 의존성 설치: `uv sync`
- 의존성 추가: `uv add <패키지>`; 개발 전용 의존성은 `uv add --dev <패키지>`
- 앱 실행(마이그레이션 적용 후): `uv run uvicorn app.main:app --reload`
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`
- uv가 PATH에 등록되지 않은 Windows 셸에서는 `python -m uv sync`, `python -m uv run ...` 형태로 실행할 수 있다.
- `.venv`와 로컬 SQLite 데이터 파일은 버전 관리 대상에서 제외하고, `uv.lock`은 저장소에 포함한다.

## 4. 애플리케이션 구성 제안

```text
app/
  main.py                 # FastAPI 앱 생성, 라우터 등록
  core/config.py          # SQLite URL 등 설정
  db/session.py           # 엔진, 세션, 요청별 세션 의존성
  models/                 # SQLAlchemy 모델
  schemas/                # Pydantic 요청·응답 스키마
  repositories/           # DB 조회·저장 로직
  api.py                  # 작업 및 팀원 라우터
  services/               # 여러 저장소를 조합하는 규칙(필요 시)
alembic/                  # DB 마이그레이션
docs/
```

소규모 앱에 불필요한 추상화를 추가하지 않는다. CRUD가 단순하면 서비스 계층을 생략할 수 있다.

## 5. API 설계 초안

기본 경로 접두사는 `/api/v1`로 제안한다.

| 메서드 | 경로 | 동작 |
|---|---|---|
| GET | `/api/v1/tasks` | 작업 목록 조회 |
| POST | `/api/v1/tasks` | 작업 생성 |
| GET | `/api/v1/tasks/{task_id}` | 작업 상세 조회 |
| PATCH | `/api/v1/tasks/{task_id}` | 작업 일부 수정 |
| DELETE | `/api/v1/tasks/{task_id}` | 작업 삭제 |
| GET | `/api/v1/members` | 팀원 목록 조회 |
| POST | `/api/v1/members` | 팀원 생성 |
| GET | `/api/v1/members/{member_id}` | 팀원 상세 조회 |
| PATCH | `/api/v1/members/{member_id}` | 팀원 수정 |
| DELETE | `/api/v1/members/{member_id}` | 팀원 삭제 |

작업 목록은 필터·정렬·페이지네이션 없이 전체 작업을 반환한다. 미존재 ID는 `404`, 입력 검증 실패는 FastAPI 기본 `422` 응답을 사용한다. 생성은 `201`, 삭제 성공은 `204`를 반환한다. 태그는 작업 입력의 문자열 배열로 생성·연결하며 독립 CRUD는 제공하지 않는다.

## 6. 데이터 검증과 동작

- 제목은 공백만으로 구성될 수 없도록 검증한다.
- 담당자 ID가 있으면 해당 팀원이 존재하는지 확인한다.
- 상태는 세 가지 허용값으로 제한한다: `todo`, `in_progress`, `done` (화면 표시는 각각 `할 일`, `진행 중`, `완료`).
- 우선순위는 `낮음`, `보통`, `높음` enum으로 제한하며 기본값은 `보통`이다.
- 태그 이름은 앞뒤 공백을 제거하고 대소문자 구분 없이 비교한다. PATCH에 배열을 보내면 전체 교체하고 미사용 태그는 보존한다.
- 마감일은 ISO 8601 `YYYY-MM-DD` 날짜로 노출한다.
- SQLite 외래 키 검사를 연결 시 활성화한다.

## 7. 오류와 응답

성공 응답은 리소스 스키마를 일관되게 반환한다. 오류는 FastAPI의 표준 오류 구조를 기본으로 하고, 필요하면 코드와 메시지를 포함하는 공통 형식으로 정리한다. DB 내부 오류나 스택 트레이스를 응답에 노출하지 않는다.

## 8. 로컬 설정

- SQLite 파일 위치를 프로젝트 설정에 명시한다.
- DB URL은 `TODO_DATABASE_URL` 환경 변수로 재정의할 수 있으며 기본값은 프로젝트 `.local/todo.sqlite3`이다.
- 새 환경에서는 `uv run alembic upgrade head`로 스키마를 만든 뒤 앱을 실행한다. 앱은 시작 시 자동 마이그레이션하지 않는다.
- SQLite 연결 풀은 기본 5개와 최대 35개 초과 연결을 허용해 최대 40개 연결을 지원한다. 잠금 대기는 최대 30초, 풀 체크아웃 대기는 최대 60초다. API 쓰기는 연결을 얻기 전에 프로세스 내에서 직렬화해 SQLite 단일 작성자 경합을 줄인다. 이 로컬 설정은 단일 서버 프로세스를 기준으로 한다.
- CORS 허용 출처는 프론트엔드가 정해지면 로컬 개발 주소만 설정한다. 프론트엔드가 없는 경우 CORS 설정은 보류한다.

## 9. 구현 단계

1. 프로젝트·의존성·설정 구성
2. SQLite 모델 및 마이그레이션 구성
3. 팀원 CRUD 구현
4. 태그 데이터 구조와 작업 CRUD 구현
5. Swagger 설명과 실행 안내 정리
