import type { ErrorMessageOverrides } from '@/shared/api/errorMessage'

/**
 * 재연습을 시작할 수 없는 이유의 화면 문구입니다. 코드는 백엔드 `ReplayBlockReason` 입니다. (Cue-A/backend#84)
 *
 * 백엔드도 안내 문구(`message`)를 같이 주지만 말투가 "~습니다" 라 화면 문구와 어긋나서, 아는 코드는 여기 문구를
 * 씁니다. 모르는 코드가 오면 백엔드 문구를 그대로 보여줍니다.
 *
 * 재연습 조건은 바꿀 수 없어서(같은 질문으로 다시 보는 게 재연습의 목적), 다른 문서 · 기업으로 바꾸라고
 * 안내하지 않습니다. 새 면접으로 연습하도록만 안내합니다.
 */
export const REPLAY_BLOCK_MESSAGES: Record<string, string> = {
  DOCUMENT_DELETED: '첫 면접에 쓴 자기소개서가 삭제되어 재연습을 시작할 수 없어요.',
  COMPANY_UNVERIFIED: '첫 면접에 고른 기업 정보를 지금은 쓸 수 없어서 재연습을 시작할 수 없어요.',
}

/** 재연습할 면접을 모를 때(없는 · 남의 면접, 주소에 세션 id 가 없음) 보여주는 문구입니다 */
export const REPLAY_NOT_FOUND_MESSAGE = '재연습할 면접을 찾을 수 없어요.'

/** 재연습 조건 조회(`GET /api/interviews/{sessionId}/replay-options`)가 실패했을 때 공통 문구 대신 쓰는 문구입니다 */
export const REPLAY_OPTIONS_MESSAGES: ErrorMessageOverrides = {
  SESSION_NOT_FOUND: REPLAY_NOT_FOUND_MESSAGE,
  SESSION_NOT_COMPLETED: '끝까지 마친 면접만 재연습할 수 있어요.',
}

/**
 * 재연습 시작(`POST /api/interviews` + `sourceSessionId`)이 실패했을 때 공통 문구 대신 쓰는 문구입니다.
 *
 * 조회와 시작 사이에 문서가 지워지거나 기업 정보가 바뀌면 조회에서는 시작할 수 있다고 했어도 시작이 거절됩니다.
 * - `DOCUMENT_NOT_FOUND` — 첫 면접의 자기소개서가 지워짐
 * - `INVALID_REQUEST` — 기업을 쓸 수 없게 됐거나, 보낸 조건이 첫 면접과 다름
 */
export const REPLAY_START_MESSAGES: ErrorMessageOverrides = {
  ...REPLAY_OPTIONS_MESSAGES,
  DOCUMENT_NOT_FOUND: REPLAY_BLOCK_MESSAGES.DOCUMENT_DELETED,
  INVALID_REQUEST: '첫 면접과 같은 조건으로 재연습을 시작하지 못했어요. 새로고침한 뒤 다시 시도해 주세요.',
}
