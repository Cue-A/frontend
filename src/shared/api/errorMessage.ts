/**
 * errorCode 를 사용자에게 보여줄 문구로 바꿉니다.
 * 서버의 message 는 개발자용이라 그대로 뿌리지 않습니다.
 *
 * 인증·세션 등 나머지 도메인의 전체 코드 목록은 아직 못 받았습니다
 * (docs/90-open-questions.md Q7). 매핑에 없는 코드는 폴백으로 떨어지므로
 * 화면이 깨지지는 않습니다.
 */
const ERROR_MESSAGE: Record<string, string> = {
  // 화면을 따로 만들어야 하는 셋 — docs/01-conventions.md "화면을 따로 만들어야 하는 에러"
  // 문구만으로는 부족하고 각 화면에서 다음 행동까지 안내해야 합니다.
  STT_FAILED: '답변이 잘 들리지 않았어요. 다시 녹음해 주세요.',
  TTS_FAILED: '음성을 만들지 못했어요. 텍스트로 계속 진행할게요.',
  RESUME_PARSE_FAILED: '파일을 읽지 못했어요. 다른 파일로 올려주세요.',

  // 문서 — 백엔드 FileValidator · DocumentRegisterService · InterviewStartService 기준 (이슈 #54 1-4)
  UNSUPPORTED_FILE_FORMAT: 'pdf · docx · txt 파일만 올릴 수 있어요.',
  FILE_SIZE_EXCEEDED: '파일이 너무 커요. 10MB 이하로 올려주세요.',
  // 백엔드는 빈 파일을 "파일이 없다" 로 받아서 이 코드를 줍니다. 사용자에겐 빈 파일 문제입니다.
  INVALID_SOURCE_TYPE: '파일 내용이 비어 있어요. 다른 파일을 골라주세요.',
  // 다시 시도해도 풀리지 않습니다. 삭제 API 가 아직 없어서(Cue-A/backend#38) 그 사실까지 말합니다.
  DOCUMENT_LIMIT_EXCEEDED: '문서는 20개까지 등록할 수 있어요. 아직 지우는 기능이 없어서 더 올릴 수 없어요.',
  DOCUMENT_NOT_FOUND: '문서를 찾을 수 없어요.',
  UPLOAD_NOT_COMPLETED: '문서가 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.',
  RATE_LIMIT_EXCEEDED: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',

  // 리포트 — 코드는 AI 계약서 9장과 백엔드 ErrorCode.java 에서 확인한 값들입니다.
  // (이슈 #46)
  //
  // 내용 분석이 실패하면 리포트가 아예 만들어지지 않습니다. 점수가 빈 리포트가 오는 게
  // 아니라 결과 자체가 없어서, 화면은 다시 연습하는 쪽으로 안내합니다.
  CONTENT_FAILED: '내용 분석에 실패해 리포트를 만들지 못했어요. 다시 연습해 주세요.',
  // 아직 만드는 중입니다. 실패가 아니라 기다리면 되는 상태라 말투를 구분합니다.
  REPORT_NOT_READY: '리포트를 만들고 있어요. 잠시 후 다시 확인해 주세요.',
  // 답변이 2문항 미만이면 리포트를 만들지 않습니다. 재시도해도 결과가 같습니다.
  REPORT_TOO_SHORT: '답변이 너무 적어 리포트를 만들지 못했어요. 두 문항 이상 답해주세요.',
  MEDIA_FETCH_FAILED: '녹화 파일을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',

  SESSION_NOT_FOUND: '면접 세션을 찾을 수 없어요.',
  AI_TIMEOUT: '질문을 만드는 데 시간이 걸리고 있어요. 잠시 후 다시 시도해주세요.',

  // 인증 — 401 다섯 가지 (이슈 #53 4번, Cue-A/backend docs/03-auth.md "프론트가 401 을 나누는 법")
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

  // AUTH-1 · AUTH-3 (docs/design-system.md 대상 아님, 기능명세서 규칙·제약 기준)
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않아요.',
  EMAIL_ALREADY_EXISTS: '이미 가입된 이메일이에요.',

  // AUTH-2 카카오. code 교환이 실패했을 때 백엔드가 내려주는 코드입니다 (이슈 #53).
  OAUTH_FAILED: '카카오 로그인에 실패했어요. 다시 시도해 주세요.',

  // 서버가 주는 코드가 아니라 우리가 만든 설정 오류입니다 (shared/api/baseUrl.ts).
  // 로컬 연동 중에만 나고, 콘솔에는 더 긴 안내가 같이 찍힙니다. (PR #55 리뷰)
  CONFIG_MISSING_BASE_URL: 'VITE_API_BASE_URL 이 비어 있어요. .env.local 에 백엔드 주소를 적어주세요.',
}

const FALLBACK_MESSAGE = '잠시 후 다시 시도해 주세요.'

export function toUserMessage(code: string): string {
  const message = ERROR_MESSAGE[code]
  if (message) return message

  // 조용히 삼키지 않습니다. 매핑이 빠진 코드를 알아야 채울 수 있습니다.
  console.error('매핑되지 않은 errorCode code=%s', code)
  return FALLBACK_MESSAGE
}
