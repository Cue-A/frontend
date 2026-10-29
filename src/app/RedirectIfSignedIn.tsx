import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { getRefreshToken } from '@/shared/api/tokenStorage'

import { ROUTES } from './routes'

type Props = {
  children: ReactNode
}

/**
 * 로그인한 사람은 들어올 필요가 없는 화면(로그인)을 감쌉니다. 로그인했으면 홈으로 보냅니다.
 * 랜딩은 감싸지 않습니다 — 서비스 첫 화면이라 로그인했어도 처음 들어오면 보여줍니다.
 *
 * `RequireAuth` 와 같은 기준(refresh token 이 있는지)으로 봅니다. 기준이 다르면 한쪽은 로그인했다고 보고
 * 다른 쪽은 아니라고 봐서 로그인 ↔ 홈 사이를 오갈 수 있습니다. 세션이 강제로 끊겨 로그인 화면으로 올 때는
 * (`apiClient` 의 forceLogout) 토큰을 먼저 지우고 오므로 여기서 다시 홈으로 튕기지 않습니다.
 */
export default function RedirectIfSignedIn({ children }: Props) {
  if (getRefreshToken()) return <Navigate to={ROUTES.HOME} replace />
  return children
}
