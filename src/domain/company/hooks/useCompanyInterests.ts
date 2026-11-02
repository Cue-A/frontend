import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { getCompanyInterests, removeCompanyInterest } from '../api/companyApi'
import type { CompanyInterest } from '../types/company'

type State = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; interests: CompanyInterest[] }

export type UseCompanyInterestsResult =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | {
      status: 'ready'
      interests: CompanyInterest[]
      /** 목록에서 바로 빼고 서버에 알립니다. 실패하면 그 기업만 제자리에 되돌리고 `actionError` 에 이유를 둡니다 */
      remove: (company: CompanyInterest) => void
      /** 마지막 해제가 실패한 이유. 사용자에게 그대로 보여줄 문구입니다 */
      actionError: string | null
    }

function codeOf(cause: unknown) {
  return cause instanceof ApiError ? cause.code : 'UNKNOWN'
}

/**
 * 내 관심 기업 목록입니다. (Cue-A/backend #101 · 이슈 #162)
 *
 * 마이페이지 > 관심 기업(user 도메인)도 이 훅을 씁니다. 도메인 간 참조는 hooks 에서만 합니다. (docs/01-conventions.md)
 *
 * 해제는 기다리지 않고 목록에서 먼저 뺍니다(낙관적 업데이트). 실패하면 **그 기업만** 원래 자리에 되돌립니다 — 누른 순간의
 * 목록 통째로 되돌리면, 연달아 둘을 뺐을 때 하나만 실패해도 다른 하나까지 살아납니다. (PR #112 리뷰)
 */
export function useCompanyInterests(): UseCompanyInterestsResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getCompanyInterests()
      .then((interests) => {
        if (!cancelled) setState({ status: 'ready', interests })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        console.error('관심 기업 조회 실패 code=%s', codeOf(cause))
        setState({ status: 'error', error: toUserMessage(codeOf(cause)) })
      })

    return () => {
      cancelled = true
    }
  }, [])

  const remove = useCallback((company: CompanyInterest) => {
    let index = -1
    setActionError(null)
    setState((previous) => {
      if (previous.status !== 'ready') return previous
      index = previous.interests.findIndex((item) => item.companyId === company.companyId)
      return { status: 'ready', interests: previous.interests.filter((item) => item.companyId !== company.companyId) }
    })

    removeCompanyInterest(company.companyId).catch((cause: unknown) => {
      console.error('관심 기업 해제 실패 code=%s', codeOf(cause))
      setActionError(`${company.name} 관심 해제에 실패했어요. ${toUserMessage(codeOf(cause))}`)
      setState((previous) => {
        if (previous.status !== 'ready' || previous.interests.some((item) => item.companyId === company.companyId)) {
          return previous
        }
        const next = [...previous.interests]
        next.splice(index < 0 ? next.length : Math.min(index, next.length), 0, company)
        return { status: 'ready', interests: next }
      })
    })
  }, [])

  if (state.status !== 'ready') return state
  return { ...state, remove, actionError }
}
