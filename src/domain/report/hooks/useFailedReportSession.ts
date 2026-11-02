import { useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getReportStatus } from '../api/reportRequestApi'

/** 응답이 도착한 결과. 어떤 리포트의 결과인지 같이 들고 있습니다 */
type Settled = { reportId: string; sessionId: string | null }

export type FailedReportSession = {
  /** 상태 조회를 기다리는 중인지. 그동안 화면은 "다시 연습하기" 의 목적지를 정하지 않습니다 */
  checking: boolean
  /** 찾은 면접. 못 찾았거나 찾을 필요가 없으면 null */
  sessionId: string | null
}

const NONE: FailedReportSession = { checking: false, sessionId: null }

/**
 * 분석이 실패한 리포트가 어느 면접의 것인지 찾습니다. (이슈 #152)
 *
 * 리포트 조회가 `REPORT_FAILED`(409)로 끝나면 응답에 리포트가 없어서 세션 id 도 모릅니다. 그런데 면접이 끝났으면
 * 리포트가 실패해도 같은 질문으로 재연습할 수 있어서(Cue-A/backend 확인), 리포트 실패 화면의 "다시 연습하기" 를
 * 재연습으로 이으려면 세션 id 가 필요합니다. 상태 조회(`GET /api/reports/{reportId}/status`)는 실패한 리포트에도
 * 세션 id 를 줘서 그걸 씁니다.
 *
 * 조회하는 동안은 `checking` 입니다. 그 사이 "새 면접 설정으로 갑니다" 를 보여줬다가 "재연습해요" 로 바꾸면 문구와 버튼
 * 목적지가 눈앞에서 바뀌어서, 화면이 버튼을 잠깐 잠급니다. (PR #153 리뷰)
 * 상태 조회가 실패하면 `sessionId` 가 null 이고, 화면은 지금처럼 새 면접 설정으로 보냅니다.
 */
export function useFailedReportSession(reportId: string | undefined, enabled: boolean): FailedReportSession {
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

  if (!reportId || !enabled) return NONE
  if (settled?.reportId !== reportId) return { checking: true, sessionId: null }
  return { checking: false, sessionId: settled.sessionId }
}
