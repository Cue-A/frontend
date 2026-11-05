/**
 * `2026-09-20T14:02:11+09:00` → `2026.09.20` (보는 사람의 시간대 기준). 읽을 수 없는 값이면 `-` 입니다.
 *
 * 보관함 문서 목록과 연습 기록 목록이 같이 씁니다.
 */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${month}.${day}`
}
