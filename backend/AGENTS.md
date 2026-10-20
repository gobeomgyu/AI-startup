# 프로젝트 작업 지침

## 프로젝트 개요

- 소규모 팀용 Todo 백엔드 프로젝트다.
- Python 3.11, FastAPI, SQLite를 사용한다.
- 로그인·인증·권한, 실시간 기능은 요구사항에 포함되지 않는다.
- 작업 상태는 `todo`(할 일), `in_progress`(진행 중), `done`(완료) 세 가지로 고정한다.
- 팀원은 앱에서 관리하는 명단으로 추가·조회·수정·삭제하며, 작업 담당자는 이 명단에서 지정한다.
- 제품 및 기술 요구사항은 `docs/PRD.md`, `docs/TSD.md`, `docs/DATABASE.md`를 따른다. 문서에서 제안·미확정으로 표시된 항목은 합의된 요구사항으로 간주하지 않는다.

## Python 환경과 의존성

- Python 환경과 패키지 관리는 `uv`로 한다.
- 프로젝트 가상환경은 루트의 `.venv`이며, 의존성 명세는 `pyproject.toml`, 잠금 파일은 `uv.lock`이다.
- 환경 생성 또는 동기화에는 `uv sync`를 사용한다.
- 패키지 추가·삭제 시 `uv add` 또는 `uv remove`를 사용해 `pyproject.toml`과 `uv.lock`을 함께 갱신한다. 잠금 파일을 수동 편집하지 않는다.
- Windows에서 uv 실행 파일이 PATH에 없으면 `python -m uv ...`를 사용할 수 있다.
- `.venv`와 로컬 SQLite 파일은 버전 관리에 포함하지 않는다. `uv.lock`은 커밋 대상이다.
- 앱 실행 명령은 `uv run uvicorn app.main:app --reload`이다. 앱 엔트리포인트가 아직 없으면 먼저 TSD의 앱 구조에 맞춰 구현한다.
- Ruff는 모든 안정화된 린트 규칙(`ALL`)과 포매터를 사용하고, Mypy는 strict 모드로 사용한다. 예외는 formatter와 충돌하는 규칙 및 테스트의 `assert`처럼 설정에 명시된 항목으로 제한한다.
- 작업 시 `docs/AGENT_WORKFLOW.md`의 짧은 테스트 우선 루프를 따른다. 기능 단위 테스트를 먼저 작성·수정하고 원인을 고쳐 통과시킨다. 테스트를 삭제·약화해 통과시키지 않는다.
- 통합 품질 게이트는 `uv run python scripts/check.py` 하나로 실행한다. 자동 수정은 `uv run ruff check --fix .`와 `uv run ruff format .`을 사용한다.
- 새 Ruff/Mypy 오류는 원인을 수정한다. `noqa`, `type: ignore`, 전역 ignore를 추가할 때는 특정 규칙/오류 코드와 필요한 이유를 함께 적는다.
- `.pre-commit-config.yaml`의 로컬 Git hook은 모든 커밋에서 동일한 `scripts/check.py` 품질 게이트를 실행한다. 테스트가 없거나 검사에 실패하면 커밋을 진행할 수 없다.
- 새 clone에서 hook 설치: `python -m uv run pre-commit install`. 전체 파일에 수동 실행: `python -m uv run pre-commit run --all-files`.

## 구현 원칙

- 변경 전 관련 문서와 기존 코드 구조를 확인한다.
- API 입력·출력은 Pydantic 스키마로 검증하고, DB 접근은 SQLAlchemy를 사용한다.
- SQLite 외래 키 검사를 활성화하고 스키마 변경은 Alembic 마이그레이션으로 관리한다.
- 요구사항에 없는 인증, 권한, 실시간 동작을 임의로 추가하지 않는다.
- 삭제 정책, 태그 중복 규칙 등 미확정 동작을 구현해야 할 때는 문서에 결정 사항을 먼저 반영한다.
- 작업 완료 시 변경 파일과 수행한 확인 내용을 간단히 보고한다.
