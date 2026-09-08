/**
 * 백엔드의 모든 응답을 감싸는 껍데기입니다.
 * 벗기는 건 apiClient 안에서 한 번만 합니다. 화면은 T 만 봅니다.
 */
export type Result<T> =
  | { success: true; data: T; errorCode: null; message: null }
  | { success: false; data: null; errorCode: string; message: string }

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'
