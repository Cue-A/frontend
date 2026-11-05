import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getInterviewRecordings } from '../api/recordingsApi'
import type { InterviewRecordings } from '../types/recording'

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | {
      status: 'ready'
      recordings: InterviewRecordings
      /** 몇 번째로 받은 목록인지. 0 부터 — 재생 실패로 다시 받았는지 화면이 셀 때 씁니다 */
      generation: number
    }

export type UseInterviewRecordingsResult = State & {
  /**
   * 목록을 다시 받습니다. 재생 주소가 만료돼(1시간) 재생이 실패했을 때 씁니다. 받는 동안에는 지금 목록을 그대로 둡니다 —
   * 비우면 영상 자리가 깜빡이고 고른 문항이 처음으로 돌아갑니다.
   */
  refresh: () => void
}

function toApiError(cause: unknown) {
  return cause instanceof ApiError ? cause : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
}

/**
 * 리포트의 답변 영상 재생목록입니다. (`GET /api/interviews/{sessionId}/recordings` · 이슈 #168)
 *
 * 리포트를 먼저 그린 뒤 이 칸만 따로 불러옵니다. 영상을 못 받아도 점수 · 분석 내용은 그대로 보입니다.
 * `sessionId` 가 null 이면(리포트를 아직 못 받음) 부르지 않습니다.
 */
export function useInterviewRecordings(sessionId: string | null): UseInterviewRecordingsResult {
  const [state, setState] = useState<State & { sessionId: string | null }>({ sessionId, status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    getInterviewRecordings(sessionId)
      .then((recordings) => {
        if (cancelled) return
        setState((previous) => ({
          sessionId,
          status: 'ready',
          recordings,
          generation: previous.status === 'ready' && previous.sessionId === sessionId ? previous.generation + 1 : 0,
        }))
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const error = toApiError(cause)
        console.error('답변 영상 목록 조회 실패 code=%s', error.code)
        setState({ sessionId, status: 'error', error })
      })

    return () => {
      cancelled = true
    }
  }, [sessionId, attempt])

  const refresh = useCallback(() => setAttempt((value) => value + 1), [])

  // 다른 리포트로 옮긴 직후에는 이전 리포트의 목록 대신 로딩으로 봅니다
  if (state.sessionId !== sessionId || state.status === 'loading') return { status: 'loading', refresh }
  if (state.status === 'error') return { status: 'error', error: state.error, refresh }
  return { status: 'ready', recordings: state.recordings, generation: state.generation, refresh }
}
