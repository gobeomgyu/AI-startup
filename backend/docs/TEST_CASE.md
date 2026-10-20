# Test Cases: 소규모 팀 Todo 앱

## 1. 목적 및 기준

PRD에 정의된 작업·팀원 CRUD 및 필수 필드, 담당자, 마감일, 우선순위, 고정 상태, 태그 동작을 확인한다. 각 항목은 실행 후 체크한다.

- API 경로는 TSD 초안의 `/api/v1` 기준이다.
- 성공 응답 형식은 JSON이며 예시의 ID와 시각은 실제 응답 값에 맞춰 비교한다.
- `priority`는 `낮음`, `보통`, `높음`이며 기본값은 `보통`이다.
- 상태 값은 API에서 `todo`, `in_progress`, `done`을 사용하고, 화면 표시는 각각 `할 일`, `진행 중`, `완료`로 한다.
- 태그는 작업 요청의 문자열 배열로 전달한다. 앞뒤 공백을 제거하고 대소문자를 무시해 중복을 정리하며, PATCH 배열은 기존 태그 연결 전체를 교체한다. 미사용 태그는 보존한다.
- 팀원 삭제 시 담당 작업은 보존하고 담당자만 비운다. 작업 삭제는 영구 삭제한다.
- 오류 응답은 TSD 제안에 따라 미존재 ID에 `404`, 필드 검증 실패에 `422`를 사용한다.

## 2. 작업 API 테스트 케이스

### TC-TASK-001 — 필수 제목만으로 작업 생성

- [ ] **유형:** 성공
- **Endpoint:** `POST /api/v1/tasks`
- **Request:** `{"title":"주간 회의 준비"}`
- **Expected response:** `201 Created`; 생성된 작업 JSON에 ID와 제목이 포함되고, 상태는 기본값 `todo`, 우선순위는 기본값 `보통`, 담당자·마감일·설명은 미지정 상태다.

### TC-TASK-002 — 전체 작업 정보로 생성

- [ ] **유형:** 성공
- **사전 조건:** 팀원 `id=1`이 존재한다.
- **Endpoint:** `POST /api/v1/tasks`
- **Request:** `{"title":"기능 검토","description":"요구사항 확인","assignee_id":1,"due_date":"2026-11-30","priority":"높음","status":"in_progress","tags":["기획","검토"]}`
- **Expected response:** `201 Created`; 응답 작업에 요청한 제목·설명·담당자·마감일·우선순위·상태·태그가 반영된다.

### TC-TASK-003 — 작업 목록 조회

- [ ] **유형:** 성공
- **사전 조건:** 작업이 두 건 이상 저장되어 있다.
- **Endpoint:** `GET /api/v1/tasks`
- **Request:** 없음
- **Expected response:** `200 OK`; 작업 배열에 저장된 작업이 포함되고 각 항목에 ID, 제목, 담당자, 마감일, 우선순위, 상태, 태그 정보가 반환된다.

### TC-TASK-004 — 작업 상세 조회

- [ ] **유형:** 성공
- **사전 조건:** `id=1` 작업이 존재한다.
- **Endpoint:** `GET /api/v1/tasks/1`
- **Request:** 없음
- **Expected response:** `200 OK`; 해당 ID의 상세 정보가 반환된다.

### TC-TASK-005 — 작업 일부 수정 및 완료 처리

- [ ] **유형:** 성공
- **사전 조건:** `id=1` 작업이 존재한다.
- **Endpoint:** `PATCH /api/v1/tasks/1`
- **Request:** `{"status":"done","description":"검토 완료"}`
- **Expected response:** `200 OK`; 상태가 `done`, 설명이 `검토 완료`로 변경되고 나머지 필드는 유지된다.

### TC-TASK-006 — 담당자 해제

- [ ] **유형:** 성공
- **사전 조건:** 담당자가 지정된 `id=1` 작업이 존재한다.
- **Endpoint:** `PATCH /api/v1/tasks/1`
- **Request:** `{"assignee_id":null}`
- **Expected response:** `200 OK`; 작업은 유지되고 담당자 값은 `null`이다.

### TC-TASK-007 — 작업 삭제

- [ ] **유형:** 성공
- **사전 조건:** `id=1` 작업이 존재한다.
- **Endpoint:** `DELETE /api/v1/tasks/1`
- **Request:** 없음
- **Expected response:** `204 No Content`; 응답 본문은 비어 있고 삭제 후 상세 조회는 `404 Not Found`를 반환한다.

### TC-TASK-008 — 제목 없이 생성 시도

- [ ] **유형:** 실패
- **Endpoint:** `POST /api/v1/tasks`
- **Request:** `{"description":"제목 누락"}`
- **Expected response:** `422 Unprocessable Entity`; 제목 필수 검증 오류가 반환되고 작업은 생성되지 않는다.

### TC-TASK-009 — 공백 제목 생성 시도

- [ ] **유형:** 실패
- **Endpoint:** `POST /api/v1/tasks`
- **Request:** `{"title":"   "}`
- **Expected response:** `422 Unprocessable Entity`; 제목 검증 오류가 반환되고 작업은 생성되지 않는다.

### TC-TASK-010 — 허용되지 않은 상태로 생성 시도

- [ ] **유형:** 실패
- **Endpoint:** `POST /api/v1/tasks`
- **Request:** `{"title":"잘못된 상태","status":"blocked"}`
- **Expected response:** `422 Unprocessable Entity`; 상태가 `todo`, `in_progress`, `done` 중 하나여야 한다는 검증 오류가 반환된다.

### TC-TASK-011 — 허용되지 않은 우선순위로 생성 시도

- [ ] **유형:** 실패
- **Endpoint:** `POST /api/v1/tasks`
- **Request:** `{"title":"잘못된 우선순위","priority":"긴급"}`
- **Expected response:** `422 Unprocessable Entity`; 우선순위 허용값 검증 오류가 반환된다.

### TC-TASK-012 — 존재하지 않는 팀원을 담당자로 지정

- [ ] **유형:** 실패
- **Endpoint:** `POST /api/v1/tasks`
- **Request:** `{"title":"담당자 검증","assignee_id":999999}`
- **Expected response:** `422 Unprocessable Entity`; 유효하지 않은 담당자 참조 오류가 반환되고 작업은 생성되지 않는다.

### TC-TASK-013 — 존재하지 않는 작업 조회

- [ ] **유형:** 실패
- **Endpoint:** `GET /api/v1/tasks/999999`
- **Request:** 없음
- **Expected response:** `404 Not Found`; 작업 미존재 오류가 반환된다.

### TC-TASK-014 — 존재하지 않는 작업 수정

- [ ] **유형:** 실패
- **Endpoint:** `PATCH /api/v1/tasks/999999`
- **Request:** `{"title":"수정 시도"}`
- **Expected response:** `404 Not Found`; 작업 미존재 오류가 반환된다.

### TC-TASK-015 — 존재하지 않는 작업 삭제

- [ ] **유형:** 실패
- **Endpoint:** `DELETE /api/v1/tasks/999999`
- **Request:** 없음
- **Expected response:** `404 Not Found`; 작업 미존재 오류가 반환된다.

## 3. 팀원 API 테스트 케이스

### TC-MEMBER-001 — 팀원 생성

- [ ] **유형:** 성공
- **Endpoint:** `POST /api/v1/members`
- **Request:** `{"name":"김민수"}`
- **Expected response:** `201 Created`; 새 팀원의 ID와 이름이 반환된다.

### TC-MEMBER-002 — 팀원 목록 조회

- [ ] **유형:** 성공
- **사전 조건:** 팀원이 한 명 이상 저장되어 있다.
- **Endpoint:** `GET /api/v1/members`
- **Request:** 없음
- **Expected response:** `200 OK`; 저장된 팀원 목록이 반환된다.

### TC-MEMBER-003 — 팀원 상세 조회

- [ ] **유형:** 성공
- **사전 조건:** `id=1` 팀원이 존재한다.
- **Endpoint:** `GET /api/v1/members/1`
- **Request:** 없음
- **Expected response:** `200 OK`; 해당 팀원의 ID와 이름이 반환된다.

### TC-MEMBER-004 — 팀원 이름 수정

- [ ] **유형:** 성공
- **사전 조건:** `id=1` 팀원이 존재한다.
- **Endpoint:** `PATCH /api/v1/members/1`
- **Request:** `{"name":"김민수(기획)"}`
- **Expected response:** `200 OK`; 팀원 이름이 수정되고 ID는 유지된다.

### TC-MEMBER-005 — 담당 작업이 있는 팀원 삭제

- [ ] **유형:** 성공
- **사전 조건:** `id=1` 팀원이 존재하고 이 팀원이 담당하는 작업이 있다.
- **Endpoint:** `DELETE /api/v1/members/1`
- **Request:** 없음
- **Expected response:** `204 No Content`; 팀원은 삭제되고 담당 작업은 유지되며 `assignee_id`는 `null`이 된다.

### TC-MEMBER-006 — 이름 없이 팀원 생성 시도

- [ ] **유형:** 실패
- **Endpoint:** `POST /api/v1/members`
- **Request:** `{}`
- **Expected response:** `422 Unprocessable Entity`; 이름 필수 검증 오류가 반환되고 팀원은 생성되지 않는다.

### TC-MEMBER-007 — 공백 이름으로 팀원 생성 시도

- [ ] **유형:** 실패
- **Endpoint:** `POST /api/v1/members`
- **Request:** `{"name":"   "}`
- **Expected response:** `422 Unprocessable Entity`; 이름 검증 오류가 반환되고 팀원은 생성되지 않는다.

### TC-MEMBER-008 — 존재하지 않는 팀원 조회

- [ ] **유형:** 실패
- **Endpoint:** `GET /api/v1/members/999999`
- **Request:** 없음
- **Expected response:** `404 Not Found`; 팀원 미존재 오류가 반환된다.

### TC-MEMBER-009 — 존재하지 않는 팀원 수정

- [ ] **유형:** 실패
- **Endpoint:** `PATCH /api/v1/members/999999`
- **Request:** `{"name":"수정 시도"}`
- **Expected response:** `404 Not Found`; 팀원 미존재 오류가 반환된다.

### TC-MEMBER-010 — 존재하지 않는 팀원 삭제

- [ ] **유형:** 실패
- **Endpoint:** `DELETE /api/v1/members/999999`
- **Request:** 없음
- **Expected response:** `404 Not Found`; 팀원 미존재 오류가 반환된다.

## 4. 저장 및 공통 동작 테스트 케이스

### TC-DATA-001 — 재시작 후 데이터 유지

- [ ] **유형:** 성공
- **사전 조건:** 작업과 팀원을 생성한 뒤 애플리케이션을 재시작한다.
- **Endpoint:** `GET /api/v1/tasks`, `GET /api/v1/members`
- **Request:** 각 Endpoint에 별도 GET 요청, 본문 없음
- **Expected response:** 두 요청 모두 `200 OK`; 재시작 전에 저장한 작업과 팀원이 유지된다.

### TC-DATA-002 — 로그인 없이 API 사용

- [ ] **유형:** 성공
- **Endpoint:** `GET /api/v1/tasks`
- **Request:** 인증 헤더 없이 요청
- **Expected response:** `200 OK`; 인증 정보 없이 작업 목록을 조회할 수 있다.

## 5. 후속 범위 테스트

- 작업 목록의 상태·담당자·우선순위·태그 필터, 정렬, 페이지네이션
- 작업 목록 필터·정렬·페이지네이션을 제품 범위에 추가하는 경우 해당 동작
- 별도 태그 CRUD, 날짜 시각 입력, 작업 보관 기능을 제품 범위에 추가하는 경우 해당 동작
