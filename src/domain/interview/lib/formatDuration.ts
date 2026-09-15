/** 초 단위 값을 'mm:ss' 로 표시합니다. (REC 인디케이터, 진행 메타 공용) */
export function formatDuration(totalSeconds: number) {
  const total = Math.max(0, Math.floor(totalSeconds))
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${mm}:${ss}`
}
