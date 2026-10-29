/**
 * 홈에서 쓰는 날짜 계산 · 표시입니다.
 *
 * 서버와 주고받는 날짜는 `YYYY-MM-DD` 문자열이고, **사용자 기기의 날짜 기준**으로 셉니다.
 * `new Date('2026-10-01')` 는 UTC 자정으로 읽혀서 한국 시간에서는 맞지만 시간대가 다른 곳에서 하루가
 * 밀립니다. 그래서 문자열을 직접 쪼개서 그 지역의 자정으로 만듭니다.
 */

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const MS_PER_DAY = 24 * 60 * 60 * 1000

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/**
 * 두 날짜 사이가 며칠인지(달력 기준). `to` 가 뒤면 양수입니다.
 * 시각을 빼고 연 · 월 · 일만 UTC 로 옮겨서 셉니다 — 서머타임이 있는 곳에서 23시간짜리 하루가 끼어도
 * 하루가 모자라지 않게 하려는 것입니다.
 */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b - a) / MS_PER_DAY)
}

/** `2026.08.28` */
export function formatDotDate(iso: string): string {
  return iso.replaceAll('-', '.')
}

/** `2026.08.28 (금)` */
export function formatDotDateWithWeekday(iso: string): string {
  return `${formatDotDate(iso)} (${WEEKDAYS[parseIsoDate(iso).getDay()]})`
}

/** `9월 28일 (월)` */
export function formatMonthDay(iso: string): string {
  const date = parseIsoDate(iso)
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`
}

/**
 * 기간 표시. 시안은 `06.18 – 08.26` 처럼 연도를 뺍니다.
 * 1년 탭은 연도가 바뀌어서 연도를 빼면 어느 해 6월인지 모르므로, 연도가 다르면 붙입니다.
 */
export function formatDateRange(startIso: string, endIso: string): string {
  const sameYear = startIso.slice(0, 4) === endIso.slice(0, 4)
  const format = (iso: string) => (sameYear ? formatDotDate(iso).slice(5) : formatDotDate(iso))
  return `${format(startIso)} – ${format(endIso)}`
}
