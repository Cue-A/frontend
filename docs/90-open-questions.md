# 90. 미확정 사항

아직 정해지지 않은 것들입니다. **여기 걸리는 내용을 혼자 결정하고 구현하지 마세요.**
이슈 단계에서 이 문서를 먼저 확인하고, 걸리는 항목이 있으면 이슈에 번호를 적어주세요.

정해지면 해당 항목을 지우고, 결정 내용을 관련 문서(`docs/01-conventions.md`,
`docs/design-system.md` 등)에 옮겨 적습니다. 이 문서에 결론을 쌓아두지 않습니다.

| 상태 | 뜻 |
|---|---|
| 🔴 | 막힘. 이게 정해져야 작업을 시작할 수 있음 |
| 🟡 | 임시로 정해두고 진행 중. 나중에 바뀔 수 있음 |
| ✅ | 결정 완료. 코드 반영만 남음 — 반영되면 이 항목을 지웁니다 |

---

## 디자인 시스템

### Q1. 🟡 다크모드 팔레트가 없습니다

Figma 파일에 다크 변형이 없어 라이트 팔레트만 토큰화돼 있습니다.
지금 구조는 Primitive 단일 계층이라, 다크모드를 넣으려면 `bg-neutral-0` 같은 클래스를
쓴 지점을 전부 찾아 고쳐야 합니다.

- **결정: 라이트모드 기준으로 개발하고, MVP 기능 개발이 끝난 뒤에 다시 봅니다.**
- 남은 결정: 다크모드를 실제로 할지, 한다면 Semantic 별칭 레이어를 먼저 넣을지.
- 걸리는 작업: 전역 색을 새로 쓰는 화면 전부.

### Q2. ✅ `neutral-1000` 을 삭제합니다

Figma 카드에 `neutral-900` 과 `neutral-1000` 둘 다 "제목 · 본문 기본색" 으로 적혀 있었습니다.
`neutral-900`(`#26262B`)이 흰 배경에서 15.06:1 로 충분하고, 순검정은 눈부심이 있습니다.

- **결정: `neutral-1000` 토큰을 삭제합니다. 제목·본문은 `neutral-900`.**
- 반영 위치: `src/styles/tokens.css`, `docs/design-system.md` §2.2 (PR #1)

### Q3. ✅ 랜딩 타이포 세트에 `text-landing-` 접두어를 붙입니다

`text-body-md`(14px) 와 `text-body`(13px) 는 잘못 골라도 에러가 나지 않습니다.

검토된 다른 안(14px → `text-body`, 13px → `text-body-sm`)은 **`text-body-sm` 이 이미
12px 로 쓰이고 있어** 코어 세트 이름 세 개가 한꺼번에 밀립니다. 접두어 방식은 코어 세트를
건드리지 않습니다.

- **결정: 랜딩 전용 3종을 `text-landing-body`(13) · `text-landing-subtitle`(15) ·
  `text-landing-stat`(17) 로 바꿉니다. 코어 세트 이름은 그대로 둡니다.**
- 순서: **Figma 디자인 시스템을 먼저 수정한 뒤** 코드를 리팩터링합니다. Figma 가 원본입니다.
- 반영 위치: `src/styles/tokens.css`, `docs/design-system.md` §3.3 (PR #1)

### Q4. ✅ 배지 토큰을 역할 기반 5종으로 바꿉니다

`badge-first-practice`, `badge-streak-3` 처럼 이름이 배지 내용에 묶여 있어 배지가 하나
늘 때마다 토큰이 3개씩 늘어납니다. 값은 이미 `primary` / `semantic` 과 동일합니다.

- **결정: `badge-brand` / `warning` / `danger` / `info` / `success` 5종으로 바꿉니다.
  배지 종류가 늘어도 토큰은 늘지 않습니다.**
- 주의: 문서에 적힌 "동일 색상의 20% 배경" 규칙은 실제 Figma 값 5개 **모두와 맞지 않습니다.**
  `color-mix()` 로 계산하도록 바꾸면 5색이 전부 바뀝니다. 값은 Figma 것을 그대로 씁니다.
- 반영 위치: `src/styles/tokens.css`, `docs/design-system.md` §2.4 (PR #1)

---

## API 연동

### Q5. ✅ 인증은 헤더 `Authorization: Bearer` 입니다

백엔드 `common/security/JwtAuthFilter.java` 를 확인했습니다. **쿠키가 아니라 헤더입니다.**
토큰이 깨지면 `INVALID_TOKEN` 으로 401 이 옵니다.

- **결정: `Authorization: Bearer <accessToken>` 헤더로 보냅니다.**
- **결정: 환경변수 키는 `VITE_API_BASE_URL` · `VITE_USE_MOCK` 를 씁니다.**
- **결정: 토큰 부착은 `shared/api` 한 곳에서만 합니다.**
- 아직 백엔드에 없는 것: **refresh token.** 지금은 access token 하나뿐이라 만료되면
  재로그인밖에 없습니다. 로그인 화면을 만들기 전에 정해져야 합니다 → `Cue-A/backend#3`

### Q6a. 🟡 면접 중 대기 화면 (다음 질문 생성)

백엔드 문서에 이미 정해진 부분이 있습니다. 아래는 추측이 아니라 백엔드 스펙입니다.

- **프론트는 폴링하지 않습니다.** 백엔드 `docs/00-architecture.md` "왜 Spring이 폴링하는가"
  절에서 프론트 폴링은 **명시적으로 기각된 안**입니다(브라우저를 닫으면 질문이 저장되지 않음).
  Spring 이 AI 를 1초 간격으로 폴링하고, 프론트에는 **WebSocket 으로 push** 합니다. SSE 아닙니다.
- **진행 단계는 3개로 이미 정해져 있습니다.** Spring 이 AI 내부 stage 를 자체 enum 으로
  매핑해서 내려줍니다.

  | `ProgressStage` | 화면 문구 |
  |---|---|
  | `TRANSCRIBING` | 답변 정리 중 |
  | `GENERATING` | 질문 준비 중 |
  | `SYNTHESIZING` | 음성 만드는 중 |

- **메시지 형식도 이미 코드에 있습니다.** 공통 봉투는 `{ type, payload }` 이고,
  연결 주소는 `/ws/interviews/{sessionId}` 입니다.

  | `type` | payload |
  |---|---|
  | `progress` | `stage` (위 3종) |
  | `question` | `questionId` `questionType` `text` `audioUrl` `audioAvailable` `category` `difficulty` `questionNumber` `questionTotal` |
  | `error` | `errorCode` `message` `retryable` `needsRerecord` |
  | `session_end` | 세션 종료 |

  `questionType` 은 `QUESTION` / `FOLLOWUP` / `REASK` 이고, **진행률은 `questionNumber`
  기준**입니다(되묻기에서는 올라가지 않습니다). `audioUrl` 이 null 이면 `audioAvailable`
  로 이유를 구분합니다.

- **타임아웃은 두 개입니다.** 세션 시작 **90초**, 답변 처리 **60초**.
  하나로 뭉치면 세션 시작에서 오탐이 납니다.

- 아직 백엔드에 없는 것: **WebSocket 연결 인증.** 지금은 `sessionId` 만 알면 누구나 붙습니다.
  프론트가 연결 시 무엇을 실어 보내야 하는지 아직 정해지지 않았습니다 → `Cue-A/backend#3`
- 남은 결정: 타임아웃 후 안내 순서. 제안은 **재시도 → 계속 실패 시 "여기까지로 리포트 생성"**.
  - 지금은 60초 뒤 안내 문구만 보여줌 (재시도 · 부분 리포트 없음, PR #193)
- 하지 말 것
  - 무한 스피너 — 20초쯤이면 멈춘 줄 알고 새로고침하게 됩니다
  - 가짜 퍼센트 진행바 — 95%에서 멈추면 오히려 신뢰를 더 잃습니다

### Q6b. 🟡 리포트 생성 대기 화면

분석 등록(Cue-A/backend#49 · #50)과 상태 조회(Cue-A/backend#56 · #60)로 대부분 정해졌습니다. 모두 dev 에 들어 있습니다.
프론트는 그 계약에 맞춰 붙였습니다.

- 정해진 것
  - 통로: `POST /api/interviews/{sessionId}/reports` → 202 `{ reportId, … }` → WebSocket `/ws/reports/{reportId}`
  - 메시지: `progress`(`stage` · `progress`) · `report`(`reportId` · `status` · `scoreTotal`) · `error`(`errorCode` · `message` · `retryable`)
  - 단계 이름: AI 단계를 대문자로 (`TRANSCRIBING` → `ANALYZING_SPEECH` → `ANALYZING_GAZE` → `ANALYZING_CONTENT` → `COMPOSING`)
  - 소요 시간 상한: 10분. 넘으면 백엔드가 `AI_TIMEOUT` 으로 끝냅니다
  - 늦게 붙은 경우: 소켓에 붙은 직후 `GET /api/reports/{reportId}/status` 를 한 번 불러 따라잡습니다. 결과(완료 · 실패)는
    소켓과 조회 중 먼저 준 쪽을 따르고 뒤에 온 것은 버립니다 (backend#56 "호출 순서"). 새로고침하면 sessionStorage 에 기억한 reportId 로
    같은 순서를 밟습니다
- 남은 것
  - **다른 탭 · 기기에서 연 경우.** 기억해 둔 reportId 가 없으면 등록이 409 `REPORT_ALREADY_EXISTS` 이고, 상태 조회도
    reportId 로만 물을 수 있어서 이어 볼 길이 없습니다. 리포트 목록이 생기면 풀립니다
- 걸리는 작업: 리포트 화면, 분석 중 화면.

### Q14. ✅ 실패한 축만 다시 분석 (부분 재시도)

백엔드에 들어왔습니다(Cue-A/backend#68). 프론트는 그 계약에 맞췄습니다(`domain/report/api/reportRetryApi.ts`).

- `POST /api/reports/{reportId}/retry` — **본문 없음.** 백엔드가 리포트의 실패 축(`overall.axesFailed`)을 전부
  한 번에 다시 돌립니다. 202 `{ reportId, status: 'PARTIAL', retry: { status: 'PROCESSING', axes } }`
- 진행 · 결과는 분석 등록과 같은 소켓 `/ws/reports/{reportId}` 의 `progress` · `report` · `error`
- 재시도 중에도 리포트는 `PARTIAL` 로 조회되고, 상세 · 상태 조회의 `retry.status` 가 `PROCESSING` 입니다.
  성공하면 리포트가 통째로 바뀌고 `retry` 가 null, 실패하면 리포트는 그대로이고 `retry.status` 가 `FAILED` 입니다
- 409 `REPORT_NOT_RETRYABLE`(부분 실패 리포트가 아님) · `REPORT_RETRY_IN_PROGRESS`(이미 도는 중)
- 화면: 실패한 줄마다 "다시 분석" 버튼이 있지만 어느 줄에서 눌러도 실패한 줄이 다 같이 돕니다(둘 이상이면 줄에 적어 둡니다).
  새로고침하거나 다른 탭에서 열어도 리포트의 `retry` 를 보고 도는 중인 재시도를 이어 기다리고, 마지막 실패 사유도 보여줍니다

### Q13. 🔴 카카오 인가 요청에 `state` 파라미터가 없습니다

OAuth 인가 코드 방식에서 `state` 는 로그인 CSRF 를 막는 자리입니다. 지금 인가 URL
(`domain/auth/lib/kakaoAuth.ts`)에 `state` 가 빠져 있어서, 공격자가 자기 `code` 를 담은
콜백 URL 을 피해자에게 열게 만들면 피해자 계정이 공격자 카카오 계정에 묶일 수 있습니다
(PR #56 리뷰).

프론트만 붙여서는 소용이 없습니다 — 콜백에서 돌아온 `state` 를 요청 시 만든 값과
대조해야 하는데, 그 대조를 프론트가 들고 있는 값(예: `sessionStorage`)과 하든 백엔드가
하든 가인님과 먼저 정해야 합니다.

- 남은 결정: `state` 를 누가 발급하고 어디서 검증할지 (프론트 `sessionStorage` 대조 /
  백엔드가 발급해 대조).
- 걸리는 작업: `domain/auth/lib/kakaoAuth.ts` (인가 URL), `POST /api/auth/oauth/kakao`
  계약(`Cue-A/backend` `docs/03-auth.md`).
- `POST /api/auth/oauth/kakao` 가 실제로 붙는 3단계 전에는 정해져야 합니다.

### Q14. ✅ 회원 탈퇴는 `DELETE /api/users/me` 이고 탈퇴 이유는 받지 않습니다

백엔드 탈퇴 API(Cue-A/backend#64)가 들어와 실서버로 붙였습니다 (이슈 #201).

- **결정: `DELETE /api/users/me`, 본문 없음.** 계정과 모든 연관 데이터(문서 · 면접 기록 · 리포트 등)를 영구 삭제하고,
  로그인된 모든 기기의 refresh token 을 폐기합니다. 프론트는 응답을 받자마자 이 브라우저의 토큰을 지웁니다
- **결정: 탈퇴 이유를 받지 않습니다.** 전에 가정했던 `POST /api/users/me/withdrawal` 의 `{ reason, detail? }` 은 백엔드에 없어서,
  탈퇴 화면에서 이유 고르기를 뺐습니다. 화면은 안내(지워지는 것 · 되돌릴 수 없음 · 다른 기기 로그아웃) → 최종 확인 창 → 완료입니다
- 비밀번호 재확인은 받지 않습니다(백엔드가 받지 않음). 카카오 연결 끊기(unlink) · 재가입 제한은 백엔드 범위 밖입니다
- 걸리는 작업: `domain/user/api/userApi.ts` 의 `withdraw`, `domain/user/components/WithdrawPage.tsx` ·
  `WithdrawConfirmDialog.tsx`, `domain/user/lib/withdrawal.ts`.

### Q15. 🟡 직접 작성 문서의 본문 수정 · 제목 수정 창 시안

문서 제목 수정은 백엔드에 생겨서(Cue-A/backend#76) 실제 서버에서도 됩니다. 계약은 `documentApi.ts` 의
`updateDocumentTitle` 주석에 옮겨 적었습니다. 남은 것은 아래 둘입니다.

- 남은 결정 (프론트 · 백엔드): 직접 작성 문서의 **본문 수정**. 백엔드는 이슈만 있고(Cue-A/backend#75) API 가 없어서,
  지금 화면은 제목만 바꿉니다.
- 남은 결정 (기획): 제목 수정 창 시안. 지금은 지우기 확인 창과 같은 모양으로 임시로 그렸습니다.
- 알아둘 것: 옵션 설정(A-05)에 골라 둔 자기소개서는 고른 시점의 제목을 들고 있어서, 보관함에서 제목을 바꿔도
  다시 고르기 전까지 옛 제목으로 보입니다. 면접 시작은 `documentId` 로 하므로 동작에는 영향이 없습니다.
- 걸리는 작업: `domain/document/components/DocumentRenameDialog.tsx`.

### Q16. 🟡 마이페이지 확장 화면의 API — 알림 설정만 서버에 없습니다

기능명세서 "사용자" 도메인(MY-1~3)의 프로필 · 계정 정보는 API 명세서를 받았지만(진행 상태 "시작 전"),
"알림 설정"은 기능명세서 자체에 없는 항목입니다. 관심 기업은 백엔드 #101 로 생겼습니다.
성우님이 PR #112 로 만들던 화면을 이슈 #162 에서 다시 작업했습니다. (커뮤니티는 이번 범위에서 뺐습니다)

이슈 #185 에서 마이페이지를 정리했습니다. 메뉴 목록 화면 · 나만의 명함 · 사이드바 커뮤니티 · 홈 화면 테마 색 점을 지웠고,
계정 설정 · 알림 설정은 프로필 한 화면 아래 칸으로 합쳤습니다(옛 주소는 프로필의 그 칸으로 보냅니다).

- **프로필 · 계정 정보 · 탈퇴는 실서버로 붙였습니다** (Cue-A/backend#64 · #126 · #128, 이슈 #201). 아래는 목업 시절 결정과 바뀐 점입니다.
  - 프로필 조회 · 수정: API 명세서 그대로 `GET · PATCH /api/users/me/profile`.
    - 응답 `userId · userName · email · profileImageUrl · introduction · targetJobRole · careerLevel · schoolName · major · graduationYear`
    - 수정은 바꾼 칸만 보냅니다. 빈 본문은 400 `INVALID_REQUEST` 라 바뀐 게 없으면 저장 버튼을 잠급니다
    - 서버는 `null` 을 "안 보냄" 으로 봐서 칸을 지울 때는 빈 문자열(`''`)을 보냅니다. 조회의 `''` 는 비어 있는 것으로 그립니다 (이슈 #201)
    - 화면은 이름 · 직무(50자)만 고칩니다. 자기소개 · 경력 단계 · 학교 · 전공 · 졸업연도는 시안이 없어 아직 그리지 않았습니다
    - 프로필 사진은 주소(`profileImageUrl`)만 받고 올릴 API 가 없어 "사진 변경" 을 넣지 않았습니다
    - "계정 탈퇴하기" 는 명세 피드백에 따라 프로필 판에서 빼고 아래 계정 칸에만 둡니다
  - 계정 정보: API 명세서 그대로 `GET /api/users/me/account` (이메일 · 가입일 · 로그인 수단별 연결일 · 비밀번호 유무)
  - 이메일 변경 `PATCH /api/users/me/email` · 비밀번호 변경 `PATCH /api/users/me/password` 은 백엔드에 들어왔고(#125 · #127),
    화면은 이슈 #201 의 두 번째 작업에서 만듭니다
  - 관심 기업: 백엔드 #101 계약 그대로 `GET /api/companies/interests`, `POST · DELETE /api/companies/{companyId}/interest`.
    배포 서버에도 있어서(2026-11 재배포) 목업 표시(`missingInBackend`)를 지웠습니다. `companies` 를 켜면 실제 서버로 갑니다
  - 알림 설정: `GET · PATCH /api/users/me/notification-settings` — 명세서에 없는 완전 임시 경로입니다. **아직 목업입니다.**
    PATCH 는 바꾼 항목만 보냅니다
  - 명함: MVP 범위 밖이라 화면 · 목업을 지웠습니다(이슈 #185). 명세서 경로는 `POST · GET · PATCH /api/users/me/business-card` 였습니다
- 남은 결정 (백엔드에 확인 중)
  - 프로필 직무(50자)와 면접 직무 `jobRole`(100자) 길이를 맞출지
  - 프로필 사진 업로드 방식, 알림 설정의 실제 계약
- 확인됨: 실서버 응답은 공통 응답(`errorCode` · `TOKEN_EXPIRED`)을 따르고, 프로필의 `userName` 은 `users/me` 의 `nickname` 과 같은 값입니다
- 걸리는 작업: `domain/user/components/ProfilePage.tsx` · `AccountSection.tsx` · `NotificationSection.tsx`,
  `domain/user/api/userApi.ts` · `userMock.ts`.

### Q17. 🟡 연습 기록 "기타" 카드 — 폴더에 넣지 않은 기록만 거르는 조건이 없습니다

시안의 폴더 카드 줄은 전체 · 내 폴더들 · 기타(폴더에 넣지 않은 세션) 순서입니다. 연습 기록 목록
`GET /api/practice-records` 는 `folderId` 로 한 폴더만 거를 수 있고 "폴더 없음" 조건이 없으며, 폴더 목록
`GET /api/folders` 에도 그 개수가 없습니다(Cue-A/backend#92 · #97).

- **임시 결정: "기타" 카드를 두지 않습니다** (이슈 #167). 전체 · 내 폴더들만 보입니다.
- 폴더 이동 · 빼기(`PATCH /api/practice-records/folder`)와 폴더 이름 바꾸기 · 삭제는 들어왔습니다 (이슈 #205).
  이제 폴더에 넣지 않은 기록이 생기므로 "기타" 카드를 넣을 수 있는데, 그러려면 백엔드에 "폴더 없음" 필터와 그 개수가
  있어야 합니다. **아직 백엔드에 요청하지 않았습니다.**
- 남은 결정: "기타" 카드가 필요한지 정하고, 필요하면 백엔드에 필터 · 개수를 요청합니다. 생기면 "기타" 카드를 다시 넣습니다.
  폴더 이름 "기타" 는 그 자리를 위해 지금도 막아 둡니다.
- 걸리는 작업: `domain/practice/components/FolderCards.tsx` · `api/practiceApi.ts`.

### Q18. 🟡 기업 탐색 목록 카드에 업종이 없습니다

기업 목록 `GET /api/companies` 는 면접 옵션 설정의 기업 고르기 계약이라 `companyId · name` 만 줍니다(Cue-A/backend#86).
업종 · 핵심 가치는 상세 `GET /api/companies/{companyId}` 에만 있습니다(backend#101). 상세의 인재상 설명(`talentProfile`)은
기업 시드(backend#112)에 값이 없어 지금은 모두 null 입니다.

- **임시 결정: 목록 카드에는 기업 이름만 둡니다** (이슈 #162). 카드마다 상세를 부르면 기업 수만큼 요청이 나갑니다.
  인재상 설명 칸은 값이 있을 때만 보입니다.
- 남은 결정: 목록 응답에 업종(`industry`)을 더해 달라고 백엔드에 요청할지, 인재상 설명을 채울지.
- 걸리는 작업: `domain/company/components/CompaniesPage.tsx` · `CompanyDetailPage.tsx`.

---

## 그 외

### Q8. 🟡 테스트 러너를 아직 안 붙였습니다

- 필요한 결정: Vitest + Testing Library 로 갈지, 어느 시점에 붙일지.
- 지금은 PR 체크리스트에서 테스트 항목이 비어 있습니다.

### Q9. 🟡 마이크·카메라 사용 불가 시 면접 시작을 차단할지

기능명세서 INT-4 "정책 미확정" 항목입니다. 마이크는 없으면 STT 가 돌지 않아
답변이 아예 남지 않으므로 필수 쪽으로 의견이 모였습니다. 카메라는 없어도 면접
자체는 성립하고 시선 점수만 제외되며(INT-7), 리포트 화면(#8)이 이미 시선 점수
`null` 을 처리하도록 되어 있어 선택으로 두자는 의견입니다(PR #10 리뷰).

- **결정: 임시로 "마이크만 필수" 를 적용합니다.** `canStartInterview` 에 들어가
  있고, 카메라 실패 시 시선 점수가 제외된다는 안내 문구도 이 전제로 추가했습니다.
- 남은 결정: 팀 확정 — 카메라도 필수로 갈지, 선택으로 남길지.
- 걸리는 작업: `domain/interview/lib/canStartInterview.ts` 만 고치면 됩니다.

### Q11. 🟡 총 예상 소요 시간 계산 기준

A-05 시안이 "9문항 × 질문당 90초 → 15분"인데 답변 시간만 더하면 13.5분입니다.
답변 제출 후 다음 질문까지 5~15초가 걸린다는 걸 확인해(PR #13 리뷰) 질문당
여유 10초를 얹었고, 시안 값과 맞아떨어집니다.

- **임시 값**: 질문당 여유 10초 (5~15초의 중간값)
- 남은 결정: 실제 기준. 서버가 예상 소요를 내려주는지도 확인이 필요합니다
- 걸리는 작업: `domain/interview/lib/estimateDuration.ts`
- 어림값이라 화면에는 "약 N분"으로 표시합니다. "제한 없음"이면 계산하지 않습니다
