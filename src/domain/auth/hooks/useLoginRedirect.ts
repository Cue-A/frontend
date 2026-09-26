import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { LOGIN_REDIRECT_KEY } from '@/app/authRedirect'
import { ROUTES } from '@/app/routes'

/**
 * 로그인 · 회원가입 · 카카오 로그인 성공 뒤 어디로 보낼지 정합니다.
 *
 * 보호 라우트에서 튕겨 왔으면(`RequireAuth`) 그 경로로, 아니면(주소창 직접
 * 입력 등) 랜딩으로 보냅니다. 카카오까지 셋 다 이 훅 하나로 처리할 수 있는
 * 건 `sessionStorage` 를 쓰기 때문입니다 — `authRedirect.ts` 참고. (PR #69 리뷰)
 *
 * `useCallback` 으로 감쌉니다 — `useKakaoCallback` 처럼 반환값을 effect
 * 의존성에 넣는 자리가 있어서, 매 렌더 새 함수면 그 effect 가 불필요하게
 * 다시 돕니다.
 */
export function useLoginRedirect() {
  const navigate = useNavigate()

  return useCallback(() => {
    const from = sessionStorage.getItem(LOGIN_REDIRECT_KEY)
    sessionStorage.removeItem(LOGIN_REDIRECT_KEY)
    navigate(from || ROUTES.LANDING, { replace: true })
  }, [navigate])
}
