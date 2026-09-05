/**
 * 액세스 토큰을 보관하는 유일한 자리입니다.
 *
 * 지금은 메모리에만 둡니다. 새로고침하면 사라집니다.
 * 백엔드에 refresh token 이 아직 없어서(Cue-A/backend#3) 만료되면 재로그인밖에
 * 없고, 어디에 얼마나 보관할지도 그 결정에 달려 있습니다.
 * 보관 위치가 정해지면 이 파일만 고치면 됩니다.
 */
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}
