import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { getCompanyInterests, removeCompanyInterest } from '../api/userApi'
import type { CompanyInterest } from '../types/user'

type State = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; interests: CompanyInterest[] }

export type UseCompanyInterestsResult =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | {
      status: 'ready'
      interests: CompanyInterest[]
      /** 목록에서 뺍니다. 실패하면 되돌립니다. */
      remove: (companyId: string) => void
    }

/** B-03 마이페이지/관심기업. 기업 탐색(CMP-2)이 아직 없어 추가는 다루지 않고 해제만 둡니다. */
export function useCompanyInterests(): UseCompanyInterestsResult {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    getCompanyInterests()
      .then((interests) => {
        if (!cancelled) setState({ status: 'ready', interests })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        console.error('관심 기업 조회 실패 code=%s', code)
        setState({ status: 'error', error: toUserMessage(code) })
      })

    return () => {
      cancelled = true
    }
  }, [])

  const remove = useCallback(
    (companyId: string) => {
      if (state.status !== 'ready') return
      const previous = state.interests

      setState({ status: 'ready', interests: previous.filter((item) => item.companyId !== companyId) })

      removeCompanyInterest(companyId).catch((cause: unknown) => {
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        console.error('관심 기업 해제 실패 code=%s', code)
        setState({ status: 'ready', interests: previous })
      })
    },
    [state],
  )

  if (state.status !== 'ready') return state
  return { ...state, remove }
}
