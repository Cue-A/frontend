import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import { clearTokens, getRefreshToken } from '@/shared/api/tokenStorage'

import { logout } from '../api/authApi'

/**
 * 로그아웃(AUTH-5)입니다. 서버 호출이 실패해도 로컬 세션은 항상 지우고 로그인
 * 화면으로 보냅니다 — 사용자 입장에서 "로그아웃"은 이 브라우저에서 나가는
 * 일이라, 네트워크가 없어도 되는 게 맞습니다. 최악의 경우 서버의 refresh token
 * 은 14일 뒤 자연 만료로 정리됩니다.
 */
export function useLogout() {
  const navigate = useNavigate()

  return useCallback(async () => {
    const refreshToken = getRefreshToken()

    if (refreshToken) {
      try {
        await logout(refreshToken)
      } catch (cause) {
        // 조용히 삼키지 않습니다. 로컬 로그아웃은 그대로 진행합니다.
        console.error('로그아웃 요청이 실패했습니다. 로컬 세션은 정리합니다', cause)
      }
    }

    clearTokens()
    navigate(ROUTES.LOGIN)
  }, [navigate])
}
