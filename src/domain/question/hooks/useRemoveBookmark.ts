import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { deleteBookmark } from '../api/questionApi'
import type { BookmarkedQuestion } from '../types/question'

export type RemoveResult = 'removed' | 'gone' | 'failed'

export type UseRemoveBookmarkResult = {
  /**
   * `removed` 뺐음 · `gone` 이미 없음 · `failed` 그 밖의 실패(`error` 에 문구).
   * 이미 뺀 질문도 백엔드는 `BOOKMARK_NOT_FOUND` 로 답합니다. 다른 탭에서 뺀 경우라 실패가 아니라 `gone` 으로
   * 돌려주고, 화면은 그 줄을 목록에서 뺍니다.
   */
  remove: (bookmark: BookmarkedQuestion) => Promise<RemoveResult>
  removing: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
}

/** 질문 은행에서 질문을 뺍니다. 되돌릴 수 없어서 화면이 먼저 한 번 묻고 이 훅을 부릅니다 (BookmarkRemoveDialog) */
export function useRemoveBookmark(): UseRemoveBookmarkResult {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = useCallback(async (bookmark: BookmarkedQuestion): Promise<RemoveResult> => {
    setRemoving(true)
    setError(null)

    try {
      await deleteBookmark(bookmark.sessionId, bookmark.questionId)
      return 'removed'
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      if (code === 'BOOKMARK_NOT_FOUND') return 'gone'

      console.error('질문 은행 해제 실패 code=%s', code)
      setError(toUserMessage(code))
      return 'failed'
    } finally {
      setRemoving(false)
    }
  }, [])

  return { remove, removing, error }
}
