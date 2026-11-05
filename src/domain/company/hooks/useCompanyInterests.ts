import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { addCompanyInterest, getCompanyInterests, removeCompanyInterest } from '../api/companyApi'
import type { CompanyInterest } from '../types/company'

type State = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; interests: CompanyInterest[] }

export type UseCompanyInterestsResult =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | {
      status: 'ready'
      /** 최근에 등록한 순서입니다 */
      interests: CompanyInterest[]
      /** 이 기업을 관심 등록했는지 */
      isInterested: (companyId: string) => boolean
      /** 서버에 알리는 중인지. 그동안 같은 기업을 다시 누르면 무시합니다 */
      isPending: (companyId: string) => boolean
      /** 목록 맨 앞에 바로 넣고 서버에 알립니다. 실패하면 그 기업만 빼고 `actionError` 에 이유를 둡니다 */
      add: (company: CompanyInterest) => void
      /** 목록에서 바로 빼고 서버에 알립니다. 실패하면 그 기업만 제자리에 되돌리고 `actionError` 에 이유를 둡니다 */
      remove: (company: CompanyInterest) => void
      /** 마지막 등록 · 해제가 실패한 이유. 사용자에게 그대로 보여줄 문구입니다 */
      actionError: string | null
    }

function codeOf(cause: unknown) {
  return cause instanceof ApiError ? cause.code : 'UNKNOWN'
}

/**
 * 내 관심 기업 목록과 등록 · 해제입니다. (Cue-A/backend #101 · 이슈 #162)
 *
 * 마이페이지 > 관심 기업(user 도메인)도 이 훅을 씁니다. 도메인 간 참조는 hooks 에서만 합니다. (docs/01-conventions.md)
 *
 * 등록 · 해제는 기다리지 않고 목록을 먼저 바꿉니다(낙관적 업데이트). 실패하면 **그 기업만** 되돌립니다 — 누른 순간의
 * 목록 통째로 되돌리면, 연달아 둘을 바꿨을 때 하나만 실패해도 다른 하나까지 되돌아갑니다. (PR #112 리뷰)
 *
 * 해제를 되돌릴 자리는 **기업마다 매겨 둔 순번**으로 찾습니다. 처음 불러온 목록은 그 순서대로, 이 화면에서 등록한 기업은
 * 맨 앞 순번을 받습니다(응답이 최근 등록순이라서). 전에는 setState 업데이트 함수 안에서 뺀 자리(index)를 적어 두고 실패
 * 콜백에서 읽었는데, 업데이트 함수가 실패 콜백보다 먼저 돈다는 순서에 기대는 구조였습니다. (PR #166 리뷰)
 *
 * 같은 기업의 요청이 끝나기 전에는 그 기업을 다시 눌러도 무시합니다. 등록과 해제가 겹쳐 나가면 서버에 도착하는 순서에 따라
 * 화면과 서버가 어긋날 수 있습니다.
 */
export function useCompanyInterests(): UseCompanyInterestsResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [actionError, setActionError] = useState<string | null>(null)
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set())
  /** 기업 id → 목록에서의 순번(작을수록 앞). 해제에 실패한 기업을 되돌릴 자리를 여기서 찾습니다 */
  const order = useRef(new Map<string, number>())
  /** 이 화면에서 등록한 기업에 줄 순번. 처음 목록(0 부터)보다 앞이어야 해서 음수로 내려갑니다 */
  const nextTopRank = useRef(-1)
  /** 요청 중인 기업. 화면용 `pending` 은 렌더 뒤에 바뀌어서, 연달아 누르는 것은 이걸로 막습니다 */
  const inFlight = useRef(new Set<string>())

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

  /** 요청을 하나 시작합니다. 이미 그 기업의 요청이 있으면 false 를 돌려주고 아무것도 하지 않습니다 */
  const begin = useCallback((companyId: string) => {
    if (inFlight.current.has(companyId)) return false
    inFlight.current.add(companyId)
    setPending(new Set(inFlight.current))
    setActionError(null)
    return true
  }, [])

  const end = useCallback((companyId: string) => {
    inFlight.current.delete(companyId)
    setPending(new Set(inFlight.current))
  }, [])

  const add = useCallback(
    (company: CompanyInterest) => {
      if (!begin(company.companyId)) return
      order.current.set(company.companyId, nextTopRank.current)
      nextTopRank.current -= 1
      setState((previous) =>
        previous.status !== 'ready' || previous.interests.some((item) => item.companyId === company.companyId)
          ? previous
          : { status: 'ready', interests: [company, ...previous.interests] },
      )

      addCompanyInterest(company.companyId)
        .catch((cause: unknown) => {
          console.error('관심 기업 등록 실패 code=%s', codeOf(cause))
          setActionError(`${company.name} 관심 등록에 실패했어요. ${toUserMessage(codeOf(cause))}`)
          setState((previous) =>
            previous.status === 'ready'
              ? { status: 'ready', interests: previous.interests.filter((item) => item.companyId !== company.companyId) }
              : previous,
          )
        })
        .finally(() => end(company.companyId))
    },
    [begin, end],
  )

  const remove = useCallback(
    (company: CompanyInterest) => {
      if (!begin(company.companyId)) return
      setState((previous) =>
        previous.status === 'ready'
          ? { status: 'ready', interests: previous.interests.filter((item) => item.companyId !== company.companyId) }
          : previous,
      )

      removeCompanyInterest(company.companyId)
        .catch((cause: unknown) => {
          console.error('관심 기업 해제 실패 code=%s', codeOf(cause))
          setActionError(`${company.name} 관심 해제에 실패했어요. ${toUserMessage(codeOf(cause))}`)
          setState((previous) => {
            if (previous.status !== 'ready' || previous.interests.some((item) => item.companyId === company.companyId)) {
              return previous
            }
            const rankOf = (companyId: string) => order.current.get(companyId) ?? Number.POSITIVE_INFINITY
            const at = previous.interests.findIndex((item) => rankOf(item.companyId) > rankOf(company.companyId))
            const next = [...previous.interests]
            next.splice(at < 0 ? next.length : at, 0, company)
            return { status: 'ready', interests: next }
          })
        })
        .finally(() => end(company.companyId))
    },
    [begin, end],
  )

  if (state.status !== 'ready') return state

  const ids = new Set(state.interests.map((item) => item.companyId))
  return {
    ...state,
    isInterested: (companyId) => ids.has(companyId),
    isPending: (companyId) => pending.has(companyId),
    add,
    remove,
    actionError,
  }
}
