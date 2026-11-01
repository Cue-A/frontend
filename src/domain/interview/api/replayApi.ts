import { api } from '@/shared/api/apiClient'

import { REPLAY_BLOCK_MESSAGES } from '../lib/replayMessages'
import type { ReplayOptions } from '../types/replay'
import type { InterviewerStyle } from '../types/sessionSetup'

import './replayMock'

/**
 * 재연습 조건 조회 응답입니다. (Cue-A/backend#84 `ReplaySessionOptionsResponse`)
 *
 * **늘 최초(1회차) 세션의 값입니다.** 2 · 3회차 세션 id 로 조회해도 1회차 값이 옵니다. 고정 옵션 다섯 개
 * (`documentId` · `companyId` · `jobRole` · `questionCount` · `persona`)를 그대로 세션 시작 요청에 실어야
 * 백엔드의 옵션 비교(`ReplayOptionPolicy`)를 통과합니다. 하나라도 다르면 `INVALID_REQUEST`(400) 입니다.
 *
 * 지워진 문서 · 쓸 수 없게 된 기업이 연결돼 있어도 조회는 200 입니다. 그때는 `replayable: false` 와 이유가 옵니다.
 * 조회 자체가 실패하는 건 없는 · 남의 세션(`SESSION_NOT_FOUND`, 404)과 끝나지 않은 세션(`SESSION_NOT_COMPLETED`, 409)
 * 뿐입니다.
 */
export type ReplayOptionsResponse = {
  rootSessionId: string
  /** 문서 UUID */
  documentId: string
  /** 기업 숫자 PK. 연습 모드면 null */
  companyId: number | null
  jobRole: string
  /** 3 · 6 · 9 */
  questionCount: number
  /** `FRIENDLY` · `PRESSURE` — 세션 시작 요청과 같은 값입니다 */
  persona: InterviewerStyle
  /** 표시용 */
  documentTitle: string
  /** 표시용. 연습 모드면 null */
  companyName: string | null
  replayable: boolean
  replayBlockReasons: { code: string; message: string }[]
}

function toReplayOptions(response: ReplayOptionsResponse): ReplayOptions {
  return {
    rootSessionId: response.rootSessionId,
    documentId: response.documentId,
    documentTitle: response.documentTitle,
    companyId: response.companyId,
    companyName: response.companyName,
    jobRole: response.jobRole,
    questionCount: response.questionCount,
    interviewerStyle: response.persona,
    replayable: response.replayable,
    blockReasons: (response.replayBlockReasons ?? []).map((reason) => ({
      code: reason.code,
      message: REPLAY_BLOCK_MESSAGES[reason.code] ?? reason.message,
    })),
  }
}

/** 재연습 조건을 불러옵니다. `sessionId` 는 몇 회차든 상관없습니다 */
export async function getReplayOptions(sessionId: string): Promise<ReplayOptions> {
  const response = await api.get<ReplayOptionsResponse>(`/api/interviews/${encodeURIComponent(sessionId)}/replay-options`)
  return toReplayOptions(response)
}
