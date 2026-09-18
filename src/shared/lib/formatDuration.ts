/**
 * 초 단위 값을 'mm:ss' 로 표시합니다.
 *
 * 면접 진행(REC 인디케이터 · 진행 메타)과 리포트(답변 영상 재생 바)에서 같이 씁니다.
 * 두 도메인이 쓰게 돼서 shared/lib 로 올렸습니다. (docs/01-conventions.md "폴더")
 */
export function formatDuration(totalSeconds: number) {
  const total = Math.max(0, Math.floor(totalSeconds))
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${mm}:${ss}`
}
