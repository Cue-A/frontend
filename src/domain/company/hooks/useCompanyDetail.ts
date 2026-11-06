import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getCompanyDetail } from '../api/companyApi'
import type { CompanyDetail } from '../types/company'

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; company: CompanyDetail }

export type UseCompanyDetailResult = State & {
  /** 실패 안내의 "다시 시도" 에 씁니다 */
  reload: () => void
}

/**
 * 기업 상세 · 인재상입니다. (`GET /api/companies/{companyId}`)
 *
 * 없는 기업 · 검증되지 않은 기업은 `COMPANY_NOT_FOUND` 로 옵니다. 화면은 이 코드면 다시 시도 대신 목록으로 안내합니다.
 */
export function useCompanyDetail(companyId: string): UseCompanyDetailResult {
  const [state, setState] = useState<State & { companyId: string }>({ companyId, status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    getCompanyDetail(companyId)
      .then((company) => {
        if (!cancelled) setState({ companyId, status: 'ready', company })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const error = cause instanceof ApiError ? cause : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('기업 상세 조회 실패 code=%s', error.code)
        setState({ companyId, status: 'error', error })
      })

    return () => {
      cancelled = true
    }
  }, [companyId, attempt])

  const reload = useCallback(() => {
    setState({ companyId, status: 'loading' })
    setAttempt((value) => value + 1)
  }, [companyId])

  // 주소의 기업이 바뀐 직후, 새 요청이 끝나기 전에는 이전 기업 대신 로딩으로 봅니다
  if (state.companyId !== companyId) return { status: 'loading', reload }

  if (state.status === 'ready') return { status: 'ready', company: state.company, reload }
  if (state.status === 'error') return { status: 'error', error: state.error, reload }
  return { status: 'loading', reload }
}
