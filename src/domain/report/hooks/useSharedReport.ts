import { useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { getSharedReport, type SharedReport } from '../api/sharedReportApi'

export type UseSharedReportResult =
  | { status: 'loading' }
  /** `notFound` 는 해제됐거나 없는 링크(`SHARED_REPORT_NOT_FOUND`)입니다. 다시 불러도 같아서 다시 시도를 두지 않습니다 */
  | { status: 'error'; message: string; notFound: boolean }
  | { status: 'ready'; shared: SharedReport }

type Settled = { shareId: string; result: Exclude<UseSharedReportResult, { status: 'loading' }> }

/**
 * 공유 링크로 연 리포트를 불러옵니다 (`GET /api/public/reports/{shareId}` · 이슈 #199).
 *
 * 로그인하지 않은 사람도 부릅니다. 화면은 이 훅의 상태만 그립니다. 로딩 여부는 "이 링크의 결과가 아직 없다" 로 계산합니다 —
 * effect 안에서 곧바로 setState 하면 eslint(react-hooks) 가 막습니다 (`useReport` 와 같은 방식).
 */
export function useSharedReport(shareId: string | undefined): UseSharedReportResult {
  const [settled, setSettled] = useState<Settled | null>(null)

  useEffect(() => {
    if (!shareId) return

    let alive = true

    getSharedReport(shareId)
      .then((shared) => {
        if (alive) setSettled({ shareId, result: { status: 'ready', shared } })
      })
      .catch((cause: unknown) => {
        if (!alive) return
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        // 링크 자체는 로그에 남기지 않습니다. 아는 사람은 누구나 리포트를 볼 수 있는 값입니다
        console.error('공유 리포트 불러오기 실패 code=%s', code)
        setSettled({
          shareId,
          result: { status: 'error', message: toUserMessage(code), notFound: code === 'SHARED_REPORT_NOT_FOUND' },
        })
      })

    return () => {
      alive = false
    }
  }, [shareId])

  if (!shareId) {
    return { status: 'error', message: toUserMessage('SHARED_REPORT_NOT_FOUND'), notFound: true }
  }
  if (!settled || settled.shareId !== shareId) return { status: 'loading' }
  return settled.result
}
