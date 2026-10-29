import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'
import { clearTokens } from '@/shared/api/tokenStorage'

import { withdraw } from '../api/userApi'
import type { WithdrawRequest } from '../types/user'

export type UseWithdrawResult = {
  /** 탈퇴를 요청합니다. 끝났으면 true, 실패했으면 false(`error` 에 문구) */
  submit: (request: WithdrawRequest) => Promise<boolean>
  withdrawing: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
}

/**
 * 회원 탈퇴입니다. 되돌릴 수 없어서 화면이 이유를 받고 한 번 더 물은 뒤 이 훅을 부릅니다 (WithdrawConfirmDialog).
 *
 * 끝나면 **이 브라우저의 토큰을 바로 지웁니다.** 서버에서는 계정이 없어졌는데 refresh token 이 남아 있으면,
 * 다음 화면 이동 때 보호 라우트를 통과했다가 첫 API 에서야 `USER_NOT_FOUND` 로 튕깁니다.
 *
 * 이미 없는 계정(`USER_NOT_FOUND` — 다른 탭에서 먼저 탈퇴한 경우 등)도 끝난 것으로 봅니다. 사용자가 원한
 * 결과와 같기 때문입니다.
 */
export function useWithdraw(): UseWithdrawResult {
  const [withdrawing, setWithdrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (request: WithdrawRequest) => {
    setWithdrawing(true)
    setError(null)

    try {
      await withdraw(request)
      clearTokens()
      return true
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      if (code === 'USER_NOT_FOUND') {
        clearTokens()
        return true
      }

      console.error('회원 탈퇴 실패 code=%s', code)
      setError(toUserMessage(code))
      return false
    } finally {
      setWithdrawing(false)
    }
  }, [])

  return { submit, withdrawing, error }
}
