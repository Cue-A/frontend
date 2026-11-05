import type { BusinessCardColor } from '../types/user'

/**
 * 시안의 명함 색상 5종입니다. 앞면 바탕(`bgClass`)과 뒷면 기업명 글자색(`textClass`)에 씁니다.
 *
 * 보라는 브랜드 색(primary-500)이고, 나머지는 디자인 토큰 밖이라 Tailwind 기본 팔레트를 그대로 씁니다 — 명함에만 쓰는 장식색입니다.
 */
export const BUSINESS_CARD_COLORS: { value: BusinessCardColor; bgClass: string; textClass: string; label: string }[] = [
  { value: 'purple', bgClass: 'bg-primary-500', textClass: 'text-primary-500', label: '보라' },
  { value: 'blue', bgClass: 'bg-blue-600', textClass: 'text-blue-600', label: '파랑' },
  { value: 'green', bgClass: 'bg-green-600', textClass: 'text-green-600', label: '초록' },
  { value: 'orange', bgClass: 'bg-orange-500', textClass: 'text-orange-500', label: '주황' },
  { value: 'black', bgClass: 'bg-neutral-900', textClass: 'text-neutral-900', label: '검정' },
]

export function colorOf(color: BusinessCardColor) {
  return BUSINESS_CARD_COLORS.find((item) => item.value === color) ?? BUSINESS_CARD_COLORS[0]
}
