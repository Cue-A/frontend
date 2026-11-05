import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getAllBookmarks } from '../api/questionApi'
import { bookmarkKey } from '../lib/questionDisplay'
import type { BookmarkedQuestion } from '../types/question'

export type UseBookmarksResult = (
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; bookmarks: BookmarkedQuestion[] }
) & {
  /** 에러 화면의 "다시 시도" 에 씁니다 */
  reload: () => void
  /** 서버에서 뺀 줄을 목록에서도 뺍니다. 다시 받지 않습니다 (명세 권장) */
  removeLocal: (target: BookmarkedQuestion) => void
  /** 서버가 돌려준 메모(지웠으면 null)로 그 줄만 바꿉니다 */
  setMemoLocal: (target: BookmarkedQuestion, memo: string | null) => void
}

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; bookmarks: BookmarkedQuestion[] }

/**
 * 내 질문 은행(북마크) 전부입니다. (`GET /api/bookmarks` — `VITE_REAL_APIS` 에 `bookmarks` 가 없으면 목업이 답합니다)
 *
 * 서버에 검색이 없어서 전부 받아 두고 화면이 거릅니다 (`getAllBookmarks`). 해제와 메모 저장은 서버가 성공한 뒤
 * 이 목록을 바로 고칩니다 — 매번 다시 받지 않아도 됩니다.
 */
export function useBookmarks(): UseBookmarksResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    getAllBookmarks()
      .then((bookmarks) => {
        if (!cancelled) setState({ status: 'ready', bookmarks })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('질문 은행 목록 조회 실패 code=%s', apiError.code)
        setState({ status: 'error', error: apiError })
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  const removeLocal = useCallback((target: BookmarkedQuestion) => {
    setState((previous) =>
      previous.status === 'ready'
        ? { status: 'ready', bookmarks: previous.bookmarks.filter((item) => bookmarkKey(item) !== bookmarkKey(target)) }
        : previous,
    )
  }, [])

  const setMemoLocal = useCallback((target: BookmarkedQuestion, memo: string | null) => {
    setState((previous) =>
      previous.status === 'ready'
        ? {
            status: 'ready',
            bookmarks: previous.bookmarks.map((item) => (bookmarkKey(item) === bookmarkKey(target) ? { ...item, memo } : item)),
          }
        : previous,
    )
  }, [])

  return { ...state, reload, removeLocal, setMemoLocal }
}
