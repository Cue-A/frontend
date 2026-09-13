import type { Question, SessionPhase } from '../types/interview'

import AnswerControlBar from './AnswerControlBar'
import QuestionNumberLabel from './QuestionNumberLabel'
import QuestionProgressLabel from './QuestionProgressLabel'
import QuestionText from './QuestionText'
import QuestionTypeBadge from './QuestionTypeBadge'

type Props = {
  question: Question
  hideQuestionText: boolean
  phase: SessionPhase
  onSubmitAnswer?: () => void
}

export default function QuestionCard({ question, hideQuestionText, phase, onSubmitAnswer }: Props) {
  return (
    // TODO(design-token): design-system.md에 없는 값. 임시로 radius-lg(20px) 사용 중.
    // 필요한 값: 질문 카드 모서리 24px (Figma 848:5, 문서엔 radius-lg(20px)까지만 정의됨)
    <section className="flex flex-col gap-5 rounded-lg bg-neutral-0/75 px-12 py-7 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <QuestionNumberLabel questionNumber={question.questionNumber} />
          <QuestionTypeBadge questionType={question.questionType} />
        </div>

        <QuestionProgressLabel questionNumber={question.questionNumber} questionTotal={question.questionTotal} />
      </div>

      <QuestionText questionType={question.questionType} text={question.text} hideQuestionText={hideQuestionText} />

      <AnswerControlBar phase={phase} onSubmitAnswer={onSubmitAnswer} />
    </section>
  )
}
