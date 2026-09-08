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

  SESSION_NOT_FOUND: '면접 세션을 찾을 수 없어요.',
  AI_TIMEOUT: '질문을 만드는 데 시간이 걸리고 있어요. 잠시 후 다시 시도해주세요.',
  INVALID_TOKEN: '로그인이 만료되었어요. 다시 로그인해 주세요.',
}

const FALLBACK_MESSAGE = '잠시 후 다시 시도해 주세요.'

export function toUserMessage(code: string): string {
  const message = ERROR_MESSAGE[code]
  if (message) return message

  // 조용히 삼키지 않습니다. 매핑이 빠진 코드를 알아야 채울 수 있습니다.
  console.error('매핑되지 않은 errorCode code=%s', code)
  return FALLBACK_MESSAGE
}
