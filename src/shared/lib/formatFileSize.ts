/**
 * 바이트를 `1.2MB` · `0.8MB` 처럼 MB 한 자리로 표시합니다 (보관함 시안 기준).
 * 0.1MB 보다 작으면 `0.0MB` 가 되어 빈 파일처럼 보이므로 그때만 KB 로 씁니다.
 *
 * 보관함(C-02)과 옵션 설정(A-05)이 같은 문서의 크기를 보여줘서 shared/lib 로 올렸습니다.
 * 두 곳이 기준을 따로 가지면 같은 문서가 화면마다 `812KB` · `0.8MB` 로 갈립니다. (PR #64 리뷰)
 */
export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  if (mb >= 0.1) return `${mb.toFixed(1)}MB`

  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}
