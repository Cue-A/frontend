import { useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getAccount } from '../api/userApi'
import type { AccountInfo } from '../types/user'

export type UseAccountResult = { status: 'loading' } | { status: 'error' } | { status: 'ready'; account: AccountInfo }

/** 계정 정보(이메일 · 가입일 · 로그인 수단)를 한 번 불러옵니다. `GET /api/users/me/account` (Cue-A/backend#126) */
export function useAccount(): UseAccountResult {
  const [state, setState] = useState<UseAccountResult>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    getAccount()
      .then((account) => {
        if (!cancelled) setState({ status: 'ready', account })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        console.error('계정 정보 조회 실패 code=%s', cause instanceof ApiError ? cause.code : 'UNKNOWN')
        setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
