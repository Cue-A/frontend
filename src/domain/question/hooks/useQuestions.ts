import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getQuestions } from '../api/questionApi'
import type { QuestionListQuery, QuestionPage, QuestionTab } from '../types/question'

export type UseQuestionsResult = (
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | {
      status: 'ready'
      page: QuestionPage
      /** 지금 들고 있는 목록을 받아 온 탭. 새 탭의 목록을 받는 동안에는 앞 탭입니다 */
      loadedTab: QuestionTab
      /**
       * 조건(탭 · 검색어 · 쪽)을 바꿔서 새 목록을 받는 중인지. 받는 동안에도 **이전 목록을 그대로 보여줍니다** —
       * 검색어를 칠 때마다 목록이 "불러오는 중" 으로 비었다가 다시 차면 화면이 깜빡입니다.
       */
      updating: boolean
    }
) & {
  /** 에러 화면의 "다시 시도" 에 씁니다. 불러오는 중 화면으로 바꾼 뒤 다시 받습니다 */
  reload: () => void
  /**
   * 목록을 그대로 둔 채 뒤에서 다시 받습니다. 북마크 탭에서 해제한 뒤에 씁니다 — reload 를 쓰면 목록이
   * "불러오는 중" 으로 잠깐 비었다가 다시 채워져서 깜빡입니다.
   */
  refresh: () => void
}

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError; key: string }
  | { status: 'ready'; page: QuestionPage; key: string; tab: QuestionTab }

function keyOf(query: QuestionListQuery) {
  return JSON.stringify([query.tab, query.keyword.trim(), query.page, query.size])
}

/**
 * 질문 은행 목록입니다. 조건이 바뀌면 다시 받습니다. (`GET /api/questions` — 백엔드에 없어 목업이 답합니다)
 *
 * 연습 기록 목록(`usePracticeSessions`)과 같은 방식입니다. 늦게 온 응답이 새 조건의 목록을 덮지 않게, 조건이 바뀌면
 * 앞선 요청의 결과는 버립니다. 오류가 난 뒤 조건을 바꾸면 새 응답이 올 때까지 **불러오는 중**으로 둡니다 — 오류
 * 안내는 앞선 조건의 결과라, 탭을 바꿨는데 그대로 남아 있으면 새 조건도 실패한 것처럼 읽힙니다.
 */
export function useQuestions(query: QuestionListQuery): UseQuestionsResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const key = keyOf(query)
  // query 객체는 렌더마다 새로 만들어지므로 effect 는 값 하나하나에 겁니다.
  const { tab, keyword, page, size } = query

  useEffect(() => {
    let cancelled = false
    const requestKey = keyOf({ tab, keyword, page, size })

    getQuestions({ tab, keyword, page, size })
      .then((result) => {
        if (!cancelled) setState({ status: 'ready', page: result, key: requestKey, tab })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('질문 목록 조회 실패 code=%s', apiError.code)
        setState({ status: 'error', error: apiError, key: requestKey })
      })

    return () => {
      cancelled = true
    }
  }, [tab, keyword, page, size, attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  const refresh = useCallback(() => setAttempt((value) => value + 1), [])

  if (state.status === 'ready') {
    return { status: 'ready', page: state.page, loadedTab: state.tab, updating: state.key !== key, reload, refresh }
  }
  if (state.status === 'error' && state.key === key) {
    return { status: 'error', error: state.error, reload, refresh }
  }
  return { status: 'loading', reload, refresh }
}
