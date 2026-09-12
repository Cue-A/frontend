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
  | `session-end` | 세션 종료 |

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

### Q6b. 🔴 리포트 생성 대기 화면

- 필요한 결정: **진행 단계 값 목록.** 백엔드 `docs/13-report.md` 의 "계약 도착 시 확인할 것"
  #4(진행률 `stage` 값 목록)가 아직 AI 계약 대기 중입니다. 면접 중 3단계와 같은지 다른지
  정해지지 않았습니다.
- 필요한 결정: 리포트 생성 소요 시간(같은 문서 #3) — 대기 화면 문구와 타임아웃이 여기 달림.
- 걸리는 작업: 리포트 화면.

### Q7. 🟡 `errorCode` → 사용자 문구 매핑표가 비어 있습니다

백엔드 `docs/10-ai-client.md` "재시도 분류" 에 AI 연동 에러 코드는 나와 있습니다.
아래 세 개는 **프론트가 반드시 화면을 따로 만들어야 하는** 케이스입니다.

| `errorCode` | 프론트 처리 |
|---|---|
| `STT_FAILED` | 즉시 재녹음 안내 (같은 오디오 재시도해도 결과가 같음) |
| `TTS_FAILED` | 음성 없이 **텍스트로 계속 진행**. 중단하지 않음 |
| `RESUME_PARSE_FAILED` | 다른 파일 안내 |

- 남은 결정: 인증·세션 등 나머지 도메인의 `ErrorCode` 전체 목록.
- 임시 결정: 매핑에 없는 코드는 공통 문구로 떨어뜨립니다.

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

### Q10. 🟡 면접 질문 수 · 답변 시간 선택지가 확정되지 않았습니다

A-05 시안에는 "9문항", "질문당 90초" 한 값씩만 보입니다. 드롭다운인데 나머지
선택지가 시안에 없어서 프론트가 임시로 채웠습니다. (PR #13)

기능명세서 INT-2 에 "질문당 응답 제한 시간 또는 제한 없음"이 있어 **제한 없음**은
넣었습니다.

- **임시 값**: 질문 수 5 / 7 / 9문항, 답변 시간 60 / 90 / 120초 + 제한 없음
- 남은 결정: 실제 허용 범위. 서버가 `GET /api/v1/interviews/options/defaults`
  (INT-2) 로 선택지를 내려주므로, 연동하면 이 목록은 지워야 합니다
- 걸리는 작업: `domain/interview/types/sessionSetup.ts` 의
  `QUESTION_COUNT_CHOICES` · `ANSWER_SECONDS_CHOICES`
- 함께 확인: "제한 없음"일 때 세션 생성 요청에 `answerSeconds` 를 어떻게 보낼지
  (지금은 `null`)

### Q11. 🟡 총 예상 소요 시간 계산 기준

A-05 시안이 "9문항 × 질문당 90초 → 15분"인데 답변 시간만 더하면 13.5분입니다.
답변 제출 후 다음 질문까지 5~15초가 걸린다는 걸 확인해(PR #13 리뷰) 질문당
여유 10초를 얹었고, 시안 값과 맞아떨어집니다.

- **임시 값**: 질문당 여유 10초 (5~15초의 중간값)
- 남은 결정: 실제 기준. 서버가 예상 소요를 내려주는지도 확인이 필요합니다
- 걸리는 작업: `domain/interview/lib/estimateDuration.ts`
- 어림값이라 화면에는 "약 N분"으로 표시합니다. "제한 없음"이면 계산하지 않습니다
