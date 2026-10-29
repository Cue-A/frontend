import type { InterviewerStyle } from '../types/interview'

type Props = {
  interviewerStyle: InterviewerStyle
}

const LABEL: Record<InterviewerStyle, string> = {
  friendly: '친절한 면접관 모드',
  pressure: '압박 면접관 모드',
}

// 배지 색: Figma(847:704 mode-pill)는 §2.4 배지 팔레트가 아니라 primary-100/primary-500
// (원색) 조합을 직접 쓴다. pressure는 해당 프레임에 없어 danger 계열(§2.4)을 그대로 유지한다.
const COLOR_CLASS: Record<InterviewerStyle, string> = {
  friendly: 'bg-primary-100 text-primary-500',
  pressure: 'bg-badge-danger-bg text-badge-danger-text',
}

export default function InterviewerStyleBadge({ interviewerStyle }: Props) {
  return (
    // TODO(design-token): design-system.md에 없는 값. 임시로 text-body-md(14px Regular) 사용 중.
    // 필요한 값: "면접관 모드 pill" 텍스트 스타일 SemiBold 14px (Figma 847:705, 문서 미정의)
    <span className={`w-fit rounded-full px-4 py-2 text-body-md ${COLOR_CLASS[interviewerStyle]}`}>
      {LABEL[interviewerStyle]}
    </span>
  )
}
