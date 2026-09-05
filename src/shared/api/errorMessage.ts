/**
 * errorCode 를 사용자에게 보여줄 문구로 바꿉니다.
 * 서버의 message 는 개발자용이라 그대로 뿌리지 않습니다.
 *
 * 전체 코드 목록은 백엔드에서 받아야 채울 수 있습니다.
 * (docs/90-open-questions.md Q7) 그때까지는 매핑에 없는 코드가
 * 폴백 문구로 떨어지므로 화면이 깨지지는 않습니다.
 */
const ERROR_MESSAGE: Record<string, string> = {
  SESSION_NOT_FOUND: '면접 세션을 찾을 수 없어요.',
  AI_TIMEOUT: '질문을 만드는 데 시간이 걸리고 있어요. 잠시 후 다시 시도해주세요.',
}

const FALLBACK_MESSAGE = '잠시 후 다시 시도해 주세요.'

export function toUserMessage(code: string): string {
  const message = ERROR_MESSAGE[code]
  if (message) return message

  // 조용히 삼키지 않습니다. 매핑이 빠진 코드를 알아야 채울 수 있습니다.
  console.error('매핑되지 않은 errorCode code=%s', code)
  return FALLBACK_MESSAGE
}
