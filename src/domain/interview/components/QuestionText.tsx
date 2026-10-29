import { QUESTION_GUIDANCE_TEXT } from '../lib/questionCopy'
import type { QuestionType } from '../types/interview'

type Props = {
  questionType: QuestionType
  text: string
  hideQuestionText: boolean
}

/**
 * hideQuestionText === false 면 실제 질문 텍스트를, true 면 questionType 별 안내
 * 문구를 보여준다. audioUrl/TTS 실패 여부와 무관하게 텍스트는 항상 이미 준비돼 있어
 * (TTS_FAILED 여도 텍스트 자체는 있음) 별도 경고 없이 조용히 텍스트만 그린다.
 */
export default function QuestionText({ questionType, text, hideQuestionText }: Props) {
  if (!hideQuestionText) {
    return (
      // TODO(design-token): design-system.md에 없는 값. 임시로 text-h1(24px Bold) 사용 중.
      // 필요한 값: 질문 본문 24px SemiBold 텍스트 스타일 (Figma 848:9는 SemiBold, 문서엔 Bold만 정의됨)
      <p className="text-center text-h1 text-neutral-900">{text}</p>
    )
  }

  return <p className="text-center text-h2 text-neutral-500">{QUESTION_GUIDANCE_TEXT[questionType]}</p>
}
