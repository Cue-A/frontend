/** 파일 이름에 쓸 수 없는 글자 (Windows 기준이 가장 엄격합니다) */
const UNSAFE_FILE_CHARS = /[\\/:*?"<>|]/g

/**
 * 파일 이름 조각들을 `_` 로 잇습니다. 비어 있는 조각은 빼고, 쓸 수 없는 글자와 공백을 지웁니다.
 *
 * `['큐앤에이', '리포트', '네이버', '기획 직무']` → `큐앤에이_리포트_네이버_기획직무`
 */
export function toFileBaseName(parts: (string | null | undefined)[]): string {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .map((part) => part.replace(UNSAFE_FILE_CHARS, '').replace(/\s+/g, ''))
    .join('_')
}

/**
 * 파일로 내려받게 합니다.
 *
 * data URL 이 아니라 `blob:` 주소로 내려받습니다. 리포트 한 장이 몇 MB 라 data URL 은 너무 길고, 브라우저에 따라
 * `download` 에 준 파일 이름을 무시하고 `download` 로 저장합니다.
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // 바로 지우면 내려받기가 시작되기 전에 주소가 사라지는 브라우저가 있어서 조금 뒤에 지웁니다
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
