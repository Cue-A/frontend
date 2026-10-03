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
import { claimDrafts, clearDrafts } from '../lib/draftStorage'

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

/**
 * access token(JWT) 의 `sub` — 백엔드가 사용자 id 를 넣습니다 (`JwtProvider`). 못 읽으면 null 입니다.
 *
 * 서명을 확인하지 않습니다. 권한 판단에 쓰는 값이 아니라, 이 탭에 남긴 임시 값이 **같은 사람 것인지** 만 봅니다.
 */
function subjectOf(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const claims: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof claims !== 'object' || claims === null) return null

    const subject = (claims as { sub?: unknown }).sub
    return typeof subject === 'string' ? subject : null
  } catch {
    return null
  }
}

/**
 * 로그인 · 회원가입 · 카카오 · 재발급 응답을 받으면 이 함수 하나로 둘 다 저장합니다.
 *
 * 이 탭에 남아 있는 임시 값(`shared/lib/draftStorage`)이 다른 사람 것이면 여기서 지웁니다. 강제 로그아웃 때는
 * 값을 남겨 두기 때문에, 그 뒤에 다른 계정이 들어오는 경우를 여기서 막습니다.
 */
export function storeTokens(newAccessToken: string, newRefreshToken: string) {
  setAccessToken(newAccessToken)
  setRefreshToken(newRefreshToken)
  claimDrafts(subjectOf(newAccessToken))
}

/**
 * 로그아웃하거나 재발급이 끝내 실패했을 때 씁니다.
 *
 * **사용자가 직접 로그아웃할 때는** 이 탭에 임시로 남겨 둔 값(옵션 설정 등 — `shared/lib/draftStorage`)도 같이 지웁니다.
 *
 * **재발급 실패로 강제 로그아웃될 때는 `keepDrafts` 로 남겨 둡니다** (`apiClient` 의 forceLogout). 탭을 오래 열어
 * 두다 네트워크 문제로 재발급이 실패하면 사용자가 나가기로 한 게 아닌데도 고르던 값이 사라졌습니다 — 다시
 * 로그인하면 이어서 쓸 수 있어야 합니다. 그 사이 다른 계정이 로그인하면 `storeTokens` 가 지웁니다. (PR #90 리뷰)
 */
export function clearTokens({ keepDrafts = false }: { keepDrafts?: boolean } = {}) {
  setAccessToken(null)
  setRefreshToken(null)
  if (!keepDrafts) clearDrafts()
}
