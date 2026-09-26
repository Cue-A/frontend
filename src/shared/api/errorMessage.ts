/**
 * errorCode 를 사용자에게 보여줄 문구로 바꿉니다.
 * 서버의 message 는 개발자용이라 그대로 뿌리지 않습니다. (docs/01-conventions.md "에러 처리")
 *
 * 백엔드 `common/exception/ErrorCode.java` 의 코드 37개를 **전부** 매핑했습니다 (이슈 #54 0-1).
 * 백엔드에 코드가 추가되면 여기에도 추가합니다 — 빠지면 콘솔에 남고 공통 문구로 떨어집니다.
 *
 * 문구 규칙
 * - 사용자가 **다음에 할 행동**을 적습니다. 다시 시도하면 풀리는 것만 "잠시 후 다시 시도해 주세요" 를 붙이고,
 *   다시 해도 결과가 같은 것(형식 · 크기 · 상한 · 끝난 세션)에는 붙이지 않습니다
 * - 우리 코드나 서버 버그로만 나는 코드(경로 없음 · 잘못된 질문 id 등)는 원인을 늘어놓지 않고 짧게 씁니다
 * - 여러 화면이 같이 쓰는 코드는 **어느 화면에서 떠도 맞는 말**로 적습니다. 화면에 맞춘 구체적인 문구가
 *   필요하면 그 화면이 `overrides` 로 덮어씁니다 (예: 문서 업로드의 형식 · 크기)
 */
const ERROR_MESSAGE: Record<string, string> = {
  // ── 공통 ──────────────────────────────────────────────
  // 서버의 요청 검증(@Valid)에 걸린 경우입니다. 화면이 미리 막고 있어서 대부분 입력값 문제입니다.
  INVALID_REQUEST: '요청 내용이 올바르지 않아요. 입력한 내용을 확인해 주세요.',
  // 둘은 사용자가 고칠 수 없습니다. 아직 백엔드에 없는 기능을 부른 경우가 대부분입니다.
  PATH_NOT_FOUND: '지금은 이 기능을 쓸 수 없어요.',
  METHOD_NOT_ALLOWED: '지금은 이 기능을 쓸 수 없어요.',
  INTERNAL_ERROR: '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
  // 엔드포인트마다 분당 상한이 있습니다 (회원가입 5회 · 세션 시작 10회 · 문서 등록 20회 …).
  RATE_LIMIT_EXCEEDED: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',

  // ── 인증 — 401 다섯 가지 (이슈 #53 4번, Cue-A/backend docs/03-auth.md "프론트가 401 을 나누는 법")
  //
  // TOKEN_EXPIRED 는 apiClient 가 재발급 → 재시도로 조용히 처리합니다. 사용자가 이
  // 문구를 보는 건 재발급까지 실패해서 로그인 화면으로 튕긴 다음입니다.
  TOKEN_EXPIRED: '로그인이 만료되었어요. 다시 로그인해 주세요.',
  INVALID_TOKEN: '로그인이 만료되었어요. 다시 로그인해 주세요.',
  INVALID_REFRESH_TOKEN: '로그인이 만료되었어요. 다시 로그인해 주세요.',
  UNAUTHORIZED: '로그인이 필요해요.',
  // 재사용 탐지로 전 기기가 끊긴 상황이라, 만료와 같은 문구를 쓰면 사용자가 자기
  // 실수인 줄 압니다. (이슈 #53 4번)
  REFRESH_TOKEN_REUSED: '보안을 위해 로그아웃되었어요. 다시 로그인해 주세요.',
  FORBIDDEN: '이 작업을 할 권한이 없어요.',
  // 로그인은 됐는데 계정이 없습니다(탈퇴 직후 등). 다시 로그인해야 풀립니다.
  USER_NOT_FOUND: '계정 정보를 찾을 수 없어요. 다시 로그인해 주세요.',

  // AUTH-1 · AUTH-3 (기능명세서 규칙·제약 기준)
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않아요.',
  EMAIL_ALREADY_EXISTS: '이미 가입된 이메일이에요.',
  // AUTH-2 카카오. code 교환이 실패했을 때 백엔드가 내려주는 코드입니다 (이슈 #53).
  OAUTH_FAILED: '카카오 로그인에 실패했어요. 다시 시도해 주세요.',

  // ── 문서 · 파일 — 백엔드 FileValidator · DocumentRegisterService · InterviewStartService 기준
  //
  // 형식 · 크기 · 업로드 미완료는 **문서와 답변 녹화가 같이 씁니다.** 허용 형식과 상한이 경로마다
  // 달라서(문서 pdf·docx·txt 10MB / 녹화 webm·mp4 50MB) 여기서는 경로를 가리지 않는 말로 두고,
  // 문서 업로드 화면이 구체적인 문구로 덮어씁니다 (domain/document/lib/documentErrorMessage.ts).
  UNSUPPORTED_FILE_FORMAT: '지원하지 않는 파일 형식이에요.',
  FILE_SIZE_EXCEEDED: '파일이 너무 커요.',
  // 세션 시작(문서가 아직 준비 중) · 답변 제출(녹화 업로드가 아직 안 끝남) 둘 다에서 납니다.
  UPLOAD_NOT_COMPLETED: '파일이 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.',
  // 백엔드는 빈 파일을 "파일이 없다" 로 받아서 이 코드를 줍니다. 사용자에겐 빈 파일 문제입니다.
  INVALID_SOURCE_TYPE: '파일 내용이 비어 있어요. 다른 파일을 골라주세요.',
  // 다시 시도해도 풀리지 않습니다. 삭제 API 가 아직 없어서(Cue-A/backend#38) 그 사실까지 말합니다.
  DOCUMENT_LIMIT_EXCEEDED: '문서는 20개까지 등록할 수 있어요. 아직 지우는 기능이 없어서 더 올릴 수 없어요.',
  DOCUMENT_NOT_FOUND: '문서를 찾을 수 없어요.',
  STORAGE_ERROR: '파일을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',

  // ── 면접 세션 ──────────────────────────────────────────
  SESSION_NOT_FOUND: '면접 세션을 찾을 수 없어요.',
  // 둘은 다시 시도해도 풀리지 않습니다 (#54 2-2). 새 면접으로 안내합니다.
  SESSION_ENDED: '이미 끝난 면접이에요. 새 면접을 시작해 주세요.',
  SESSION_ABORTED: '중단된 면접이에요. 새 면접을 시작해 주세요.',
  QUESTION_NOT_FOUND: '질문을 찾을 수 없어요.',
  // A-05 가 3 · 6 · 9 만 고르게 해서 화면에서는 나지 않습니다. 서버가 다시 보는 값입니다.
  INVALID_QUESTION_COUNT: '질문 수는 3개 · 6개 · 9개 중에서 골라주세요.',
  INVALID_CATEGORY: '고를 수 없는 질문 분야예요.',

  // ── AI (Cue-A/backend docs/10-ai-client.md 의 errorCode 와 1:1) ──
  //
  // 화면을 따로 만들어야 하는 셋 — docs/01-conventions.md "화면을 따로 만들어야 하는 에러"
  // 문구만으로는 부족하고 각 화면에서 다음 행동까지 안내해야 합니다.
  STT_FAILED: '답변이 잘 들리지 않았어요. 다시 녹음해 주세요.',
  TTS_FAILED: '음성을 만들지 못했어요. 텍스트로 계속 진행할게요.',
  RESUME_PARSE_FAILED: '파일을 읽지 못했어요. 다른 파일로 올려주세요.',

  AI_UNAVAILABLE: 'AI 면접관에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.',
  AI_TIMEOUT: '질문을 만드는 데 시간이 걸리고 있어요. 잠시 후 다시 시도해 주세요.',
  LLM_FAILED: '질문을 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
  // 둘은 AI · 백엔드 사이의 계약이 어긋났을 때만 납니다. 사용자가 할 수 있는 건 다시 시도뿐입니다.
  INVALID_QUESTION_ID: '질문 정보가 맞지 않아요. 잠시 후 다시 시도해 주세요.',
  UNEXPECTED_AI_RESPONSE: 'AI 응답을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',

  // ── 리포트 — 코드는 AI 계약서 9장과 백엔드 ErrorCode.java 에서 확인한 값들입니다 (이슈 #46)
  //
  // 아직 만드는 중입니다. 실패가 아니라 기다리면 되는 상태라 말투를 구분합니다.
  REPORT_NOT_READY: '리포트를 만들고 있어요. 잠시 후 다시 확인해 주세요.',
  // 아래 셋은 AI 리포트 계약의 코드입니다. 백엔드 ErrorCode 에는 리포트 계약이 붙을 때 들어옵니다.
  //
  // 내용 분석이 실패하면 리포트가 아예 만들어지지 않습니다. 점수가 빈 리포트가 오는 게
  // 아니라 결과 자체가 없어서, 화면은 다시 연습하는 쪽으로 안내합니다.
  CONTENT_FAILED: '내용 분석에 실패해 리포트를 만들지 못했어요. 다시 연습해 주세요.',
  // 답변이 2문항 미만이면 리포트를 만들지 않습니다. 재시도해도 결과가 같습니다.
  REPORT_TOO_SHORT: '답변이 너무 적어 리포트를 만들지 못했어요. 두 문항 이상 답해 주세요.',
  MEDIA_FETCH_FAILED: '녹화 파일을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',

  // ── 서버가 아니라 프론트가 만드는 코드 ─────────────────────
  // presigned URL 로 녹화를 올리다 실패했습니다 (domain/interview/api/mediaApi.ts).
  UPLOAD_FAILED: '답변 녹화를 올리지 못했어요. 다시 시도해 주세요.',
  // 설정 오류입니다 (shared/api/baseUrl.ts). 로컬 연동 중에만 나고, 콘솔에는 더 긴 안내가
  // 같이 찍힙니다. (PR #55 리뷰)
  CONFIG_MISSING_BASE_URL: 'VITE_API_BASE_URL 이 비어 있어요. .env.local 에 백엔드 주소를 적어주세요.',
  // 목업 모드에서 목업을 등록하지 않은 요청입니다 (shared/api/apiClient.ts). 개발 중에만 납니다.
  MOCK_NOT_FOUND: '목업 응답이 없는 요청이에요. 개발자 도구 콘솔을 확인해 주세요.',
}

const FALLBACK_MESSAGE = '잠시 후 다시 시도해 주세요.'

/**
 * 서버가 JSON 이 아닌 응답을 줬을 때 apiClient 가 만드는 `HTTP_{상태}` 코드를 뜻이 같은 코드로 옮깁니다.
 * 프록시 · 게이트웨이가 앞에서 끊으면 백엔드 errorCode 없이 HTML 이 옵니다(예: 업로드 크기 초과 413).
 * 옮긴 뒤에 매핑하므로 화면의 덮어쓰기도 그대로 탑니다 — 문서 업로드에서 413 이 나면
 * 문서용 크기 문구가 뜹니다.
 */
function toKnownCode(code: string): string {
  const match = /^HTTP_(\d{3})$/.exec(code)
  if (!match) return code

  const status = Number(match[1])
  if (status === 404 || status === 405) return 'PATH_NOT_FOUND'
  if (status === 413) return 'FILE_SIZE_EXCEEDED'
  if (status >= 500) return 'INTERNAL_ERROR'
  return code
}

/** 화면이 자기 맥락에 맞게 덮어쓸 문구. 여기 없는 코드는 공통 매핑으로 갑니다. */
export type ErrorMessageOverrides = Partial<Record<string, string>>

/**
 * @param overrides 여러 화면이 같이 쓰는 코드를 그 화면에 맞는 말로 바꿀 때 넘깁니다.
 *   예) 문서 업로드는 `UNSUPPORTED_FILE_FORMAT` 에 허용 형식까지 적습니다.
 */
export function toUserMessage(code: string, overrides?: ErrorMessageOverrides): string {
  const known = toKnownCode(code)
  const message = overrides?.[known] ?? ERROR_MESSAGE[known]
  if (message) return message

  // 조용히 삼키지 않습니다. 매핑이 빠진 코드를 알아야 채울 수 있습니다.
  // UNKNOWN 은 ApiError 가 아닌 예외(네트워크 끊김 등)라 매핑할 코드가 아닙니다.
  if (code !== 'UNKNOWN') console.error('매핑되지 않은 errorCode code=%s', code)
  return FALLBACK_MESSAGE
}
