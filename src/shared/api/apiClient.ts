import { getAccessToken } from './accessToken'
import { ApiError } from './apiError'
import { assertBaseUrl, REST_BASE_URL } from './baseUrl'
import { findMock, isRealApi, USING_PARTIAL_REAL } from './mock'
import type { HttpMethod, Result } from './types'

/**
 * 토큰을 붙이는 유일한 자리입니다.
 * 백엔드는 쿠키가 아니라 `Authorization: Bearer` 헤더를 읽습니다 (Q5 결정).
 * 토큰이 깨지면 INVALID_TOKEN 으로 401 이 옵니다.
 */
function buildHeaders(body: unknown): HeadersInit {
  const headers: Record<string, string> = {}

  // FormData 에는 Content-Type 을 달지 않습니다. 브라우저가
  // `multipart/form-data; boundary=...` 를 직접 만들어 붙이는데, 우리가 먼저 달면
  // boundary 가 빠져서 서버가 본문을 한 조각도 못 읽습니다.
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

function toRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined
  if (body instanceof FormData) return body
  return JSON.stringify(body)
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
  // 도메인별로 갈립니다. VITE_REAL_APIS 에 든 것만 실제 서버로 가고
  // 나머지는 목업으로 갑니다. (mock.ts 의 isRealApi 주석 참고)
  if (!isRealApi(path)) {
    const mock = findMock(method, path)
    if (!mock) {
      throw new ApiError('MOCK_NOT_FOUND', `등록된 목업 응답이 없습니다: ${method} ${path}`)
    }
    return mock(body) as T
  }

  // 주소가 비어 있으면 요청이 개발 서버로 나가서 index.html 을 받아옵니다.
  // 그러면 JSON 파싱이 깨지면서 HTTP_200 같은 엉뚱한 에러가 납니다.
  assertBaseUrl(USING_PARTIAL_REAL, path)

  const response = await fetch(`${REST_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(body),
    body: toRequestBody(body),
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
  /**
   * `multipart/form-data` 로 보냅니다. 파일을 올릴 때만 씁니다 (문서 등록).
   * 목업 핸들러에는 이 `FormData` 가 본문으로 그대로 갑니다.
   */
  postForm: <T>(path: string, form: FormData) => request<T>('POST', path, form),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
