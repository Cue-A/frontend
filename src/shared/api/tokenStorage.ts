/**
 * 액세스 · 리프레시 토큰을 보관하는 유일한 자리입니다.
 *
 * | | 수명 | 보관 위치 |
 * |---|---|---|
 * | access | 30분 | 메모리. 새로고침하면 사라지고, 재발급으로 복구합니다 |
 * | refresh | 14일 | `localStorage` |
 *
 * refresh 를 `localStorage` 에 두는 건 XSS 에 약합니다. 정석은 httpOnly 쿠키인데,
 * 배포에서 프론트·백 도메인이 갈리면 `SameSite=None; Secure` 가 필요해 HTTPS 가
 * 붙기 전까지 로컬·배포 동작이 갈립니다. 나중에 쿠키로 바꿔도 응답 모양은 그대로라
 * 프론트 수정 범위는 이 파일 하나입니다. (Cue-A/backend docs/03-auth.md)
 */
let accessToken: string | null = null

const REFRESH_TOKEN_KEY = 'cue-a:refreshToken'

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

/** 로그인 · 회원가입 · 카카오 · 재발급 응답을 받으면 이 함수 하나로 둘 다 저장합니다. */
export function storeTokens(newAccessToken: string, newRefreshToken: string) {
  setAccessToken(newAccessToken)
  setRefreshToken(newRefreshToken)
}

/** 로그아웃하거나 재발급이 끝내 실패했을 때 씁니다. */
export function clearTokens() {
  setAccessToken(null)
  setRefreshToken(null)
}
