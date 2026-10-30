import type { BusinessCardColor } from '../types/user'

/** 시안의 명함 색상 5종입니다. Tailwind 기본 팔레트를 그대로 씁니다 (디자인 토큰 밖 — 명함 전용 장식색). */
export const BUSINESS_CARD_COLORS: { value: BusinessCardColor; bgClass: string; label: string }[] = [
  { value: 'purple', bgClass: 'bg-purple-500', label: '보라' },
  { value: 'blue', bgClass: 'bg-blue-500', label: '파랑' },
  { value: 'green', bgClass: 'bg-green-500', label: '초록' },
  { value: 'orange', bgClass: 'bg-orange-500', label: '주황' },
  { value: 'black', bgClass: 'bg-neutral-900', label: '검정' },
]

export function bgClassOf(color: BusinessCardColor): string {
  return BUSINESS_CARD_COLORS.find((item) => item.value === color)?.bgClass ?? 'bg-neutral-900'
}
