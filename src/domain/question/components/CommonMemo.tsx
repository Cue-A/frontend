import { useSaveCommonMemo } from '../hooks/useSaveCommonMemo'
import type { CommonQuestion } from '../types/question'

import QuestionMemo from './QuestionMemo'

type Props = {
  question: CommonQuestion
  onSaved: (question: CommonQuestion, memo: string | null) => void
}

/** 공통 질문 카드 아래의 메모입니다. 저장은 `PATCH /api/common-questions/{questionId}` 입니다 (임시 계약) */
export default function CommonMemo({ question, onSaved }: Props) {
  const saver = useSaveCommonMemo(question)

  return <QuestionMemo memo={question.memo} {...saver} onSaved={(memo) => onSaved(question, memo)} />
}
