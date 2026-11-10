import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { createCommonQuestion, updateCommonQuestion } from '../api/questionApi'
import type { CommonQuestion } from '../types/question'

export type UseSaveCommonQuestionResult = {
  /**
   * `editing` 이 있으면 그 질문을 고치고, 없으면 새로 추가합니다.
   * 실패하면 null 이고 `error` 에 문구가 있습니다. 고치려던 질문이 이미 없으면(다른 탭에서 지운 경우) `'gone'` 입니다.
   */
  save: (input: { text: string; category: string }) => Promise<CommonQuestion | 'gone' | null>
  saving: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  clearError: () => void
}

/**
 * 내 질문을 추가하거나 고칩니다. (`POST` · `PATCH /api/common-questions`)
 * 저장하는 동안 버튼을 잠그고, 실패하면 입력을 그대로 두고 이유를 보여줍니다.
 */
export function useSaveCommonQuestion(editing: CommonQuestion | null): UseSaveCommonQuestionResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editingId = editing?.questionId ?? null

  const save = useCallback(
    async (input: { text: string; category: string }) => {
      setSaving(true)
      setError(null)

      try {
        return editingId ? await updateCommonQuestion(editingId, input) : await createCommonQuestion(input)
      } catch (cause) {
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        if (editingId && code === 'QUESTION_NOT_FOUND') return 'gone'

        console.error('내 질문 저장 실패 code=%s', code)
        setError(toUserMessage(code))
        return null
      } finally {
        setSaving(false)
      }
    },
    [editingId],
  )

  const clearError = useCallback(() => setError(null), [])

  return { save, saving, error, clearError }
}
