import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { deleteCommonQuestion } from '../api/questionApi'
import type { CommonQuestion } from '../types/question'

export type RemoveCommonResult = 'removed' | 'gone' | 'failed'

export type UseRemoveCommonQuestionResult = {
  /** `removed` 지웠음 · `gone` 이미 없음(다른 탭에서 지운 경우, 목록에서만 뺍니다) · `failed` 그 밖의 실패(`error` 에 문구) */
  remove: (question: CommonQuestion) => Promise<RemoveCommonResult>
  removing: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
}

/** 내가 추가한 질문을 지웁니다. 메모 · 즐겨찾기도 함께 지워져서 화면이 먼저 한 번 묻습니다 (CommonQuestionRemoveDialog) */
export function useRemoveCommonQuestion(): UseRemoveCommonQuestionResult {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = useCallback(async (question: CommonQuestion): Promise<RemoveCommonResult> => {
    setRemoving(true)
    setError(null)

    try {
      await deleteCommonQuestion(question.questionId)
      return 'removed'
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      if (code === 'QUESTION_NOT_FOUND') return 'gone'

      console.error('내 질문 삭제 실패 code=%s', code)
      setError(toUserMessage(code))
      return 'failed'
    } finally {
      setRemoving(false)
    }
  }, [])

  return { remove, removing, error }
}
