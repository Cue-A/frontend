const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize'

/**
 * 카카오 인가 코드 요청 URL 을 만듭니다. (AUTH-2)
 *
 * 인가 코드 방식입니다 — 프론트는 카카오 access token 을 직접 받지 않고,
 * 이 URL 로 사용자를 보낸 뒤 돌아올 때 실린 `code` 만 받아 백엔드로 넘깁니다.
 * 백엔드가 그 code 를 카카오 토큰으로 교환합니다.
 *
 * `client_id`(REST API Key)가 URL 에 그대로 실려 사용자에게도 보이지만
 * 문제 없습니다. 숨겨야 하는 건 Client Secret 이고 그건 백엔드에만 있습니다.
 * 보안은 카카오에 등록한 Redirect URI 화이트리스트가 맡습니다. (이슈 #53)
 *
 * 두 env 값이 비어 있으면 `client_id=undefined&redirect_uri=undefined` 로
 * 조용히 잘못된 링크가 만들어집니다. 카카오가 그때 띄우는 설정 오류는 앱
 * 등록 전에 나는 정상 오류와 구분이 안 가서, 콘솔에라도 원인을 남깁니다.
 * (PR #56 리뷰)
 */
export function buildKakaoAuthorizeUrl(): string {
  const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY
  const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI

  if (!clientId || !redirectUri) {
    console.error(
      'VITE_KAKAO_REST_API_KEY 또는 VITE_KAKAO_REDIRECT_URI 가 비어 있습니다. .env.local 을 확인해 주세요.',
    )
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
  })

  return `${KAKAO_AUTHORIZE_URL}?${params.toString()}`
}
