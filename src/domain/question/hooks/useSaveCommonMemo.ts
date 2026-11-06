import { useCallback } from 'react'

import { updateCommonMemo } from '../api/questionApi'
import type { CommonQuestion } from '../types/question'

import { useMemoSaving, type SaveMemoResult } from './useMemoSaving'

export type UseSaveCommonMemoResult = {
  save: (memo: string) => Promise<SaveMemoResult>
  saving: boolean
  error: string | null
  clearError: () => void
}

/** 공통 질문 메모를 쓰거나 고치거나 지웁니다. (`PATCH /api/common-questions/{questionId}/memo` — 백엔드에 없어 목업이 답합니다) */
export function useSaveCommonMemo(question: CommonQuestion): UseSaveCommonMemoResult {
  const { run, saving, error, clearError } = useMemoSaving()
  const { questionId } = question

  const save = useCallback((memo: string) => run(() => updateCommonMemo(questionId, memo)), [run, questionId])

  return { save, saving, error, clearError }
}
