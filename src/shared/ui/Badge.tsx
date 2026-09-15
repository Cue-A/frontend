import type { ReactNode } from 'react'

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

/** 토큰의 badge 전용 색 세트를 그대로 씁니다 (--color-badge-*-bg / -text). */
const TONE_CLASS: Record<Tone, string> = {
  brand: 'bg-badge-brand-bg text-badge-brand-text',
  success: 'bg-badge-success-bg text-badge-success-text',
  warning: 'bg-badge-warning-bg text-badge-warning-text',
  danger: 'bg-badge-danger-bg text-badge-danger-text',
  info: 'bg-badge-info-bg text-badge-info-text',
  neutral: 'bg-neutral-50 text-neutral-700',
}

/** 배지는 `radius-full` 에 px-3 py-1 입니다 (docs/design-system.md §4 · §8). */
const BASE_CLASS = 'inline-flex items-center rounded-full px-3 py-1 text-body-sm font-medium'

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
