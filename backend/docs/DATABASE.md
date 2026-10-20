# DATABASE: Todo 앱 SQLite 설계

## 1. 개요

단일 로컬 SQLite 데이터베이스에 팀원, 작업, 태그를 저장한다. 팀 규모가 작으므로 사용자 인증 테이블과 권한 테이블은 두지 않는다. 제품 동작은 PRD에서 확정한 규칙을 따른다.

## 2. 엔티티 관계

```text
members 1 ───── 0..N tasks
tasks   N ───── N tags
         (task_tags 연결 테이블)
```

작업의 담당자는 선택 사항이다. 한 작업에 담당자는 최대 한 명이다. 한 팀원은 여러 작업을 맡을 수 있다.

## 3. 테이블

### `members`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | INTEGER | PK | 팀원 ID |
| `name` | TEXT | NOT NULL | 표시 이름 |
| `created_at` | DATETIME | NOT NULL | 생성 시각(UTC) |
| `updated_at` | DATETIME | NOT NULL | 수정 시각(UTC) |

팀원 이름은 중복을 허용한다.

### `tasks`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | INTEGER | PK | 작업 ID |
| `title` | TEXT | NOT NULL | 작업 제목 |
| `description` | TEXT | NULL | 상세 설명 |
| `assignee_id` | INTEGER | NULL, FK → `members.id` | 담당 팀원 |
| `due_date` | DATE | NULL | 마감일 |
| `priority` | TEXT | NOT NULL | `낮음`, `보통`, `높음` 중 하나 |
| `status` | TEXT | NOT NULL | `todo`, `in_progress`, `done` 중 하나 |
| `created_at` | DATETIME | NOT NULL | 생성 시각(UTC) |
| `updated_at` | DATETIME | NOT NULL | 수정 시각(UTC) |

상태 기본값은 `todo`, 우선순위 기본값은 `보통`이다. DB 체크 제약과 애플리케이션 검증으로 허용값을 제한한다.

### `tags`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | INTEGER | PK | 태그 ID |
| `name` | TEXT | NOT NULL | 태그명 |
| `normalized_name` | TEXT | NOT NULL, UNIQUE | 공백 제거 후 casefold한 비교 키 |
| `created_at` | DATETIME | NOT NULL | 생성 시각(UTC) |

태그 이름은 앞뒤 공백을 제거하고 대소문자 구분 없이 비교한다. 정규화한 이름에 UNIQUE 제약을 적용한다. 작업에서 태그 배열을 지정하면 태그 연결을 전체 교체하며, 미사용 태그는 보존한다.

### `task_tags`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `task_id` | INTEGER | PK 일부, FK → `tasks.id` | 작업 ID |
| `tag_id` | INTEGER | PK 일부, FK → `tags.id` | 태그 ID |

복합 기본키는 (`task_id`, `tag_id`)로 하여 같은 태그가 같은 작업에 중복 연결되지 않게 한다.

## 4. 관계 및 삭제 정책 제안

- `tasks.assignee_id` → `members.id`: 팀원을 삭제하면 작업은 보존하고 담당자만 NULL로 변경 (`ON DELETE SET NULL`).
- `task_tags.task_id` → `tasks.id`: 작업 삭제 시 연결 행 삭제 (`ON DELETE CASCADE`).
- `task_tags.tag_id` → `tags.id`: 태그 삭제 시 연결 행 삭제 (`ON DELETE CASCADE`).
- 작업 삭제는 영구 삭제한다.

팀원 삭제와 작업 삭제 정책은 제품 결정 전 제안이며 확정 사항이 아니다.

## 5. 인덱스 제안

- `tasks.assignee_id`
- `tasks.status`
- `tasks.due_date`
- `tasks.priority`
- `task_tags.tag_id`

목록 조회 요구와 데이터 양을 확인해 실제로 필요한 인덱스만 유지한다.

## 6. 마이그레이션 및 무결성

- 스키마 변경은 Alembic 마이그레이션으로 관리하는 것을 제안한다.
- SQLite 연결 시 외래 키 제약 검사를 활성화한다.
- 다중 테이블 변경은 트랜잭션 안에서 처리한다.
- SQLite 데이터 파일과 마이그레이션 파일은 로컬 실행 경로 및 백업 방법을 문서화한다.

## 7. 확정이 필요한 데이터 결정

모든 데이터 동작은 PRD에 확정되어 있다.
