import { useCallback } from 'react'

import { updateBookmarkMemo } from '../api/questionApi'
import type { BookmarkedQuestion } from '../types/question'

import { useMemoSaving, type SaveMemoResult } from './useMemoSaving'

export type UseSaveBookmarkMemoResult = {
  /** 저장된 메모를 돌려줍니다. 비워서 보내면 서버가 지우고 null 을 줍니다 */
  save: (memo: string) => Promise<SaveMemoResult>
  saving: boolean
  error: string | null
  clearError: () => void
}

/**
 * 북마크 메모를 쓰거나 고치거나 지웁니다. 셋 다 같은 API 입니다 (`PATCH /api/bookmarks/{sessionId}/{questionId}`).
 * 입력할 때마다 보내면 Rate Limit(30회/60초)에 걸려서, 저장 버튼을 눌렀을 때만 부릅니다 (QuestionMemo).
 */
export function useSaveBookmarkMemo(bookmark: BookmarkedQuestion): UseSaveBookmarkMemoResult {
  const { run, saving, error, clearError } = useMemoSaving()
  const { sessionId, questionId } = bookmark

  const save = useCallback(
    (memo: string) => run(() => updateBookmarkMemo(sessionId, questionId, memo)),
    [run, sessionId, questionId],
  )

  return { save, saving, error, clearError }
}
