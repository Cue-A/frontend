import type { QuestionType } from '../types/interview'

/**
 * hideQuestionText === true 일 때 questionText 대신 보여줄 안내 문구입니다.
 * (options.hideQuestionText: docs/01-conventions.md 공통 컨텍스트 참고)
 */
export const QUESTION_GUIDANCE_TEXT: Record<QuestionType, string> = {
  QUESTION: '음성으로 질문을 듣고 답변을 준비해주세요',
  FOLLOWUP: '음성으로 꼬리질문을 듣고 답변을 준비해주세요',
  REASK: '음성으로 다시 질문을 듣고 답변을 준비해주세요',
}

/**
 * QuestionTypeBadge 라벨입니다. QUESTION 은 배지를 렌더링하지 않으므로 없습니다.
 */
export const QUESTION_TYPE_BADGE_LABEL: Partial<Record<QuestionType, string>> = {
  FOLLOWUP: 'AI 꼬리질문',
  REASK: '다시 답변해 주세요',
}
