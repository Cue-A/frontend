import { useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { getProfile } from '../api/userApi'
import type { Profile } from '../types/user'

export type UseProfileResult =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; profile: Profile }

/** 내 프로필을 한 번 불러옵니다. `GET /api/users/me/profile` (Cue-A/backend#128) */
export function useProfile(): UseProfileResult {
  const [state, setState] = useState<UseProfileResult>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    getProfile()
      .then((profile) => {
        if (!cancelled) setState({ status: 'ready', profile })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        console.error('프로필 조회 실패 code=%s', code)
        setState({ status: 'error', error: toUserMessage(code) })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
