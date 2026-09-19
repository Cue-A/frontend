/**
 * 자기소개서 파일 검증입니다. (기능명세서 DOC-1 · DOC-5)
 *
 * `<input accept>` 는 **파일 선택창의 기본 필터일 뿐**입니다. 사용자가 선택창에서
 * "모든 파일" 로 바꾸거나 드래그해서 넣으면 그대로 통과합니다. DOC-5 가 요구하는
 * "미지원 포맷 차단" 은 고른 뒤에 한 번 더 확인해야 실제로 막힙니다.
 */

/** DOC-1 이 허용하는 포맷입니다. */
export const ALLOWED_RESUME_EXTENSIONS = ['pdf', 'docx', 'txt'] as const

/** 파일 선택창의 기본 필터. 위 목록과 같은 값을 씁니다. */
export const RESUME_ACCEPT = ALLOWED_RESUME_EXTENSIONS.map((ext) => `.${ext}`).join(',')

/**
 * 크기 상한입니다.
 *
 * **임시 값입니다.** DOC-1 은 "크기 제한" 이라고만 적혀 있고 숫자가 없습니다.
 * 정해지면 이 값만 바꾸면 됩니다. (docs/90-open-questions.md Q10)
 */
export const MAX_RESUME_BYTES = 10 * 1024 * 1024

function extensionOf(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  if (dot < 0) return ''
  return fileName.slice(dot + 1).toLowerCase()
}

/**
 * 고른 파일이 쓸 수 있는지 봅니다.
 *
 * 쓸 수 있으면 `null`, 아니면 화면에 그대로 보여줄 문구를 돌려줍니다.
 * 왜 안 되는지 말해주지 않으면 사용자는 파일이 깨진 줄 압니다.
 */
export function validateResumeFile(file: File): string | null {
  const extension = extensionOf(file.name)

  if (!ALLOWED_RESUME_EXTENSIONS.includes(extension as (typeof ALLOWED_RESUME_EXTENSIONS)[number])) {
    const allowed = ALLOWED_RESUME_EXTENSIONS.join(' · ')
    return `${allowed} 파일만 올릴 수 있어요. ${extension ? `.${extension}` : '확장자가 없는 파일'} 은 지원하지 않아요.`
  }

  if (file.size > MAX_RESUME_BYTES) {
    const limitMb = Math.round(MAX_RESUME_BYTES / (1024 * 1024))
    return `파일이 너무 커요. ${limitMb}MB 이하로 올려주세요.`
  }

  if (file.size === 0) {
    return '빈 파일이에요. 내용이 있는 자기소개서를 올려주세요.'
  }

  return null
}
