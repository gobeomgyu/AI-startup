# 코드 품질 설정

Next.js App Router와 TypeScript에 적용할 ESLint·Prettier·TypeScript 설정이다. 현재 저장소에는 앱 코드가 없으므로 앱 구현 시 같은 루트의 설정을 그대로 사용한다.

## 구성

- ESLint flat config: Next.js Core Web Vitals, `typescript-eslint`의 `strictTypeChecked`·`stylisticTypeChecked`, 타입 정보 기반 검사
- 추가 규칙: 암묵적 `any`, 위험한 타입 단언, 처리되지 않은 Promise, 느슨한 불리언 조건, 빠진 `switch` 분기, 공개 함수의 반환 타입 등을 오류로 취급
- Prettier: 코드·설정·문서의 일관된 형식을 검사하고 수정
- TypeScript: `strict`에 더해 인덱스 접근, 선택 속성, 누락된 반환, 사용하지 않는 선언 등을 엄격하게 검사
- `eslint-config-prettier`를 마지막에 적용하여 린트와 포맷 규칙의 충돌을 피한다.

ESLint는 Next.js 내 일부 플러그인의 ESLint 10 peer dependency 경고를 피하도록 9.x 범위로 지정했다. 설정 형식은 최신 flat config다. TypeScript는 현재 `typescript-eslint`가 공식 지원하는 6.x 범위로 지정했다.

## 설치와 실행

Node.js 20.19 이상을 사용한다. 의존성 설치 후 다음 명령으로 검사한다.

```powershell
npm.cmd install
npm.cmd run lint
npm.cmd run format:check
npm.cmd run typecheck
npm.cmd run test
```

자동 수정이 필요한 경우 `npm.cmd run lint:fix`와 `npm.cmd run format`을 사용한다. 전체 품질 확인은 `npm.cmd run check`로 실행한다. Next.js 16에서는 `next lint`가 제거되었고 빌드가 린트를 자동 실행하지 않으므로 `check`를 별도 검증 단계에서 실행한다.

Git의 `pre-commit` 훅도 `npm run check`를 실행한다. 따라서 lint, 포맷 검사, 타입 검사, 테스트 중 하나라도 실패하면 커밋이 중단된다. 훅은 `.githooks/pre-commit`에 보관하고 `npm install`의 `prepare` 단계에서 `core.hooksPath`를 설정한다. 새로 클론한 저장소에서도 의존성을 설치하면 훅이 활성화된다. 수동 재설정은 `node scripts/setup-hooks.mjs` 또는 `git config --local core.hooksPath .githooks`로 할 수 있다.

테스트 명령은 `vitest run`이다. 테스트 파일이 아직 없거나 테스트가 실패하면 통과로 간주하지 않는다. 브라우저 수동 시나리오는 `docs/TEST_CASE.md`를 따른다. Playwright E2E 테스트는 사용하지 않는다.

현재 저장소에는 TypeScript 앱 파일이 없어 `typecheck`는 앱 코드가 추가된 후 검증한다. `lint`의 타입 정보 검사는 해당 파일이 `tsconfig.json`에 포함되어 있어야 한다.

## 참고 문서

- [Next.js ESLint 설정](https://nextjs.org/docs/app/api-reference/config/eslint)
- [typescript-eslint 타입 정보 기반 검사](https://typescript-eslint.io/getting-started/typed-linting/)
- [typescript-eslint 공유 설정](https://typescript-eslint.io/users/configs/)
- [Prettier 설정](https://prettier.io/docs/configuration)
- [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier)
- [Git pre-commit 훅](https://git-scm.com/docs/githooks)
- [Vitest 실행 명령](https://vitest.dev/guide/cli)
