import type { ReactNode } from 'react'

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

/**
 * 토큰에 badge 전용 색 세트가 이미 있습니다 (--color-badge-*-bg / -text).
 * 토큰이 dev 에 들어오면 여기만 채우면 됩니다.
 *
 * 예정) brand: 'bg-badge-brand-bg text-badge-brand-text'
 */
const TONE_CLASS: Record<Tone, string> = {
  brand: 'border',
  success: 'border',
  warning: 'border',
  danger: 'border',
  info: 'border',
  neutral: 'border',
}

const BASE_CLASS = 'inline-flex items-center px-2 py-0.5'

type Props = {
  children: ReactNode
  tone?: Tone
}

/**
 * 상태를 한 단어로 알려주는 작은 라벨입니다.
 *
 * 지금 화면에 쓰이는 곳:
 * - "필수" (옵션 설정의 직무 · 자기소개서 · 면접관 스타일)
 * - "안정 · 보통 · 흔들림" (리포트의 면접 흐름)
 * - "분석 실패" (리포트의 세부 점수)
 * - "실전형 AI 면접 연습" (랜딩 히어로)
 *
 * 누르는 게 아니라 읽는 것이라 span 입니다. 버튼처럼 보이면 사람들이 누릅니다.
 */
export default function Badge({ children, tone = 'neutral' }: Props) {
  return <span className={`${BASE_CLASS} ${TONE_CLASS[tone]}`}>{children}</span>
}
