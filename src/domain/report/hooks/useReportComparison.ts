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

/**
 * 응답을 기다리는 요청입니다. 같은 리포트를 기다리는 동안 다시 부르면 새로 보내지 않고 이 요청을 같이 기다립니다.
 *
 * 결과는 응답이 온 뒤에야 `cache` 에 들어가서, 로딩 중에 화면을 옮겼다 돌아오거나 개발 모드(StrictMode)가 마운트를 두 번
 * 하면 같은 요청이 두 번 나갔습니다. (PR #158 리뷰) 응답이 오면(성공이든 실패든) 여기서 지웁니다.
 */
const pending = new Map<string, Promise<RoundComparison>>()

function loadComparison(cacheKey: string, reportId: string): Promise<RoundComparison> {
  const cached = cache.get(cacheKey)
  if (cached) return Promise.resolve(cached)

  const waiting = pending.get(cacheKey)
  if (waiting) return waiting

  const request = getReportComparison(reportId)
    .then((comparison) => {
      cache.set(cacheKey, comparison)
      return comparison
    })
    .finally(() => pending.delete(cacheKey))
  pending.set(cacheKey, request)
  return request
}

type Settled =
  | { cacheKey: string; visit: number; status: 'error'; error: ComparisonErrorView }
  | { cacheKey: string; visit: number; status: 'ready'; comparison: RoundComparison }

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
  const cacheKey = reportId && version ? `${reportId}#${version}` : reportId

  /*
    몇 번째로 이 리포트를 보러 왔는지입니다. 리포트가 바뀌거나 "다시 시도" 를 누를 때마다 올라갑니다.
    결과에 이 값을 같이 남겨서, 지난번에 받은 결과(특히 오류)를 이번 것으로 보지 않습니다 — 리포트 A 오류 → B → 다시 A 로
    오면, 다시 부른 응답이 오기 전까지 A 의 지난 오류가 남아 있었습니다. (PR #158 리뷰)
    리포트가 바뀐 건 렌더 중에 맞춥니다(React 권장 패턴) — effect 안에서 곧바로 setState 하지 않으려는 것입니다.
  */
  const [visit, setVisit] = useState(0)
  const [visitedKey, setVisitedKey] = useState(cacheKey)
  if (visitedKey !== cacheKey) {
    setVisitedKey(cacheKey)
    setVisit((value) => value + 1)
  }

  useEffect(() => {
    if (!reportId || !cacheKey || cache.has(cacheKey)) return
    let cancelled = false

    loadComparison(cacheKey, reportId)
      .then((comparison) => {
        if (!cancelled) setSettled({ cacheKey, visit, status: 'ready', comparison })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        console.error('회차 비교 조회 실패 reportId=%s code=%s', reportId, code)
        setSettled({ cacheKey, visit, status: 'error', error: comparisonErrorOf(code, subject) })
      })

    return () => {
      cancelled = true
    }
  }, [reportId, cacheKey, visit, subject])

  // 다시 시도는 들고 있던 결과를 버리고 새로 부릅니다
  const reload = useCallback(() => {
    if (cacheKey) cache.delete(cacheKey)
    setVisit((value) => value + 1)
  }, [cacheKey])

  if (!reportId || !cacheKey) return { status: 'idle', reload }

  // 이번 방문의 결과가 아직 없으면, 들고 있는 결과가 있을 때만 그걸 보여주고 아니면 로딩입니다
  if (!settled || settled.cacheKey !== cacheKey || settled.visit !== visit) {
    const cached = cache.get(cacheKey)
    return cached ? { status: 'ready', comparison: cached, reload } : { status: 'loading', reload }
  }
  if (settled.status === 'error') return { status: 'error', error: settled.error, reload }
  return { status: 'ready', comparison: settled.comparison, reload }
}
