/**
 * 문서 파일 검증입니다. (기능명세서 DOC-1 · DOC-5)
 *
 * 올리는 화면(C-02)이 씁니다. 원래 A-05 에 있었는데, A-05 는 보관함에서 **고르는** 화면이라
 * 파일을 받지 않습니다. 그래서 문서 도메인으로 옮겼습니다. (이슈 #54 1-0)
 *
 * `<input accept>` 는 **파일 선택창의 기본 필터일 뿐**입니다. 사용자가 선택창에서
 * "모든 파일" 로 바꾸거나 드래그해서 넣으면 그대로 통과합니다. DOC-5 가 요구하는
 * "미지원 포맷 차단" 은 고른 뒤에 한 번 더 확인해야 실제로 막힙니다.
 *
 * 값은 백엔드 `FileValidator` (문서 업로드: pdf · docx · txt, 10MB) 와 대조를 마쳤습니다.
 * `.hwp` · `.doc` 은 백엔드도 받지 않습니다 — 파싱 품질이 들쭉날쭉해서 뺐다고 적혀 있습니다.
 */

/** DOC-1 이 허용하는 포맷입니다. 백엔드 `FileValidator.DOCUMENT_TYPES` 와 같은 목록 · 같은 순서입니다. */
export const ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'docx', 'txt'] as const

/** 파일 선택창의 기본 필터. 위 목록과 같은 값을 씁니다. */
export const DOCUMENT_FILE_ACCEPT = ALLOWED_DOCUMENT_EXTENSIONS.map((ext) => `.${ext}`).join(',')

/** 크기 상한입니다. 백엔드 `FileValidator.DOCUMENT_MAX_BYTES` 와 같습니다. */
export const MAX_DOCUMENT_FILE_BYTES = 10 * 1024 * 1024

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
export function validateDocumentFile(file: File): string | null {
  const extension = extensionOf(file.name)

  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(extension as (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number])) {
    const allowed = ALLOWED_DOCUMENT_EXTENSIONS.join(' · ')
    return `${allowed} 파일만 올릴 수 있어요. ${extension ? `.${extension}` : '확장자가 없는 파일'} 은 지원하지 않아요.`
  }

  if (file.size > MAX_DOCUMENT_FILE_BYTES) {
    const limitMb = Math.round(MAX_DOCUMENT_FILE_BYTES / (1024 * 1024))
    return `파일이 너무 커요. ${limitMb}MB 이하로 올려주세요.`
  }

  if (file.size === 0) {
    return '빈 파일이에요. 내용이 있는 자기소개서를 올려주세요.'
  }

  return null
}
