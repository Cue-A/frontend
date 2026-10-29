import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getPracticeSessions } from '../api/practiceApi'
import type { PracticeListQuery, PracticePage } from '../types/practice'

export type UsePracticeSessionsResult = (
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | {
      status: 'ready'
      page: PracticePage
      /**
       * 조건(폴더 · 탭 · 검색어 · 쪽)을 바꿔서 새 목록을 받는 중인지. 받는 동안에도 **이전 목록을 그대로 보여줍니다** —
       * 검색어를 칠 때마다 목록이 "불러오는 중" 으로 비었다가 다시 차면 화면이 깜빡입니다.
       */
      updating: boolean
    }
) & {
  /** 에러 화면의 "다시 시도" 에 씁니다. 불러오는 중 화면으로 바꾼 뒤 다시 받습니다 */
  reload: () => void
}

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; page: PracticePage; key: string }

function keyOf(query: PracticeListQuery) {
  return JSON.stringify([query.folder, query.status, query.keyword.trim(), query.page, query.size])
}

/**
 * 연습 기록 목록입니다. 조건이 바뀌면 다시 받습니다. (`GET /api/interviews` — 백엔드에 없어 목업이 답합니다)
 *
 * 늦게 온 응답이 새 조건의 목록을 덮지 않게, 조건이 바뀌면 앞선 요청의 결과는 버립니다.
 */
export function usePracticeSessions(query: PracticeListQuery): UsePracticeSessionsResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const key = keyOf(query)
  // query 객체는 렌더마다 새로 만들어지므로 effect 는 값 하나하나에 겁니다.
  const { folder, status, keyword, page, size } = query

  useEffect(() => {
    let cancelled = false
    const requestKey = keyOf({ folder, status, keyword, page, size })

    getPracticeSessions({ folder, status, keyword, page, size })
      .then((result) => {
        if (!cancelled) setState({ status: 'ready', page: result, key: requestKey })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('연습 기록 조회 실패 code=%s', apiError.code)
        setState({ status: 'error', error: apiError })
      })

    return () => {
      cancelled = true
    }
  }, [folder, status, keyword, page, size, attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  if (state.status === 'ready') {
    return { status: 'ready', page: state.page, updating: state.key !== key, reload }
  }
  return { ...state, reload }
}
