import type { PracticePeriod } from '../types/home'

/**
 * 기간 탭 하나에 붙는 이름과 일수입니다. 탭 순서도 이 배열 순서입니다.
 *
 * 기간은 달력 주 · 달이 아니라 **오늘에서 거꾸로 센 날 수**입니다. 시안의 10주가 `06.18 – 08.26`
 * (70일)이라 그렇게 맞췄습니다. 그래서 잔디 한 줄(7칸)이 월~일이 아닐 수 있습니다.
 */
export const PRACTICE_PERIODS: Array<{ value: PracticePeriod; label: string; days: number }> = [
  { value: '4w', label: '4주', days: 28 },
  { value: '10w', label: '10주', days: 70 },
  { value: '6m', label: '6개월', days: 182 },
  { value: '1y', label: '1년', days: 364 },
]

/** 시안이 처음 열어두는 탭 */
export const DEFAULT_PRACTICE_PERIOD: PracticePeriod = '10w'

export function practicePeriodOf(value: PracticePeriod) {
  // 위 배열에 모든 값이 있어서 못 찾는 일은 없습니다. 타입으로는 안 막혀서 기본값을 둡니다.
  return PRACTICE_PERIODS.find((period) => period.value === value) ?? PRACTICE_PERIODS[1]
}

export function isPracticePeriod(value: string | null): value is PracticePeriod {
  return PRACTICE_PERIODS.some((period) => period.value === value)
}
