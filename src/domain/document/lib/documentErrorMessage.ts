import type { ErrorMessageOverrides } from '@/shared/api/errorMessage'

import { ALLOWED_DOCUMENT_EXTENSIONS, MAX_DOCUMENT_FILE_BYTES } from './validateDocumentFile'

const LIMIT_MB = Math.round(MAX_DOCUMENT_FILE_BYTES / (1024 * 1024))

/**
 * 문서 업로드에서만 쓰는 에러 문구입니다. `toUserMessage(code, DOCUMENT_UPLOAD_MESSAGES)` 로 넘깁니다.
 *
 * 형식 · 크기 코드는 답변 녹화 업로드도 같이 써서, 공통 매핑(shared/api/errorMessage.ts)에는
 * 허용 형식 · 상한을 적지 않았습니다. 문서를 올리다 난 거라면 무엇을 올릴 수 있는지까지 알려줘야
 * 사용자가 파일을 바꿀 수 있습니다. 값은 화면의 사전 검증(`validateDocumentFile`)과 같은 곳에서 옵니다.
 */
export const DOCUMENT_UPLOAD_MESSAGES: ErrorMessageOverrides = {
  UNSUPPORTED_FILE_FORMAT: `${ALLOWED_DOCUMENT_EXTENSIONS.join(' · ')} 파일만 올릴 수 있어요.`,
  FILE_SIZE_EXCEEDED: `파일이 너무 커요. ${LIMIT_MB}MB 이하로 올려주세요.`,
}
