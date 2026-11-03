import { useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getInterviewOptions, type InterviewSessionOptions } from '../api/sessionApi'

export type UseInterviewSessionOptionsResult =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; options: InterviewSessionOptions }

/**
 * 면접 진행 화면(B-01-2)이 필요로 하는 세션 옵션(interviewerStyle · hideQuestionText ·
 * answerTimeLimitSec)을 가져온다. 세션을 만들 때 이 탭에 남겨 둔 값(시작 응답에 담긴 저장값)을 먼저 쓰고,
 * 없을 때만(새 탭 · 다른 기기) GET /api/interviews/{sessionId} 로 간다. 조회 API 는 백엔드 dev 에 머지됐고
 * (backend#100) 배포 서버에 반영되기 전까지는 목업이 답한다 (sessionApi.getInterviewOptions 참고).
 */
type State = UseInterviewSessionOptionsResult & { sessionId: string }

export function useInterviewSessionOptions(sessionId: string): UseInterviewSessionOptionsResult {
  const [state, setState] = useState<State>({ sessionId, status: 'loading' })

  useEffect(() => {
    let cancelled = false

    getInterviewOptions(sessionId)
      .then((options) => {
        if (!cancelled) setState({ sessionId, status: 'ready', options })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        setState({ sessionId, status: 'error', error: apiError })
      })

    return () => {
      cancelled = true
    }
  }, [sessionId])

  // sessionId 가 바뀐 직후, 위 effect 가 아직 새 요청을 끝내기 전에는 이전 결과 대신 로딩으로 본다.
  if (state.sessionId !== sessionId) {
    return { status: 'loading' }
  }

  return state
}
