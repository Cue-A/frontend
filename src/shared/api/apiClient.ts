import { ApiError } from './ApiError'
import { findMock, USE_MOCK } from './mock'
import type { HttpMethod, Result } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * 인증을 붙이는 유일한 자리입니다.
 *
 * 쿠키 방식인지 헤더 토큰 방식인지 아직 안 정해져서(Q5) 지금은 아무것도
 * 붙이지 않습니다. 어느 쪽으로 정해지든 이 함수 하나만 고치면 되도록
 * 호출부는 전부 이 클라이언트를 거치게 두었습니다.
 */
function withAuth(init: RequestInit): RequestInit {
  return init
}

async function parseResult<T>(response: Response): Promise<Result<T>> {
  try {
    return (await response.json()) as Result<T>
  } catch {
    // 500 에서 HTML 이 오는 경우처럼 JSON 이 아닐 때
    throw new ApiError(`HTTP_${response.status}`, `응답을 해석할 수 없습니다 (${response.status})`)
  }
}

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  if (USE_MOCK) {
    const mock = findMock(method, path)
    if (!mock) {
      throw new ApiError('MOCK_NOT_FOUND', `등록된 목업 응답이 없습니다: ${method} ${path}`)
    }
    return mock() as T
  }

  const response = await fetch(
    `${BASE_URL}${path}`,
    withAuth({
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )

  const result = await parseResult<T>(response)

  if (!result.success) {
    throw new ApiError(result.errorCode, result.message)
  }

  return result.data
}

/**
 * 화면과 훅은 이 객체만 씁니다. Result 껍데기는 여기서 이미 벗겨집니다.
 *
 *   const session = await api.post<Session>('/api/interviews', body)
 */
export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
