import { getAccessToken } from './accessToken'
import { ApiError } from './apiError'
import { findMock, USE_MOCK } from './mock'
import type { HttpMethod, Result } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * 토큰을 붙이는 유일한 자리입니다.
 * 백엔드는 쿠키가 아니라 `Authorization: Bearer` 헤더를 읽습니다 (Q5 결정).
 * 토큰이 깨지면 INVALID_TOKEN 으로 401 이 옵니다.
 */
function buildHeaders(hasBody: boolean): HeadersInit {
  const headers: Record<string, string> = {}

  if (hasBody) {
    headers['Content-Type'] = 'application/json'
  }

  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
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

  const hasBody = body !== undefined

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: buildHeaders(hasBody),
    body: hasBody ? JSON.stringify(body) : undefined,
  })

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
