import { ApiError } from './apiError'
import { assertBaseUrl, REST_BASE_URL } from './baseUrl'
import { findMock, isRealApi, USING_PARTIAL_REAL } from './mock'
import { clearTokens, getAccessToken, getRefreshToken, storeTokens } from './tokenStorage'
import type { HttpMethod, Result } from './types'

/**
 * 토큰을 붙이는 유일한 자리입니다.
 * 백엔드는 쿠키가 아니라 `Authorization: Bearer` 헤더를 읽습니다 (Q5 결정).
 * 토큰이 깨지면 401 이 옵니다 — 코드별 분기는 아래 request() 를 보세요.
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

/**
 * 재발급 · 토큰 갱신을 거치지 않는 순수 요청입니다. `request()` 가 이 위에 401
 * 처리를 얹습니다 — 재발급 요청 자체는 이 함수를 직접 불러서 아래 인터셉터를
 * 다시 타지 않게 합니다 (그러지 않으면 재발급 실패가 또 재발급을 부릅니다).
 */
async function requestRaw<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
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
 * 재발급이 아닌 이유로 로그인 화면으로 보내야 하는 401 들입니다.
 * `TOKEN_EXPIRED` 는 따로 처리합니다 — 재발급을 시도할 수 있는 유일한 코드입니다.
 * (Cue-A/backend docs/03-auth.md "프론트가 401 을 나누는 법")
 */
const AUTH_FAILURE_CODES = new Set(['INVALID_TOKEN', 'INVALID_REFRESH_TOKEN', 'REFRESH_TOKEN_REUSED', 'UNAUTHORIZED'])

/**
 * 진행 중인 재발급 요청입니다. 병렬 요청 여러 개가 동시에 TOKEN_EXPIRED 를 받아도
 * 재발급은 한 번만 나가야 합니다 — 각자 재발급하면 늦게 도착한 쪽이 이미 회전된
 * refresh token 을 들고 와 재사용으로 판정되어 전 기기가 끊깁니다.
 * (Cue-A/backend docs/03-auth.md "회전과 재사용 탐지")
 */
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null

function refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const currentRefreshToken = getRefreshToken()
    if (!currentRefreshToken) {
      throw new ApiError('INVALID_REFRESH_TOKEN', '재발급 토큰이 없습니다')
    }

    // requestRaw 를 직접 부릅니다 — request() 를 거치면 이 요청이 401 일 때
    // 또 재발급을 시도하게 됩니다.
    const response = await requestRaw<{ accessToken: string; refreshToken: string }>('POST', '/api/auth/refresh', {
      refreshToken: currentRefreshToken,
    })
    storeTokens(response.accessToken, response.refreshToken)
    return response
  })()

  // 끝나면(성공하든 실패하든) 다음 401 이 새 재발급을 시작할 수 있게 비웁니다.
  return refreshPromise.finally(() => {
    refreshPromise = null
  })
}

/**
 * 토큰을 지우고 로그인 화면으로 보냅니다.
 *
 * `shared/` 는 `domain/` 을 모르고 `app/` 의 라우터도 몰라야 해서(도메인 간 참조
 * 규칙), 여기서만 예외적으로 경로를 문자열로 직접 씁니다. 전체 새로고침이라 남아
 * 있을 수 있는 화면 상태(진행 중인 폴링, 열린 소켓)도 같이 정리됩니다.
 *
 * `reason` 은 쿼리로 실어 보냅니다. 전체 새로고침이라 지금 메모리에 있는 에러
 * 상태가 다 같이 사라지는데, `REFRESH_TOKEN_REUSED` 처럼 로그인 화면이 따로
 * 안내해야 하는 코드가 있어 로그인 화면이 다시 읽을 수 있게 남겨둡니다.
 * (PR #60 리뷰)
 */
function forceLogout(reason: string) {
  clearTokens()

  // 이미 로그인 화면이면 보낼 필요가 없습니다. 지금은 로그인 화면이 보호된
  // API 를 안 불러서 당장 걸리지 않지만, 나중에 생기면 새로고침이 반복되는
  // 걸 막아둡니다. (PR #60 리뷰)
  if (window.location.pathname === '/login') return

  window.location.href = `/login?reason=${encodeURIComponent(reason)}`
}

async function request<T>(method: HttpMethod, path: string, body?: unknown, isRetry = false): Promise<T> {
  // 이 요청을 보낼 때 실제로 붙인 토큰입니다. 재발급 트리거 여부를 판단할 때
  // "지금" 이 아니라 "이 요청이 실패한 그 토큰" 을 기준으로 삼아야 합니다.
  const tokenAtRequestTime = getAccessToken()

  try {
    return await requestRaw<T>(method, path, body)
  } catch (cause) {
    if (!(cause instanceof ApiError)) throw cause

    // 새로고침 직후: access 는 메모리라 사라졌고 refresh 만 localStorage 에 남아
    // 있습니다. 토큰 없이 나간 요청에 백엔드가 UNAUTHORIZED 를 주는데(JwtAuthFilter
    // 는 토큰이 없으면 통과시키고 @CurrentUser 가 UNAUTHORIZED 를 냅니다), 이건
    // "로그인 안 함" 이 아니라 "access 복구 전" 입니다. TOKEN_EXPIRED 와 같은 길로
    // 보내 재발급을 시도합니다 — 아니면 새로고침할 때마다 로그아웃됩니다.
    // (PR #60 리뷰)
    const recoverableAfterReload =
      cause.code === 'UNAUTHORIZED' && tokenAtRequestTime === null && getRefreshToken() !== null

    if (cause.code === 'TOKEN_EXPIRED' || recoverableAfterReload) {
      if (isRetry) {
        // 재발급한 토큰으로 보낸 요청이 또 TOKEN_EXPIRED 면 다시 재발급하지
        // 않습니다. 상한 없이 돌면 토큰이 실제로 망가진 상황(서명 키 교체,
        // refresh 폐기)에서 재발급 요청이 폭주합니다. (이슈 #53 3번)
        forceLogout(cause.code)
        throw cause
      }

      // 이 요청이 응답을 기다리는 동안, 같은 시점에 401 을 받은 다른 요청이
      // 이미 재발급을 끝냈을 수 있습니다(요청마다 서버 왕복 시간이 달라서,
      // refreshPromise 가 아직 떠 있는 좁은 창을 놓치고 늦게 도착하는 경우가
      // 실제로 생깁니다). 그새 토큰이 바뀌었다면 그 재발급 결과이므로, 또
      // 재발급하지 않고 새 토큰으로 바로 재시도합니다. 여기서 또 재발급하면
      // 이미 회전된 refresh token 을 다시 써서 재사용으로 판정됩니다.
      if (getAccessToken() !== tokenAtRequestTime) {
        return request<T>(method, path, body, true)
      }

      try {
        await refreshTokens()
      } catch (refreshCause) {
        // 재발급이 실패한 진짜 이유(INVALID_REFRESH_TOKEN 등)를 그대로 올려서
        // 화면 문구가 원인에 맞게 뜨게 합니다.
        const reason = refreshCause instanceof ApiError ? refreshCause.code : cause.code
        forceLogout(reason)
        throw refreshCause instanceof ApiError ? refreshCause : cause
      }

      return request<T>(method, path, body, true)
    }

    if (AUTH_FAILURE_CODES.has(cause.code)) {
      forceLogout(cause.code)
    }

    throw cause
  }
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
