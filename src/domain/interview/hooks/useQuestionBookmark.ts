import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { setQuestionBookmark } from '../api/sessionApi'

export type UseQuestionBookmarkResult = {
  bookmarked: boolean
  /** 서버에 보내는 중. 이 동안은 버튼을 잠가 요청 순서가 뒤바뀌는 걸 막습니다 */
  pending: boolean
  toggle: () => void
  /** 마지막으로 누르다 실패한 이유. 사용자에게 그대로 보여줄 문구입니다 */
  error: string | null
}

/**
 * 면접 중 현재 질문의 북마크 토글입니다.
 *
 * 누르는 순간 아이콘부터 바꾸고, 서버가 거절하면 되돌립니다. 새 질문이 오면(`questionId` 변경) 담기지 않은 상태로
 * 시작합니다 — 서버가 새로 push 한 질문은 항상 그렇습니다. 되묻기(`q_4r`)는 다른 질문 id 라 따로 담깁니다.
 *
 * 면접 중 새로고침하면 지금 질문의 북마크 여부를 다시 받을 방법이 없어 빈 아이콘으로 보입니다(서버 명세의 한계).
 * 그때 눌러서 `true` 를 보내도 이미 담겨 있으면 그대로라 안전합니다.
 */
type State = { questionId: string | null; bookmarked: boolean; pending: boolean; error: string | null }

const EMPTY: State = { questionId: null, bookmarked: false, pending: false, error: null }

export function useQuestionBookmark(sessionId: string, questionId: string | null): UseQuestionBookmarkResult {
  // 상태에 질문 id 를 같이 두고, 지금 질문의 것일 때만 쓴다. 새 질문이 오면 effect 로 되돌리지 않아도 빈 상태로 보인다.
  const [state, setState] = useState<State>(EMPTY)
  const current = state.questionId === questionId ? state : EMPTY

  const toggle = useCallback(() => {
    if (!questionId || current.pending) return

    const before = current.bookmarked
    setState({ questionId, bookmarked: !before, pending: true, error: null })

    setQuestionBookmark(sessionId, questionId, !before)
      .then(() => {
        setState((previous) => (previous.questionId === questionId ? { ...previous, pending: false } : previous))
      })
      .catch((cause: unknown) => {
        const apiError = cause instanceof ApiError ? cause : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('면접 중 질문 북마크 실패 code=%s', apiError.code)
        // 질문이 이미 바뀌었으면 되돌릴 대상이 없다.
        setState((previous) =>
          previous.questionId === questionId
            ? { questionId, bookmarked: before, pending: false, error: toUserMessage(apiError.code) }
            : previous,
        )
      })
  }, [sessionId, questionId, current.bookmarked, current.pending])

  return { bookmarked: current.bookmarked, pending: current.pending, toggle, error: current.error }
}
