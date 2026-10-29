import type { ReactNode } from 'react'

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

/** 토큰의 badge 전용 색 세트를 그대로 씁니다 (--color-badge-*-bg / -text). */
const TONE_BG_CLASS: Record<Tone, string> = {
  brand: 'bg-badge-brand-bg',
  success: 'bg-badge-success-bg',
  warning: 'bg-badge-warning-bg',
  danger: 'bg-badge-danger-bg',
  info: 'bg-badge-info-bg',
  neutral: 'bg-neutral-50',
}

const TONE_TEXT_CLASS: Record<Tone, string> = {
  brand: 'text-badge-brand-text',
  success: 'text-badge-success-text',
  warning: 'text-badge-warning-text',
  danger: 'text-badge-danger-text',
  info: 'text-badge-info-text',
  neutral: 'text-neutral-700',
}

/** 배지는 `radius-full` 에 px-3 py-1 입니다 (docs/design-system.md §4 · §8). */
const BASE_CLASS = 'inline-flex items-center rounded-full px-3 py-1 text-body-sm font-medium'

type Props = {
  children: ReactNode
  tone?: Tone
  /**
   * 같은 톤 색이 깔린 영역(예: 장치테스트 환경 체크 행) 위에 놓일 때 true.
   * 배경을 흰색으로 바꿔 글자색만 톤을 따르게 합니다 — 배경끼리 묻히지 않도록
   * (Figma 1375:1501 badge).
   */
  onTint?: boolean
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
export default function Badge({ children, tone = 'neutral', onTint = false }: Props) {
  const bgClass = onTint ? 'bg-neutral-0' : TONE_BG_CLASS[tone]

  return <span className={`${BASE_CLASS} ${bgClass} ${TONE_TEXT_CLASS[tone]}`}>{children}</span>
}
