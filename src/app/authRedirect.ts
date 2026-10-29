/**
 * 보호 라우트에서 튕겨 로그인 화면으로 갈 때, 로그인 뒤 돌아올 경로를 담아두는
 * 자리입니다. `sessionStorage` 를 쓰는 이유는 카카오 로그인 때문입니다 — 카카오
 * 인가 페이지로 나갔다 돌아오는 건 SPA 안의 이동이 아니라 실제 페이지 이동이라,
 * `react-router` 의 `location.state` 는 그 사이에 사라집니다. `sessionStorage` 는
 * 같은 탭에서 다른 origin 을 거쳐 돌아와도 남아 있습니다.
 *
 * `RequireAuth` 가 쓰고, `useLoginRedirect` 가 읽고 지웁니다.
 */
export const LOGIN_REDIRECT_KEY = 'cue-a:redirectAfterLogin'
