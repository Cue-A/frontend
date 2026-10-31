import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { addQuestionBookmark, removeQuestionBookmark } from '../api/questionApi'
import type { Question } from '../types/question'

export type UseQuestionBookmarksResult = {
  /** 북마크 여부. 방금 누른 값이 있으면 그걸, 없으면 목록이 준 값을 씁니다 */
  isBookmarked: (question: Question) => boolean
  /** 서버에 보내는 중인 질문인지. 그 행의 별을 잠급니다 */
  isPending: (question: Question) => boolean
  toggle: (question: Question) => void
  /** 마지막으로 누르다 실패한 이유. 사용자에게 그대로 보여줄 문구입니다 */
  error: string | null
}

type Options = {
  /**
   * 해제가 서버에서 **성공한 뒤** 불립니다. "북마크" 탭은 해제한 질문이 목록에서 빠져야 해서, 화면이 이때 목록을
   * 뒤에서 다시 받아 개수 · 쪽 수를 맞춥니다.
   */
  onRemoved?: () => void
}

/**
 * 질문 북마크 등록 · 해제입니다.
 *
 * **누르는 순간 별부터 바꾸고, 서버가 거절하면 되돌립니다.** 별 하나 켜는 일에 목록 전체가 "불러오는 중" 이 되면
 * 번거롭습니다. 해제한 질문이 "북마크" 탭에서 사라지는 건 화면이 맡습니다 (`QuestionBankPage`). 서버가 거절하면
 * 값이 되돌아가서 행도 다시 나타납니다.
 *
 * 누른 값(`overrides`)은 목록을 다시 받아도 맞습니다. 성공한 것만 남기고, 실패한 것은 되돌리기 때문입니다.
 * 다만 **이 화면에서 누른 값이 서버 값보다 우선**해서, 다른 기기에서 같은 질문의 북마크를 바꾸면 이 화면을 새로고침하기
 * 전까지 반영되지 않습니다. 알려진 한계이고, 고치려면 목록을 새로 받았을 때 서버 값으로 덮는 규칙이 필요합니다.
 * 같은 질문을 서버가 처리하는 동안에는 다시 누를 수 없습니다. 연달아 눌러서 등록과 해제 요청이 엇갈리는 걸
 * 막으려는 것입니다.
 */
export function useQuestionBookmarks({ onRemoved }: Options = {}): UseQuestionBookmarksResult {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [pendingIds, setPendingIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const isBookmarked = useCallback(
    (question: Question) => overrides[question.questionId] ?? question.bookmarked,
    [overrides],
  )
  const isPending = useCallback((question: Question) => pendingIds.includes(question.questionId), [pendingIds])

  const toggle = useCallback(
    (question: Question) => {
      const { questionId } = question
      if (pendingIds.includes(questionId)) return

      const before = isBookmarked(question)
      const next = !before

      setError(null)
      setOverrides((previous) => ({ ...previous, [questionId]: next }))
      setPendingIds((previous) => [...previous, questionId])

      const request = next ? addQuestionBookmark(questionId) : removeQuestionBookmark(questionId)
      request
        .then(() => {
          if (!next) onRemoved?.()
        })
        .catch((cause: unknown) => {
          const apiError = cause instanceof ApiError ? cause : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
          console.error('질문 북마크 변경 실패 code=%s', apiError.code)
          setOverrides((previous) => ({ ...previous, [questionId]: before }))
          setError(toUserMessage(apiError.code))
        })
        .finally(() => {
          setPendingIds((previous) => previous.filter((id) => id !== questionId))
        })
    },
    [pendingIds, isBookmarked, onRemoved],
  )

  return { isBookmarked, isPending, toggle, error }
}
