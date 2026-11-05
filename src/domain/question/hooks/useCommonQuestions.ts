import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getCommonQuestions } from '../api/questionApi'
import type { CommonQuestion } from '../types/question'

export type UseCommonQuestionsResult = (
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; questions: CommonQuestion[] }
) & { reload: () => void }

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; questions: CommonQuestion[] }

/** 기본 공통 질문입니다. (`GET /api/common-questions` — 백엔드에 없어 목업이 답합니다) */
export function useCommonQuestions(): UseCommonQuestionsResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    getCommonQuestions()
      .then((questions) => {
        if (!cancelled) setState({ status: 'ready', questions })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('공통 질문 조회 실패 code=%s', apiError.code)
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

  return { ...state, reload }
}
