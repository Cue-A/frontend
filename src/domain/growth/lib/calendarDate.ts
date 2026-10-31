/**
 * 면접 캘린더의 날짜 계산입니다. 날짜는 모두 **보는 사람의 시간대** 기준 문자열(`YYYY-MM-DD` · `YYYY-MM`)로 다룹니다.
 *
 * `Date` 를 그대로 들고 다니면 자정 근처에서 UTC 로 바뀌며 하루가 밀립니다(`toISOString` 은 UTC 입니다).
 * 그래서 화면에는 문자열만 넘기고, 계산할 때만 그 자리에서 `Date` 로 만듭니다.
 */

const pad = (value: number) => String(value).padStart(2, '0')

/** 요일 이름. 일요일부터입니다 (시안 weekday-header) */
export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

function parseMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return { year, monthIndex: monthNumber - 1 }
}

/** `2026-08` 에서 `delta` 달 앞뒤 */
export function shiftMonth(month: string, delta: number): string {
  const { year, monthIndex } = parseMonth(month)
  return toMonthKey(new Date(year, monthIndex + delta, 1))
}

/** `2026-08` → `2026년 8월` */
export function monthLabel(month: string): string {
  const { year, monthIndex } = parseMonth(month)
  return `${year}년 ${monthIndex + 1}월`
}

/** `2026-08-14` 가 속한 달 `2026-08` */
export function monthOf(dateKey: string): string {
  return dateKey.slice(0, 7)
}

/**
 * 그 달을 주 단위로 나눕니다. 한 주는 일요일부터 7칸이고, 그 달이 아닌 칸은 null 입니다.
 * 달마다 주 수가 4 ~ 6 으로 달라서 캘린더 높이도 따라 달라집니다.
 */
export function weeksOf(month: string): (string | null)[][] {
  const { year, monthIndex } = parseMonth(month)
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const days = new Date(year, monthIndex + 1, 0).getDate()

  const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= days; day++) cells.push(`${month}-${pad(day)}`)
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (string | null)[][] = []
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7))
  return weeks
}

/** `2026-08-14` → 14 */
export function dayOf(dateKey: string): number {
  return Number(dateKey.slice(8, 10))
}

/** `2026-08-14` → `8월 14일 금요일`. 화면 읽기 프로그램이 날짜 칸을 읽을 때 씁니다 */
export function spokenDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()]
  return `${month}월 ${day}일 ${weekday}요일`
}

/** `2026-08-14` → `8.14 (금)` */
export function shortDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()]
  return `${month}.${day} (${weekday})`
}
