import type { InterviewerStyle } from '../types/interview'

type Props = {
  interviewerStyle: InterviewerStyle
  /** 설정한 직무. 없으면 보조 줄에서 뺀다. */
  jobRole?: string | null
  /** 설정한 기업. 기업 없이 시작한 면접(연습 모드)이면 null. */
  companyName?: string | null
}

const LABEL: Record<InterviewerStyle, string> = {
  friendly: '친절한 면접관 모드',
  pressure: '압박 면접관 모드',
}

/**
 * 상단 중앙 면접관 모드 제목과 그 아래 보조 줄입니다. 시안은 알약 배지가 아니라 글씨 제목이다.
 * 보조 줄은 "기업 · 직무" 순서이고, 기업을 설정하지 않은 면접이면 직무만 보인다. 둘 다 없으면 줄 자체를 숨긴다.
 */
export default function InterviewerStyleBadge({ interviewerStyle, jobRole = null, companyName = null }: Props) {
  const subtitle = [companyName, jobRole].filter(Boolean).join(' · ')

  return (
    <div className="flex max-w-md flex-col items-center gap-0.5">
      <span className={`text-body-lg ${interviewerStyle === 'pressure' ? 'text-semantic-danger' : 'text-stage-text'}`}>
        {LABEL[interviewerStyle]}
      </span>
      {subtitle && <span className="max-w-full truncate text-body-sm text-stage-sub">{subtitle}</span>}
    </div>
  )
}
