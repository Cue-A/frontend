import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getRefreshToken } from '@/shared/api/tokenStorage'

import { LOGIN_REDIRECT_KEY } from './authRedirect'
import { ROUTES } from './routes'

/**
 * 보호 라우트 가드입니다 (AUTH-4). 로그인 · 랜딩 · 카카오 콜백을 뺀 나머지
 * 라우트를 이 컴포넌트 아래로 묶습니다 (router.tsx).
 *
 * refresh token 유무로만 판단합니다. access token(메모리)은 새로고침하면
 * 사라지는 게 정상이라 여기서 보면 로그인한 사람도 매번 튕깁니다. refresh
 * token 이 있으면 일단 들여보내고, 실제로 만료·위조됐는지는 화면이 처음 부르는
 * 보호 API 에서 apiClient 의 401 처리(재발급 실패 시 로그인 화면으로)가 걸러냅니다.
 * 그래서 여기서 API 를 미리 부르지 않습니다.
 *
 * 튕기기 전에 원래 가려던 경로를 `sessionStorage` 에 남깁니다 — 카카오 로그인은
 * 외부 페이지를 거쳐 오는 실제 페이지 이동이라 `location.state` 가 못 버팁니다
 * (authRedirect.ts 참고). 로그인 성공 뒤 `useLoginRedirect` 가 읽습니다.
 */
export default function RequireAuth() {
  const location = useLocation()

  if (!getRefreshToken()) {
    sessionStorage.setItem(LOGIN_REDIRECT_KEY, location.pathname + location.search)
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <Outlet />
}
