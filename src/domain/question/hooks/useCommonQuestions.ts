import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { getCommonQuestions, setCommonFavorite } from '../api/questionApi'
import { orderCommon } from '../lib/questionDisplay'
import type { CommonQuestion } from '../types/question'

export type UseCommonQuestionsResult = (
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  /** `questions` 는 즐겨찾기한 질문이 위인 순서입니다 */
  | { status: 'ready'; questions: CommonQuestion[] }
) & {
  reload: () => void
  /** 즐겨찾기를 켜고 끕니다. 누르는 순간 바로 바꾸고(위로 올라감), 서버가 거절하면 되돌립니다 */
  toggleFavorite: (question: CommonQuestion) => void
  /** 서버에 보내는 중인 질문인지. 그 카드의 별을 잠급니다 */
  isFavoritePending: (question: CommonQuestion) => boolean
  /** 마지막으로 즐겨찾기를 바꾸다 실패한 이유. 사용자에게 그대로 보여줄 문구입니다 */
  favoriteError: string | null
  /** 서버가 돌려준 메모(지웠으면 null)로 그 질문만 바꿉니다 */
  setMemoLocal: (target: CommonQuestion, memo: string | null) => void
}

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; questions: CommonQuestion[] }

/**
 * 기본 공통 질문입니다. (`GET /api/common-questions` — 백엔드에 없어 목업이 답합니다)
 *
 * 즐겨찾기는 **누르는 순간 별부터 바꾸고** 서버가 거절하면 되돌립니다. 누르면 그 질문이 바로 맨 위로 올라가야 해서
 * 응답을 기다리지 않습니다. 같은 질문을 서버가 처리하는 동안에는 다시 누를 수 없습니다 — 연달아 눌러 켜기와 끄기
 * 요청이 엇갈리는 걸 막으려는 것입니다.
 */
export function useCommonQuestions(): UseCommonQuestionsResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [pendingIds, setPendingIds] = useState<string[]>([])
  const [favoriteError, setFavoriteError] = useState<string | null>(null)

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

  const patchQuestion = useCallback((questionId: string, patch: Partial<CommonQuestion>) => {
    setState((previous) =>
      previous.status === 'ready'
        ? {
            status: 'ready',
            questions: previous.questions.map((item) => (item.questionId === questionId ? { ...item, ...patch } : item)),
          }
        : previous,
    )
  }, [])

  const toggleFavorite = useCallback(
    (question: CommonQuestion) => {
      const { questionId } = question
      if (pendingIds.includes(questionId)) return

      const next = !question.favorite
      setFavoriteError(null)
      patchQuestion(questionId, { favorite: next, favoritedAt: next ? new Date().toISOString() : null })
      setPendingIds((previous) => [...previous, questionId])

      setCommonFavorite(questionId, next)
        .catch((cause: unknown) => {
          const apiError = cause instanceof ApiError ? cause : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
          console.error('공통 질문 즐겨찾기 변경 실패 code=%s', apiError.code)
          patchQuestion(questionId, { favorite: question.favorite, favoritedAt: question.favoritedAt })
          setFavoriteError(toUserMessage(apiError.code))
        })
        .finally(() => setPendingIds((previous) => previous.filter((id) => id !== questionId)))
    },
    [pendingIds, patchQuestion],
  )

  const isFavoritePending = useCallback((question: CommonQuestion) => pendingIds.includes(question.questionId), [pendingIds])

  const setMemoLocal = useCallback(
    (target: CommonQuestion, memo: string | null) => patchQuestion(target.questionId, { memo }),
    [patchQuestion],
  )

  const ordered = useMemo(() => (state.status === 'ready' ? orderCommon(state.questions) : []), [state])

  return {
    ...(state.status === 'ready' ? { status: 'ready' as const, questions: ordered } : state),
    reload,
    toggleFavorite,
    isFavoritePending,
    favoriteError,
    setMemoLocal,
  }
}
