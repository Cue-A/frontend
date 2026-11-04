import { useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getReportTimeline } from '../api/timelineApi'
import type { ReportTimeline } from '../types/timeline'

export type UseReportTimelineResult =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; timeline: ReportTimeline }

/**
 * XAI 타임라인의 근거 구간입니다. (`GET /api/reports/{reportId}/timeline` · 이슈 #168)
 *
 * 못 받으면 타임라인은 지금처럼 문항 목록(제목 · 점수)만 보여줍니다 — 마커와 "구간 보기" 만 빠집니다. 그래서 다시 시도
 * 버튼은 두지 않습니다. `reportId` 가 null 이면 부르지 않습니다.
 *
 * 다시 분석해서 근거가 바뀌는 경우(실패 축 재시도)는 `version` 이 바뀌면 다시 받습니다.
 */
export function useReportTimeline(reportId: string | null, version: string): UseReportTimelineResult {
  const [state, setState] = useState<UseReportTimelineResult & { key: string }>({ key: '', status: 'loading' })
  const key = `${reportId}:${version}`

  useEffect(() => {
    if (!reportId) return
    let cancelled = false

    getReportTimeline(reportId)
      .then((timeline) => {
        if (!cancelled) setState({ key, status: 'ready', timeline })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const error = cause instanceof ApiError ? cause : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('XAI 타임라인 조회 실패 code=%s', error.code)
        setState({ key, status: 'error', error })
      })

    return () => {
      cancelled = true
    }
  }, [reportId, key])

  if (state.key !== key || state.status === 'loading') return { status: 'loading' }
  return state.status === 'error' ? { status: 'error', error: state.error } : { status: 'ready', timeline: state.timeline }
}
