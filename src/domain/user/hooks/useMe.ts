import { useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getMe } from '../api/userApi'
import type { Me } from '../types/user'

export type UseMeResult =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; me: Me }

/**
 * 로그인한 사용자를 한 번 불러옵니다.
 *
 * 다른 도메인 화면(보관함 상단 바 등)은 `api/` 가 아니라 이 훅으로 사용자 정보를 받습니다
 * (docs/01-conventions.md — 도메인 간 참조는 hooks 레벨에서만).
 */
export function useMe(): UseMeResult {
  const [state, setState] = useState<UseMeResult>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    getMe()
      .then((me) => {
        if (!cancelled) setState({ status: 'ready', me })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('사용자 정보 조회 실패 code=%s', apiError.code)
        setState({ status: 'error', error: apiError })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
