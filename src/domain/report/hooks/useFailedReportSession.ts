import { useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getReportStatus } from '../api/reportRequestApi'

/** 응답이 도착한 결과. 어떤 리포트의 결과인지 같이 들고 있습니다 */
type Settled = { reportId: string; sessionId: string | null }

/**
 * 분석이 실패한 리포트가 어느 면접의 것인지 찾습니다. (이슈 #152)
 *
 * 리포트 조회가 `REPORT_FAILED`(409)로 끝나면 응답에 리포트가 없어서 세션 id 도 모릅니다. 그런데 면접이 끝났으면
 * 리포트가 실패해도 같은 질문으로 재연습할 수 있어서(Cue-A/backend 확인), 리포트 실패 화면의 "다시 연습하기" 를
 * 재연습으로 이으려면 세션 id 가 필요합니다. 상태 조회(`GET /api/reports/{reportId}/status`)는 실패한 리포트에도
 * 세션 id 를 줘서 그걸 씁니다.
 *
 * `enabled` 가 false 거나 아직 모르면 null 입니다. 상태 조회가 실패해도 null — 화면은 지금처럼 새 면접 설정으로 보냅니다.
 */
export function useFailedReportSession(reportId: string | undefined, enabled: boolean): string | null {
  const [settled, setSettled] = useState<Settled | null>(null)

  useEffect(() => {
    if (!reportId || !enabled) return

    let alive = true

    getReportStatus(reportId)
      .then((status) => {
        if (alive) setSettled({ reportId, sessionId: status.sessionId || null })
      })
      .catch((cause: unknown) => {
        if (!alive) return
        console.error('실패한 리포트의 면접 찾기 실패 code=%s', cause instanceof ApiError ? cause.code : 'UNKNOWN')
        setSettled({ reportId, sessionId: null })
      })

    return () => {
      alive = false
    }
  }, [reportId, enabled])

  if (!reportId || !enabled || settled?.reportId !== reportId) return null
  return settled.sessionId
}
