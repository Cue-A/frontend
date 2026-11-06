import { loadDraft, removeDraft, saveDraft } from '@/shared/lib/draftStorage'

import type { SessionSetup } from '../types/sessionSetup'

import type { InterviewSessionOptions } from './sessionApi'

/**
 * 세션을 만들 때 고른 옵션을 이 탭에 세션별로 남겨 둡니다. (shared/lib/draftStorage)
 *
 * 면접 화면은 답변 제한 시간 · 면접관 스타일 · 질문 글 숨김을 세션 옵션으로 정합니다. 세션을 만들 때 시작 응답에
 * 서버가 저장한 옵션이 같이 와서(Cue-A/backend#100 · 이슈 #161), 그 값을 sessionId 로 남겨 두고 면접 화면이 먼저
 * 읽습니다. 같은 탭에서는 조회 API(`GET /api/interviews/{sessionId}`)를 다시 부르지 않아도 됩니다. 응답에 옵션을
 * 싣지 않는 서버(backend#100 전)면 옵션 설정에서 고른 값을 대신 남깁니다.
 *
 * 옵션 설정의 값 유지(`useSessionSetup` 의 `sessionSetup`)와 따로 둡니다. 그쪽은 "면접 시작하기" 에서 지워지고
 * 옵션을 다시 고치면 바뀌어서, 이미 만든 세션의 값이 아닙니다.
 *
 * 탭을 닫거나 로그아웃하면 사라집니다. 링크로 새로 연 탭이나 다른 기기에서 연 면접은 남긴 값이 없어서 조회 API 로
 * 넘어갑니다. 브라우저의 "탭 복제" 는 sessionStorage 를 그대로 복사해서, 복제한 탭은 남긴 값을 그대로 씁니다.
 *
 * 저장소가 막힌 브라우저(사생활 보호 · 용량 초과)에서는 sessionStorage 에 남지 않습니다. 그때도 이 화면이 떠 있는
 * 동안은 면접이 이어지도록 메모리에도 같이 둡니다 — 남긴 값이 없으면 조회 API 로 가는데, 배포 서버에는 아직 이
 * API 가 없어서 면접 화면이 오류로 멈춥니다. 메모리 값은 새로고침하면 사라집니다. (PR #130 리뷰)
 *
 * 조회 API 로 읽은 값도 여기 남겨 둡니다. 같은 세션을 이 탭에서 다시 열 때 서버를 한 번만 부르게 하려는 것입니다.
 */
const draftName = (sessionId: string) => `interviewOptions:${sessionId}`

/** sessionStorage 에 못 남겼을 때를 위한 대체 자리입니다. 이 화면이 떠 있는 동안만 남습니다 */
const memory = new Map<string, InterviewSessionOptions>()

/** 옵션 설정에서 고른 값을 면접 화면이 쓰는 모양으로 바꿉니다. 시작 응답에 저장된 옵션이 없을 때만 씁니다 */
export function toSessionOptions(setup: SessionSetup): InterviewSessionOptions {
  return {
    interviewerStyle: setup.interviewerStyle === 'PRESSURE' ? 'pressure' : 'friendly',
    hideQuestionText: setup.deliveryMode === 'VOICE_ONLY',
    answerTimeLimitSec: setup.answerSeconds,
  }
}

export function rememberSessionOptions(sessionId: string, options: InterviewSessionOptions) {
  memory.set(sessionId, options)
  saveDraft(draftName(sessionId), options)
}

/** 이 세션을 만들 때 남긴 옵션입니다. 없거나 모양이 맞지 않으면 null 입니다 */
export function recallSessionOptions(sessionId: string): InterviewSessionOptions | null {
  const remembered = memory.get(sessionId)
  if (remembered) return remembered

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

/**
 * 장치 테스트의 "면접 요약"과 면접 화면 상단의 "기업 · 직무"가 보여줄, 세션을 만들 때의 직무 · 기업명 · 질문 수입니다.
 *
 * 조회 API(`GET /api/interviews/{sessionId}`)에는 이 둘이 없어서 서버에서 다시 읽을 수 없습니다. 그래서 옵션 설정에서
 * 고른 값이 아니라 **그 세션을 만들 때의 값**을 세션별로 남깁니다. 옵션을 바꾼 뒤 예전 장치 테스트 주소로 돌아와도
 * 요약이 그 세션의 값을 보여줍니다. 새로 연 탭 · 다른 기기에는 남긴 값이 없어서 null 이고, 화면은 빈 표시("-")를 둡니다.
 *
 * 면접 화면이 읽는 옵션(`rememberSessionOptions`)과 저장 이름을 따로 둡니다. 옵션의 저장 모양을 바꾸지 않아서 이미 남아
 * 있는 값을 그대로 읽습니다.
 */
export type SessionSummary = {
  jobRole: string
  /** 기업을 고르지 않은 면접(연습 모드)이면 null. 면접 화면 상단의 "기업 · 직무" 표시에 쓴다 */
  companyName: string | null
  questionCount: number
}

const summaryDraftName = (sessionId: string) => `interviewSummary:${sessionId}`

const summaryMemory = new Map<string, SessionSummary>()

export function rememberSessionSummary(sessionId: string, summary: SessionSummary) {
  summaryMemory.set(sessionId, summary)
  saveDraft(summaryDraftName(sessionId), summary)
}

/** 이 세션을 만들 때 남긴 직무 · 기업명 · 질문 수입니다. 없거나 모양이 맞지 않으면 null 입니다 */
export function recallSessionSummary(sessionId: string): SessionSummary | null {
  const remembered = summaryMemory.get(sessionId)
  if (remembered) return remembered

  const saved = loadDraft(summaryDraftName(sessionId))
  if (typeof saved !== 'object' || saved === null) return null

  const { jobRole, companyName, questionCount } = saved as Record<string, unknown>
  if (typeof jobRole !== 'string' || !jobRole || !Number.isInteger(questionCount) || (questionCount as number) <= 0) {
    removeDraft(summaryDraftName(sessionId))
    return null
  }

  // 기업명은 나중에 더한 값이라 예전에 남긴 값에는 없다 — 없으면 null 로 본다.
  return { jobRole, companyName: typeof companyName === 'string' && companyName ? companyName : null, questionCount: questionCount as number }
}
