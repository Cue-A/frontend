import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { updateBookmarkMemo } from '../api/questionApi'
import type { BookmarkedQuestion } from '../types/question'

export type SaveMemoResult = { ok: true; memo: string | null } | { ok: false }

export type UseSaveBookmarkMemoResult = {
  /** 저장된 메모를 돌려줍니다. 비워서 보내면 서버가 지우고 null 을 줍니다. 실패하면 `error` 에 문구가 있습니다 */
  save: (bookmark: BookmarkedQuestion, memo: string) => Promise<SaveMemoResult>
  saving: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  clearError: () => void
}

/**
 * 메모를 쓰거나 고치거나 지웁니다. 셋 다 같은 API 입니다 (`PATCH /api/bookmarks/{sessionId}/{questionId}`).
 * 입력할 때마다 보내면 Rate Limit(30회/60초)에 걸려서, 저장 버튼을 눌렀을 때만 부릅니다 (BookmarkMemo).
 */
export function useSaveBookmarkMemo(): UseSaveBookmarkMemoResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(async (bookmark: BookmarkedQuestion, memo: string): Promise<SaveMemoResult> => {
    setSaving(true)
    setError(null)

    try {
      return { ok: true, memo: await updateBookmarkMemo(bookmark.sessionId, bookmark.questionId, memo) }
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      console.error('메모 저장 실패 code=%s', code)
      setError(toUserMessage(code))
      return { ok: false }
    } finally {
      setSaving(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { save, saving, error, clearError }
}
