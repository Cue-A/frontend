import type { ErrorMessageOverrides } from '@/shared/api/errorMessage'

/**
 * 분석 중 화면(B-02)이 공통 문구 대신 쓰는 문구입니다. `toUserMessage(code, ANALYSIS_MESSAGES)` 로 넘깁니다.
 *
 * 공통 문구 중 몇 개는 **면접 중** 을 전제로 적혀 있어서 리포트 분석에서는 틀린 말이 됩니다.
 * - `STT_FAILED` 공통은 "다시 녹음해 주세요" 인데, 면접이 끝난 뒤라 다시 녹음할 수 없습니다
 * - `AI_TIMEOUT` 공통은 "질문을 만드는 데" 인데, 여기서는 분석입니다
 * - `CONTENT_FAILED` 공통은 "다시 연습해 주세요" 인데, 소켓으로 올 때는 다시 요청할 수 있습니다(`retryable`)
 *
 * 다시 요청할 수 있는 코드는 화면의 "다시 분석하기" 버튼과 말을 맞춥니다.
 */
export const ANALYSIS_MESSAGES: ErrorMessageOverrides = {
  AI_UNAVAILABLE: 'AI 분석 서버에 연결하지 못했어요. 잠시 후 다시 분석해 주세요.',
  AI_TIMEOUT: '분석이 제시간에 끝나지 않았어요. 다시 분석해 주세요.',
  CONTENT_FAILED: '답변 내용을 분석하지 못했어요. 다시 분석해 주세요.',
  MEDIA_FETCH_FAILED: '답변 녹화를 불러오지 못했어요. 다시 분석해 주세요.',
  STT_FAILED: '답변 녹음을 글로 옮기지 못해 리포트를 만들지 못했어요. 새 면접으로 다시 연습해 주세요.',
  // 이미 요청한 리포트의 id 를 다시 알아낼 방법이 없습니다. 상태 조회(Cue-A/backend#48)나 리포트 목록이
  // 생기면 그리로 보내고, 그 전까지는 사실대로 적습니다.
  REPORT_ALREADY_EXISTS:
    '이미 분석을 요청한 면접이에요. 지난 리포트를 모아 보는 화면이 아직 없어서 여기서는 결과를 이어 볼 수 없어요.',
}

/**
 * 등록이 이 코드로 실패하면 다시 요청해도 결과가 같습니다. 나머지(연결 실패 · 시간 초과 · 요청 과다 · 서버 오류)는
 * 다시 요청할 수 있게 둡니다. 소켓 `error` 는 서버가 `retryable` 을 같이 주므로 이 목록을 쓰지 않습니다.
 */
export const FINAL_REQUEST_ERRORS = new Set([
  'SESSION_NOT_FOUND',
  'SESSION_NOT_COMPLETED',
  'SESSION_ABORTED',
  'REPORT_ALREADY_EXISTS',
  'REPORT_TOO_SHORT',
])

/**
 * 리포트 화면의 "다시 분석"(부분 재시도)이 쓰는 문구입니다. `toUserMessage(code, RETRY_MESSAGES)` 로 넘깁니다.
 *
 * 분석 중 화면 문구를 그대로 쓰되, 리포트가 이미 있는 상황과 맞지 않는 말만 바꿉니다.
 * - `STT_FAILED` — 분석 중 화면은 "리포트를 만들지 못했어요 · 새 면접으로" 인데, 재시도는 지금 리포트가 있고
 *   새 면접을 할 이유도 없습니다
 */
export const RETRY_MESSAGES: ErrorMessageOverrides = {
  ...ANALYSIS_MESSAGES,
  STT_FAILED: '답변 녹음을 글로 옮기지 못해 다시 분석하지 못했어요.',
}

/**
 * 재시도 등록이 이 코드로 실패하면 다시 눌러도 결과가 같습니다. 버튼을 거두고 문구만 남깁니다.
 * - `INVALID_REQUEST` — 다시 분석할 수 없는 리포트(부분 실패가 아님) · 빈 축 목록
 * - `REPORT_NOT_FOUND` — 없는 리포트 · 남의 리포트
 * - `PATH_NOT_FOUND` · `METHOD_NOT_ALLOWED` — 백엔드에 재시도 API 가 아직 없음
 */
export const FINAL_RETRY_ERRORS = new Set([
  'INVALID_REQUEST',
  'REPORT_NOT_FOUND',
  'PATH_NOT_FOUND',
  'METHOD_NOT_ALLOWED',
])
