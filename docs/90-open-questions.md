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
- 하지 말 것
  - 무한 스피너 — 20초쯤이면 멈춘 줄 알고 새로고침하게 됩니다
  - 가짜 퍼센트 진행바 — 95%에서 멈추면 오히려 신뢰를 더 잃습니다

### Q6b. 🟡 리포트 생성 대기 화면

Cue-A/backend#50 (리포트 분석 작업 등록, 아직 열린 PR)으로 대부분 정해졌습니다. 프론트는 그 계약에 맞춰 붙였습니다.

- 정해진 것
  - 통로: `POST /api/interviews/{sessionId}/reports` → 202 `{ reportId, … }` → WebSocket `/ws/reports/{reportId}`
  - 메시지: `progress`(`stage` · `progress`) · `report`(`reportId` · `status` · `scoreTotal`) · `error`(`errorCode` · `message` · `retryable`)
  - 단계 이름: AI 단계를 대문자로 (`TRANSCRIBING` → `ANALYZING_SPEECH` → `ANALYZING_GAZE` → `ANALYZING_CONTENT` → `COMPOSING`)
  - 소요 시간 상한: 10분. 넘으면 백엔드가 `AI_TIMEOUT` 으로 끝냅니다
- 남은 것
  - **상태 조회 API** (Cue-A/backend#48). 소켓은 붙는 순간 현재 상태를 주지 않아서, 새로고침 사이에 끝난 리포트를
    알 수 없습니다. 지금은 등록 응답의 reportId 를 sessionStorage 에 기억해 두고 소켓에만 다시 붙습니다
  - **다른 탭 · 기기에서 연 경우.** 기억해 둔 reportId 가 없으면 등록이 409 `REPORT_ALREADY_EXISTS` 이고
    reportId 를 알 길이 없습니다. 상태 조회나 리포트 목록이 생기면 풀립니다
  - **리포트 조회 API.** 분석이 끝나 리포트 화면으로 넘어가도 조회 API 가 없어서 실제 모드에서는 화면이 뜨지 않습니다
- 걸리는 작업: 리포트 화면, 분석 중 화면.

### Q14. 🟡 실패한 축만 다시 분석 (부분 재시도)

AI 는 준비돼 있고(AI 계약 14장 `POST /ai/sessions/{session_id}/report/retry`), 백엔드는 아직 없습니다
(Cue-A/backend `docs/13-report.md` "아직 없는 것" — "`PARTIAL` 전용. 만들지 팀 확인 필요"). 리포트 화면의
"다시 분석" 버튼은 아래 임시 계약으로 목업에 붙였습니다(`domain/report/api/reportRetryApi.ts`, `missingInBackend`).

- 임시 결정
  - `POST /api/reports/{reportId}/retry` 본문 `{ axes: ['speech' | 'gaze'] }` → 202 `{ reportId, status: 'PROCESSING' }`
  - 진행 · 결과는 분석 등록과 같은 소켓 `/ws/reports/{reportId}` 의 `progress` · `report` · `error`
  - 한 번에 한 축만. 버튼은 분석이 실패한 축(`failed`) 줄에만 있고, 미사용(`skipped`) 줄에는 없습니다
  - `report` 가 오면 리포트를 다시 조회해 통째로 바꿉니다. 재시도는 총점 · 상태까지 새 값으로 교체합니다
- 남은 결정 (백엔드)
  - 만들지 여부 · 경로 · 축 이름(`gaze` / `score_vision`) · 에러 코드(부분 실패가 아닌 리포트, 이미 도는 중)
  - 재시도 중에 상태 조회(`GET /api/reports/{reportId}/status`)가 `PROCESSING` 으로 보이는지. 새로고침한 뒤
    이어 받으려면 필요합니다. 지금은 새로고침하면 기다림이 끊기고 버튼이 다시 보입니다
- 걸리는 작업: 리포트 화면 세부 점수.

### Q12. 🟡 로그인 화면의 Google 로그인이 기능명세서에 없습니다

Figma `A-02 로그인,회원가입` 시안에는 카카오 로그인과 나란히 "Google로 계속하기"
버튼이 있는데, 기능명세서 AUTH-2 는 카카오 로그인만 정의돼 있고 Google 은 없습니다
(PR #22 리뷰).

- **임시 결정: 시안대로 버튼은 남기고, 연동 전까지 `disabled` 처리합니다.**
- 남은 결정: Google 로그인을 실제로 만들지, 시안에서 뺄지 — 기획 쪽 확인 필요.
- 걸리는 작업: `domain/auth/components/LoginForm.tsx` 의 Google 버튼.

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

### Q14. 🟡 회원 탈퇴 API 와 탈퇴 정책이 없습니다

기능명세서 P0 에 "마이페이지 > 계정 설정 > 로그아웃 · 회원 탈퇴" 가 있는데, 백엔드(dev · #34)에는
로그아웃과 내 정보 조회만 있고 탈퇴 API 가 없습니다. 계정 설정 시안도 아직 없습니다.

- **임시 결정: 탈퇴 흐름(이유 고르기 → 최종 확인 창 → 완료)과 탈퇴 뒤 토큰 정리까지 만들고, API 는
  `POST /api/users/me/withdrawal` (본문 `{ reason, detail? }`) 로 가정해 목업(`missingInBackend`)이 답하게
  둡니다.** 계정 설정은 프로필 시안을, 탈퇴 흐름은 프레시코드 탈퇴 화면을 참고해 임시로 그렸습니다.
- 남은 결정 (백엔드)
  - 경로 · 응답. 탈퇴 뒤 그 사용자의 refresh token 을 모두 끊는지
  - 탈퇴 이유(`reason` 7종 · `detail`)를 저장할지. 저장한다면 enum 값을 같이 맞춥니다
  - 지워지는 범위. 최종 확인 창은 "면접 기록과 답변 녹화 · 리포트 · 보관함 문서 · 계정 정보가 지워진다" 고 안내합니다.
    다르거나 재가입 제한 기간이 있으면 문구를 고칩니다
  - 비밀번호 재확인을 받을지. 카카오로만 가입한 계정은 비밀번호가 없어서 받는다면 방법을 따로 정해야 합니다
  - 카카오 계정 연결 끊기(unlink)를 백엔드가 같이 하는지
- 남은 결정 (기획): 계정 설정 · 탈퇴 화면 시안, 탈퇴 이유 목록.
- 걸리는 작업: `domain/user/api/userApi.ts` 의 `withdraw`, `domain/user/components/WithdrawPage.tsx` ·
  `WithdrawConfirmDialog.tsx`, `domain/user/lib/withdrawReasons.ts`.

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

### Q10. 🟡 답변 시간 선택지가 확정되지 않았습니다

A-05 시안에는 "질문당 90초" 한 값만 보입니다. 드롭다운인데 나머지 선택지가 시안에 없어서
프론트가 임시로 채웠습니다. (PR #13)

- **임시 값**: 답변 시간 60 / 90 / 120초 + 제한 없음
- **서버가 이 값을 받지 않습니다.** 세션 시작 요청(`InterviewStartRequest`)에 답변 시간 자리가
  없어서 PR #66 에서 요청 본문에서 뺐습니다. 지금은 A-05 화면(설정 요약 · 예상 소요 시간)에만
  쓰입니다. 면접 진행(B-01)의 카운트다운은 이 값이 아니라 세션 옵션 목업의 고정값(90초)을 씁니다
  (이슈 #54 "확인이 필요한 것" 1번)
- 남은 결정: 답변 시간을 서버가 받을지, 받는다면 허용 범위. 기대하던
  `GET /api/v1/interviews/options/defaults` (INT-2)는 api 명세서 v0.2 에 없습니다
- 걸리는 작업: `domain/interview/types/sessionSetup.ts` 의 `ANSWER_SECONDS_CHOICES`

### Q11. 🟡 총 예상 소요 시간 계산 기준

A-05 시안이 "9문항 × 질문당 90초 → 15분"인데 답변 시간만 더하면 13.5분입니다.
답변 제출 후 다음 질문까지 5~15초가 걸린다는 걸 확인해(PR #13 리뷰) 질문당
여유 10초를 얹었고, 시안 값과 맞아떨어집니다.

- **임시 값**: 질문당 여유 10초 (5~15초의 중간값)
- 남은 결정: 실제 기준. 서버가 예상 소요를 내려주는지도 확인이 필요합니다
- 걸리는 작업: `domain/interview/lib/estimateDuration.ts`
- 어림값이라 화면에는 "약 N분"으로 표시합니다. "제한 없음"이면 계산하지 않습니다
