import { useCallback, useEffect, useRef, useState } from 'react'

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
 *
 * 되돌릴 자리는 **처음 불러온 순서**로 찾습니다. 전에는 setState 업데이트 함수 안에서 뺀 자리(index)를 적어 두고 실패
 * 콜백에서 읽었는데, 업데이트 함수가 실패 콜백보다 먼저 돈다는 순서에 기대는 구조였습니다. (PR #166 리뷰)
 */
export function useCompanyInterests(): UseCompanyInterestsResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [actionError, setActionError] = useState<string | null>(null)
  /** 기업 id → 처음 불러온 목록에서의 자리. 해제에 실패한 기업을 되돌릴 자리를 여기서 찾습니다 */
  const order = useRef(new Map<string, number>())

  useEffect(() => {
    let cancelled = false

    getCompanyInterests()
      .then((interests) => {
        if (cancelled) return
        order.current = new Map(interests.map((item, index) => [item.companyId, index]))
        setState({ status: 'ready', interests })
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
    setActionError(null)
    setState((previous) =>
      previous.status === 'ready'
        ? { status: 'ready', interests: previous.interests.filter((item) => item.companyId !== company.companyId) }
        : previous,
    )

    removeCompanyInterest(company.companyId).catch((cause: unknown) => {
      console.error('관심 기업 해제 실패 code=%s', codeOf(cause))
      setActionError(`${company.name} 관심 해제에 실패했어요. ${toUserMessage(codeOf(cause))}`)
      setState((previous) => {
        if (previous.status !== 'ready' || previous.interests.some((item) => item.companyId === company.companyId)) {
          return previous
        }
        // 처음 목록에 없던 기업(나중에 추가된 것)은 맨 뒤로 봅니다
        const rankOf = (companyId: string) => order.current.get(companyId) ?? Number.POSITIVE_INFINITY
        const at = previous.interests.findIndex((item) => rankOf(item.companyId) > rankOf(company.companyId))
        const next = [...previous.interests]
        next.splice(at < 0 ? next.length : at, 0, company)
        return { status: 'ready', interests: next }
      })
    })
  }, [])

  if (state.status !== 'ready') return state
  return { ...state, remove, actionError }
}
