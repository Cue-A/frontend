# 01. 컨벤션

## 폴더

```
src/
├── app/                    라우터, 전역 프로바이더, 진입점
├── shared/                 도메인에 속하지 않는 공용 코드
│   ├── ui/                 Button, Modal 같은 순수 UI 컴포넌트
│   ├── api/                HTTP 클라이언트, 공통 에러 처리
│   ├── hooks/
│   ├── lib/                순수 함수 유틸
│   └── types/
├── styles/                 tokens.css 등 전역 스타일
└── domain/{도메인}/
    ├── components/         이 도메인 화면에서만 쓰는 컴포넌트
    ├── hooks/              이 도메인의 데이터 조회·변경 훅
    ├── api/                이 도메인의 API 호출 함수
    └── types/              요청·응답 타입
```

도메인 간 참조는 **hooks 레벨에서만** 합니다. 다른 도메인의 `api/` 나 `components/` 를 직접
가져다 쓰지 않습니다. 두 도메인이 같은 컴포넌트를 필요로 하면 `shared/ui/` 로 올립니다.

`shared/` 는 `domain/` 을 import 하지 않습니다. 방향은 항상 `domain/ → shared/` 한쪽입니다.

## API 응답

백엔드의 모든 응답은 `Result<T>` 로 감싸져 옵니다.

```ts
type Result<T> =
  | { success: true;  data: T;    errorCode: null;   message: null }
  | { success: false; data: null; errorCode: string; message: string }
```

```jsonc
// 성공
{ "success": true, "data": { ... }, "errorCode": null, "message": null }

// 실패
{ "success": false, "data": null, "errorCode": "SESSION_NOT_FOUND", "message": "세션을 찾을 수 없습니다" }
```

**껍데기를 벗기는 건 `shared/api/` 안에서 한 번만 합니다.** 컴포넌트가 `res.data.data` 를
쓰게 두지 않습니다. 클라이언트가 `success` 를 보고, 실패면 던지고, 성공이면 `data` 만
돌려줍니다.

```ts
// 나쁨 — 화면마다 껍데기를 벗김
const res = await fetch(...).then(r => r.json())
if (res.success) setSession(res.data)

// 좋음 — 화면은 T 만 본다
const session = await api.post<Session>('/api/interviews', body)
```

## 에러 처리

**컴포넌트에서 `try-catch` 로 화면을 분기하지 않습니다.** API 클라이언트가
`ApiError`(= `errorCode` + `message`)를 던지고, 상위의 에러 바운더리나 조회 훅의
에러 상태가 처리합니다.

```ts
// 나쁨
try {
  const s = await createSession(body)
} catch (e) {
  alert('실패했습니다')
}

// 좋음 — 던지고, 화면은 상태만 그린다
const { data, error } = useCreateSession()
if (error) return <ErrorView code={error.code} />
```

`errorCode` 는 서버가 주는 문자열입니다. **사용자에게 보여줄 문구는 프론트에서 매핑합니다.**
서버의 `message` 를 그대로 뿌리지 않습니다 — 서버 문구는 개발자용이라 바뀔 수 있고,
바뀌는 순간 사용자 화면이 같이 바뀝니다.

```ts
const ERROR_MESSAGE: Record<string, string> = {
  SESSION_NOT_FOUND: '면접 세션을 찾을 수 없어요.',
  AI_TIMEOUT: '질문을 만드는 데 시간이 걸리고 있어요. 잠시 후 다시 시도해주세요.',
}
```

매핑에 없는 코드는 공통 문구로 떨어뜨리고, 콘솔이 아니라 에러 리포팅으로 남깁니다.

## 네이밍

| 대상 | 규칙 | 예 |
|---|---|---|
| 컴포넌트 · 컴포넌트 파일 | PascalCase | `SessionCard`, `SessionCard.tsx` |
| 훅 | `use` + camelCase | `useInterviewSession` |
| 그 외 파일 | camelCase | `apiClient.ts`, `formatDate.ts` |
| 변수 · 함수 | camelCase | `sessionId`, `fetchSession` |
| 타입 · 인터페이스 | PascalCase | `SessionCreateRequest` |
| 상수 | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| CSS 클래스(직접 정의 시) | kebab-case | `text-body-md` |
| JSON (서버 방향) | camelCase | `{"sessionId": "..."}` |

백엔드와의 JSON 은 **camelCase** 입니다. AI 서버가 `snake_case` 를 쓰지만 그 변환은
백엔드가 경계에서 처리합니다. 프론트에서 `snake_case` 를 볼 일이 있다면 그건 백엔드
버그이니 그쪽에 이슈를 올려주세요. 프론트에서 임시로 변환해 덮지 마세요.

## 타입

- 요청·응답 타입은 `type` 으로 만듭니다. 확장이 필요한 경우에만 `interface` 를 씁니다.
- **서버 응답 타입과 화면에서 쓰는 타입을 같은 것으로 두지 않습니다.** 서버 필드가 바뀌면
  화면이 통째로 따라 흔들립니다. 변환은 도메인의 `api/` 에서 합니다.
- `any` 를 쓰지 않습니다. 정말 모르겠으면 `unknown` 으로 두고 좁혀서 씁니다.

```ts
export type SessionCreateRequest = {
  resumeId: string
  jobRole: string
  persona: Persona
  companyId?: string
  questionCount?: number
}
```

## 컴포넌트

- 함수 컴포넌트 + 훅만 씁니다. 클래스 컴포넌트는 에러 바운더리에만 허용합니다.
- **컴포넌트 안에서 직접 `fetch` 하지 않습니다.** 데이터 조회는 훅으로 빼서
  화면은 상태만 그리게 합니다. 그래야 로딩·에러 처리가 한 곳에 모입니다.
- props 가 7개를 넘어가면 컴포넌트를 쪼개라는 신호입니다.
- 조건부 렌더링이 3단 이상 중첩되면 하위 컴포넌트로 빼세요.

```tsx
// 나쁨 — 화면이 통신까지 함
function SessionPage() {
  const [data, setData] = useState(null)
  useEffect(() => { fetch('/api/interviews/1').then(...).then(setData) }, [])
}

// 좋음
function SessionPage() {
  const { data, isLoading, error } = useInterviewSession(sessionId)
}
```

## 상태

서버에서 온 데이터와 화면 상태를 섞지 않습니다.

- **서버 상태**(세션, 리포트 등) — 조회 훅이 소유합니다. `useState` 에 복사해두지 마세요.
  복사하는 순간 원본과 어긋나고, 어디가 진짜인지 알 수 없어집니다.
- **화면 상태**(모달 열림, 입력 중인 값) — 그 화면의 `useState`.
- 전역이 꼭 필요한 것만 전역으로 올립니다. "나중에 쓸 것 같아서" 는 이유가 아닙니다.

AI 응답 폴링은 최대 90초입니다. 그동안 화면이 멈춘 것처럼 보이지 않게
**진행 상태를 반드시 렌더링합니다.** 스피너만 90초 돌리지 말고 단계를 보여주세요.

## 스타일

Tailwind CSS v4 를 CSS-first 로 씁니다. `tailwind.config.js` 는 없습니다.

- **색 · radius · 그림자 · 타이포는 디자인 토큰 클래스만 씁니다.** `bg-[#5345F0]` 같은
  arbitrary value 를 쓰지 않습니다. 토큰 목록은 `docs/design-system.md` 에 있습니다.
- 여백은 Tailwind 기본 spacing 숫자(`p-6`, `gap-5`)를 그대로 씁니다. Figma 스펙과 맞습니다.
- 클래스가 길어져도 별도 CSS 파일로 빼지 않습니다. 반복되면 컴포넌트로 뺍니다.
- 인라인 `style` 은 계산값(진행률 바 너비 등)에만 씁니다.

```tsx
// 나쁨
<div className="bg-[#5345F0] rounded-[20px] text-[24px] font-bold">

// 좋음
<div className="bg-primary-500 rounded-lg text-h1">
```

## 로깅

- `console.log` 를 커밋에 남기지 않습니다. 디버깅용은 PR 전에 지웁니다.
- 사용자에게 보여주지 않고 삼키는 에러는 `console.error` 로라도 남깁니다. 조용히 무시하지 마세요.
- **개인정보(답변 전문, 이력서 내용)를 로그에 남기지 않습니다.** 브라우저 콘솔은
  사용자 화면에 그대로 열립니다.

```ts
console.error('세션 시작 실패 sessionId=%s code=%s', sessionId, error.code)
```

## 테스트

- 로직이 있는 훅과 유틸은 단위 테스트를 씁니다. 단순히 props 를 받아 그리기만 하는
  컴포넌트까지 테스트하지 않습니다.
- 컴포넌트 테스트는 **사용자가 보는 것**을 기준으로 씁니다. 내부 state 를 들여다보지 않습니다.
- API 는 목으로 대체합니다. 실제 백엔드에 붙는 테스트는 만들지 않습니다.
- 테스트 이름은 한글로 써도 됩니다.

```ts
test('되묻기는 남은 문항 수를 줄이지 않는다', () => { ... })
```

---

## 작업 흐름 — 이슈 → 브랜치 → PR

모든 작업은 **이슈에서 시작합니다.** 이슈 없이 브랜치를 따지 않습니다.

```
1. 이슈 생성            GitHub → New issue → 기능 개발 / 버그 선택
2. dev 최신화           git switch dev && git pull
3. 브랜치 생성          git switch -c feat/12-interview-session   (12 = 이슈 번호)
4. 작업 + 커밋
5. PR 생성              base 를 dev 로  ← 기본값이 main 이면 바꿔주세요
6. 본문에 Closes #12    머지 시 이슈 자동 종료
7. 리뷰 1명 이상 승인
8. Squash merge → 브랜치 삭제
```

### 브랜치 구조

```
main   배포 가능한 상태만. dev 에서만 넘어옵니다
 ↑
dev    통합 브랜치. 팀원 작업이 모이는 곳
 ↑
feat/12-interview-session   각자 파서 쓰는 작업 브랜치
```

작업 브랜치는 `dev` 에서 따고 `dev` 로 되돌립니다. **`main` 으로 PR 을 올리지 마세요.**

`main` 을 따로 두는 이유는, 데모나 발표 중에 `dev` 가 깨져 있어도 보여줄 수 있는 상태를
하나 남겨두기 위해서입니다. `dev` → `main` 은 배포 시점에만 합칩니다.

### 왜 이슈부터 만드나

- 누가 무엇을 하는지 팀원이 볼 수 있습니다. 같은 걸 두 명이 만드는 사고를 막습니다
- 작업 범위를 미리 쪼개면 PR이 작아집니다. 큰 PR은 아무도 제대로 리뷰하지 못합니다
- `docs/90-open-questions.md` 에 걸리는 게 있는지 이슈 단계에서 걸러집니다. 미확정 사항을
  모르고 구현했다가 갈아엎는 일이 줄어듭니다

### 브랜치 이름

`{타입}/{이슈번호}-{영문-요약}`

```
feat/12-interview-session
fix/31-report-chart-overflow
docs/45-design-tokens
```

이슈 번호를 넣으면 브랜치만 보고도 맥락을 찾아갈 수 있습니다. **`dev` 에서 따세요.**
`main` 에서 따면 `dev` 에 이미 들어간 남의 작업 위에서 작업하지 못해 나중에 충돌이 몰립니다.

### 커밋 메시지

`{타입}({스코프}): {요약}`

```
feat:     기능 추가
fix:      버그 수정
refactor: 리팩터링
style:    스타일·마크업만 손봄 (동작 변화 없음)
docs:     문서
test:     테스트
chore:    빌드·설정·의존성
```

예: `feat(interview): 면접 세션 생성 화면 추가`

스코프는 **어디를 건드렸는지**입니다. 도메인 이름이나 계층 이름을 씁니다.

```
도메인   auth  user  document  interview  report  growth  company
계층     shared  ui  api  hooks  router  styles  types
기타     build  deps  github  guide
```

```
feat(interview): 재연습 세션 시작 화면 추가
fix(report): 타임라인 차트가 모바일에서 넘치는 문제 수정
refactor(api): Result 껍데기 해제를 apiClient 로 이동
style(ui): 버튼 radius 를 디자인 토큰으로 교체
docs(guide): 브랜치 전략을 dev 통합으로 변경
test(interview): 되묻기가 문항 수에 포함되지 않는지 검증
```

여러 곳을 건드려 스코프를 하나로 못 고르겠으면 **PR 을 쪼개라는 신호**입니다.
저장소 전체에 걸치는 변경(빌드 설정 등)만 스코프를 생략할 수 있습니다.

한 줄로 부족하면 본문에 이유를 적습니다. **무엇을 했는지보다 왜 했는지**를 씁니다.
무엇을 했는지는 diff를 보면 됩니다.

### PR 규칙

- 이슈를 먼저 만들고 그 이슈에서 시작합니다. 이슈 없는 PR 은 올리지 않습니다
- 본문에 `Closes #12` 를 반드시 넣습니다. 머지되면 이슈가 자동으로 닫힙니다
- 제목: `[feat] 면접 세션 생성 화면 구현`
- **base 브랜치는 `dev`** 입니다. GitHub 이 기본값을 `main` 으로 잡아주면 바꿔주세요
- 본문은 `.github/PULL_REQUEST_TEMPLATE.md` 가 자동으로 채웁니다
- `main` · `dev` 직접 푸시 금지. 브랜치 보호 규칙으로 막아둡니다
- 리뷰 1명 이상 승인 후 머지
- **Squash merge** 를 씁니다. 작업 중 커밋이 `dev` 히스토리를 어지럽히지 않게
- 화면이 바뀌는 PR 은 **스크린샷을 붙입니다.** 리뷰어가 diff 만 보고 레이아웃을 상상하게
  두지 마세요. 반응형이 걸려 있으면 데스크톱·모바일 두 장.

### 이슈를 먼저 파는 이유

PR 을 열고 나서야 "이거 왜 하는 거예요?" 를 묻게 되면 이미 코드가 다 쓰인 뒤입니다.
방향이 틀렸어도 되돌리기 아까워서 그대로 머지되기 쉽습니다.

이슈 단계에서 정하고 가면 이런 게 걸러집니다.

- 같은 걸 두 명이 만들고 있는지
- `docs/90-open-questions.md` 의 미확정 사항에 걸리는지
- 작업이 너무 커서 쪼개야 하는지

이미 코드를 쓰기 시작했더라도 PR 전에 이슈를 만드세요. 순서가 뒤집혔을 뿐 이슈가 하는
역할은 같습니다. 이슈 번호가 있어야 브랜치 이름(`feat/12-...`)과 `Closes #12` 를 채울 수 있습니다.

### PR 크기

파일 10개 / 400줄을 넘으면 쪼개는 걸 고려하세요. 리뷰어가 대충 승인하게 됩니다.
이슈를 쪼개면 PR도 자연히 작아집니다.

### 리뷰

- 승인 없이 머지하지 않습니다. 급하면 오프라인으로 봐달라고 하세요
- 지적은 **코드에 하고 사람에게 하지 않습니다**
- 반드시 고쳐야 하는 것과 취향인 것을 구분해서 말합니다

```
[필수] 이 컴포넌트가 직접 fetch 하고 있어서 로딩·에러 처리가 여기만 따로 놉니다
[제안] 이 훅 이름은 useActiveSession 이 더 명확할 것 같아요
[질문] 여기서 data 가 undefined 인 순간이 있나요?
```

---

## GitHub 저장소 설정

한 번만 해두면 됩니다.

**기본 브랜치를 `dev` 로 바꿉니다.** (Settings → General → Default branch)
PR 을 열 때 base 가 자동으로 `dev` 가 되어 실수로 `main` 에 올리는 일이 줄어듭니다.

**보호 규칙은 `dev` 와 `main` 둘 다 겁니다.** (Settings → Branches → Add rule)

```
☑ Require a pull request before merging
☑ Require approvals — 1
☑ Automatically delete head branches   (Settings → General)
   Allow squash merging만 켜고 나머지 두 개는 끄기
```

`main` 에 규칙을 안 걸면 `dev` 를 지켜봐야 소용이 없습니다. 급할 때 `main` 으로
바로 밀어버리게 됩니다.
