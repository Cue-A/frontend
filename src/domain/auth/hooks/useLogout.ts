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
 *
 * 로컬 정리 · 이동을 먼저 하고, 서버 호출은 기다리지 않습니다. 서버 응답을
 * 기다리면 서버가 느릴 때 버튼을 눌러도 한동안 반응이 없고, 그 사이 다시
 * 누르면 같은 refresh token 으로 로그아웃 요청이 두 번 나갑니다. 먼저
 * 지우면 두 번째 클릭 때는 refresh token 이 이미 없어서 요청 자체가 안
 * 나갑니다. (PR #69 리뷰)
 */
export function useLogout() {
  const navigate = useNavigate()

  return useCallback(() => {
    const refreshToken = getRefreshToken()
    clearTokens()
    navigate(ROUTES.LOGIN)

    if (refreshToken) {
      logout(refreshToken).catch((cause: unknown) => {
        // 조용히 삼키지 않습니다. 로컬 로그아웃은 이미 끝났습니다.
        console.error('로그아웃 요청이 실패했습니다. 로컬 세션은 정리했습니다', cause)
      })
    }
  }, [navigate])
}
