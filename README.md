# AI Startup TODO

FastAPI 백엔드와 Next.js 프런트엔드로 구성된 팀 TODO 앱입니다.

| 폴더 | 내용 |
| --- | --- |
| [`backend/`](backend/) | FastAPI, SQLite, Alembic, API 테스트 |
| [`frontend/`](frontend/) | Next.js App Router, TODO 화면, 테마 설정 |

## 로컬 실행

1. `backend/`에서 `uv sync`와 `uv run alembic upgrade head`를 실행합니다.
2. 같은 폴더에서 `uv run uvicorn app.main:app --reload`로 API를 실행합니다.
3. `frontend/`에서 `npm install`을 실행하고 `.env.example`을 참고해 `TODO_API_BASE_URL`을 설정합니다. 기본값은 `http://127.0.0.1:8000`입니다.
4. `npm run dev`로 프런트엔드를 실행합니다. `/`에서 TODO 목록, `/settings`에서 테마를 볼 수 있습니다.

품질 검사는 백엔드에서 `uv run python scripts/check.py`, 프런트엔드에서 `npm run check`를 실행합니다. 세부 요구사항과 수동 시나리오는 각 폴더의 `docs/`에 있습니다.
