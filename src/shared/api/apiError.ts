/**
 * API 호출 실패를 나타냅니다.
 * 컴포넌트에서 try-catch 로 잡지 말고, 조회 훅이나 에러 바운더리가 처리합니다.
 */
export class ApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}
