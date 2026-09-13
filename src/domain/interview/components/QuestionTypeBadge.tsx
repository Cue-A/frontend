import { QUESTION_TYPE_BADGE_LABEL } from '../lib/questionCopy'
import type { QuestionType } from '../types/interview'

type Props = {
  questionType: QuestionType
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M4.5 15a8 8 0 0014.5 3M19.5 9A8 8 0 005 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function QuestionTypeBadge({ questionType }: Props) {
  if (questionType === 'QUESTION') return null

  const label = QUESTION_TYPE_BADGE_LABEL[questionType]

  if (questionType === 'FOLLOWUP') {
    return (
      <span className="flex w-fit items-center gap-1 rounded-full bg-semantic-warning/20 px-3 py-1 text-body-sm text-semantic-warning">
        <SparkIcon />
        {label}
      </span>
    )
  }

  return (
    // TODO(design-token): design-system.md에 없는 값. 임의로 neutral-200 사용 중.
    // 필요한 값: "REASK 배지 배경색"(스펙 문구는 neutral/100이나 해당 토큰이 정의돼 있지 않음)
    <span className="flex w-fit items-center gap-1 rounded-full bg-neutral-200 px-3 py-1 text-body-sm text-neutral-700">
      <RefreshIcon />
      {label}
    </span>
  )
}
