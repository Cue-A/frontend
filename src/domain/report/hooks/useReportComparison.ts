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

/**
 * 받은 결과를 리포트별로 들고 있습니다. **새로고침하기 전까지** 같은 리포트는 다시 부르지 않습니다. (이슈 #157)
 *
 * 리포트 화면은 들어올 때마다 부르고, 성장 관리도 같은 API 를 씁니다. 회차를 오가거나 두 화면을 오가면 60초 10회 제한에
 * 금방 걸려서, 한 번 받은 결과를 다시 씁니다. 회차 비교는 그 리포트의 회차까지만 계산해서, 뒤에 재연습을 해도 이 리포트의
 * 결과는 바뀌지 않습니다. 실패한 결과는 들고 있지 않습니다 — 다음에 들어오면 다시 부릅니다.
 */
const cache = new Map<string, RoundComparison>()

type Settled =
  | { reportId: string; attempt: number; status: 'error'; error: ComparisonErrorView }
  | { reportId: string; attempt: number; status: 'ready'; comparison: RoundComparison }

/**
 * 회차 비교 · 성장 추이입니다. (`GET /api/reports/{reportId}/comparison` — 백엔드에 없어 목업이 답합니다)
 *
 * `reportId` 가 null 이면 부르지 않습니다(`idle`) — 아직 리포트가 하나도 없는 사용자입니다.
 *
 * **같은 리포트로는 다시 부르지 않습니다.** 부를 때마다 AI 가 계산하고 60초에 10회 제한이 있어서, 다른 카드(목표 등)를
 * 새로 받을 때 따라 부르면 안 됩니다. 받은 결과는 화면을 옮겨도 들고 있고(`cache`), "다시 시도" 를 눌렀을 때만 다시
 * 부릅니다.
 *
 * 로딩은 "이 리포트 · 이 시도의 결과가 아직 없다" 로 계산합니다. effect 안에서 곧바로 setState 하지 않으려는 것입니다
 * (`useReport` 와 같은 방식).
 */
type Options = {
  /** 오류 문구에서 기준 리포트를 부르는 말. 기본은 성장 관리의 "가장 최근 리포트", 리포트 화면은 "이 리포트" */
  subject?: string
  /**
   * 리포트 내용이 바뀌었는지 알려주는 값. 바뀌면 들고 있던 결과를 쓰지 않고 새로 부릅니다.
   * 리포트 화면에서 "다시 분석" 으로 점수가 바뀌면 회차 비교도 달라져서, 리포트 상태 · 총점을 넘깁니다
   */
  version?: string
}

export function useReportComparison(reportId: string | null, { subject, version }: Options = {}): UseReportComparisonResult {
  const [settled, setSettled] = useState<Settled | null>(null)
  const [attempt, setAttempt] = useState(0)
  const cacheKey = reportId && version ? `${reportId}#${version}` : reportId

  useEffect(() => {
    if (!reportId || !cacheKey || cache.has(cacheKey)) return
    let cancelled = false

    getReportComparison(reportId)
      .then((comparison) => {
        cache.set(cacheKey, comparison)
        if (!cancelled) setSettled({ reportId: cacheKey, attempt, status: 'ready', comparison })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        console.error('회차 비교 조회 실패 reportId=%s code=%s', reportId, code)
        setSettled({ reportId: cacheKey, attempt, status: 'error', error: comparisonErrorOf(code, subject) })
      })

    return () => {
      cancelled = true
    }
  }, [reportId, cacheKey, attempt, subject])

  // 다시 시도는 들고 있던 결과를 버리고 새로 부릅니다
  const reload = useCallback(() => {
    if (cacheKey) cache.delete(cacheKey)
    setAttempt((value) => value + 1)
  }, [cacheKey])

  if (!reportId || !cacheKey) return { status: 'idle', reload }
  // settled.reportId 에는 들고 있는 열쇠(리포트 id + 버전)를 넣어 둡니다 — 리포트 내용이 바뀌면 로딩으로 돌아갑니다
  if (!settled || settled.reportId !== cacheKey || settled.attempt !== attempt) {
    const cached = cache.get(cacheKey)
    return cached ? { status: 'ready', comparison: cached, reload } : { status: 'loading', reload }
  }
  if (settled.status === 'error') return { status: 'error', error: settled.error, reload }
  return { status: 'ready', comparison: settled.comparison, reload }
}
