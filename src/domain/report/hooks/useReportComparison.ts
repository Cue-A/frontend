import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getReportComparison } from '../api/reportComparisonApi'
import { comparisonErrorOf, type ComparisonErrorView } from '../lib/comparisonErrorMessage'
import type { RoundComparison } from '../types/comparison'

export type UseReportComparisonResult = (
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: ComparisonErrorView }
  | { status: 'ready'; comparison: RoundComparison }
) & {
  /** 오류 안내의 "다시 시도" 에 씁니다 */
  reload: () => void
}

type Settled =
  | { reportId: string; attempt: number; status: 'error'; error: ComparisonErrorView }
  | { reportId: string; attempt: number; status: 'ready'; comparison: RoundComparison }

/**
 * 회차 비교 · 성장 추이입니다. (`GET /api/reports/{reportId}/comparison` — 백엔드에 없어 목업이 답합니다)
 *
 * `reportId` 가 null 이면 부르지 않습니다(`idle`) — 아직 리포트가 하나도 없는 사용자입니다.
 *
 * **같은 리포트로는 다시 부르지 않습니다.** 부를 때마다 AI 가 계산하고 60초에 10회 제한이 있어서, 다른 카드(목표 등)를
 * 새로 받을 때 따라 부르면 안 됩니다. 리포트가 바뀌거나 "다시 시도" 를 눌렀을 때만 다시 부릅니다.
 *
 * 로딩은 "이 리포트 · 이 시도의 결과가 아직 없다" 로 계산합니다. effect 안에서 곧바로 setState 하지 않으려는 것입니다
 * (`useReport` 와 같은 방식).
 */
export function useReportComparison(reportId: string | null): UseReportComparisonResult {
  const [settled, setSettled] = useState<Settled | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!reportId) return
    let cancelled = false

    getReportComparison(reportId)
      .then((comparison) => {
        if (!cancelled) setSettled({ reportId, attempt, status: 'ready', comparison })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        console.error('회차 비교 조회 실패 reportId=%s code=%s', reportId, code)
        setSettled({ reportId, attempt, status: 'error', error: comparisonErrorOf(code) })
      })

    return () => {
      cancelled = true
    }
  }, [reportId, attempt])

  const reload = useCallback(() => setAttempt((value) => value + 1), [])

  if (!reportId) return { status: 'idle', reload }
  if (!settled || settled.reportId !== reportId || settled.attempt !== attempt) return { status: 'loading', reload }
  if (settled.status === 'error') return { status: 'error', error: settled.error, reload }
  return { status: 'ready', comparison: settled.comparison, reload }
}
