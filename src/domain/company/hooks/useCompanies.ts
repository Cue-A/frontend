import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getCompanies } from '../api/companyApi'
import type { Company } from '../types/company'

type State = { status: 'loading' } | { status: 'error'; error: ApiError } | { status: 'ready'; companies: Company[] }

export type UseCompaniesResult = State & {
  /** 실패 안내의 "다시 시도" 에 씁니다 */
  reload: () => void
}

/** 기업 탐색 목록입니다. 검증된 기업만, 이름 오름차순입니다. (`GET /api/companies`) */
export function useCompanies(): UseCompaniesResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    getCompanies()
      .then((companies) => {
        if (!cancelled) setState({ status: 'ready', companies })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const error = cause instanceof ApiError ? cause : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('기업 목록 조회 실패 code=%s', error.code)
        setState({ status: 'error', error })
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  return { ...state, reload }
}
