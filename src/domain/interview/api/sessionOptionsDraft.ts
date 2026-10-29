import { loadDraft, removeDraft, saveDraft } from '@/shared/lib/draftStorage'

import type { SessionSetup } from '../types/sessionSetup'

import type { InterviewSessionOptions } from './sessionApi'

/**
 * 세션을 만들 때 고른 옵션을 이 탭에 세션별로 남겨 둡니다. (shared/lib/draftStorage)
 *
 * 면접 화면은 답변 제한 시간 · 면접관 스타일 · 질문 글 숨김을 세션 옵션으로 정하는데, 그 값을 다시 받을 API
 * (`GET /api/interviews/{sessionId}`)가 백엔드에 없습니다. 그 사이 목업이 고정값(친절 · 90초 · 질문 글 보임)을
 * 돌려줘서, 실서버 면접에서는 고른 값과 다르게 나왔습니다. 그래서 세션을 만든 순간의 값을 sessionId 로 남겨 두고
 * 면접 화면이 그걸 먼저 읽습니다.
 *
 * 옵션 설정의 값 유지(`useSessionSetup` 의 `sessionSetup`)와 따로 둡니다. 그쪽은 "면접 시작하기" 에서 지워지고
 * 옵션을 다시 고치면 바뀌어서, 이미 만든 세션의 값이 아닙니다.
 *
 * 탭을 닫거나 로그아웃하면 사라집니다. 다른 탭 · 기기에서 연 면접은 남긴 값이 없어서 조회 API 로 넘어갑니다.
 * 백엔드에 조회 API 가 생기면 서버 값을 먼저 쓰고 이 파일은 지웁니다.
 */
const draftName = (sessionId: string) => `interviewOptions:${sessionId}`

/** 옵션 설정에서 고른 값을 면접 화면이 쓰는 모양으로 바꿉니다 */
export function toSessionOptions(setup: SessionSetup): InterviewSessionOptions {
  return {
    interviewerStyle: setup.interviewerStyle === 'PRESSURE' ? 'pressure' : 'friendly',
    hideQuestionText: setup.deliveryMode === 'VOICE_ONLY',
    answerTimeLimitSec: setup.answerSeconds,
  }
}

export function rememberSessionOptions(sessionId: string, options: InterviewSessionOptions) {
  saveDraft(draftName(sessionId), options)
}

/** 이 세션을 만들 때 남긴 옵션입니다. 없거나 모양이 맞지 않으면 null 입니다 */
export function recallSessionOptions(sessionId: string): InterviewSessionOptions | null {
  const saved = loadDraft(draftName(sessionId))
  if (typeof saved !== 'object' || saved === null) return null

  const { interviewerStyle, hideQuestionText, answerTimeLimitSec } = saved as Record<string, unknown>
  const validStyle = interviewerStyle === 'friendly' || interviewerStyle === 'pressure'
  const validTime = answerTimeLimitSec === null || (typeof answerTimeLimitSec === 'number' && answerTimeLimitSec > 0)

  if (!validStyle || typeof hideQuestionText !== 'boolean' || !validTime) {
    removeDraft(draftName(sessionId))
    return null
  }

  return { interviewerStyle, hideQuestionText, answerTimeLimitSec }
}
