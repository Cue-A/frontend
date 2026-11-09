import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getLatestInterview } from '../api/growthApi'
import type { LatestInterview } from '../types/growth'

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  /** `interview` 가 null 이면 분석이 끝난 리포트가 아직 없습니다 */
  | { status: 'ready'; interview: LatestInterview | null }

export type UseLatestInterviewResult = State & {
  /** 오류 안내의 "다시 시도" 에 씁니다. 불러오는 중으로 바꾼 뒤 다시 받습니다 */
  reload: () => void
}

/**
 * 점수 추이 · 이전 회차 대비 변화의 기준이 될 가장 최근 리포트입니다. (`GET /api/home/recent-reports?limit=1`)
 *
 * 목표 · 배지(`useGrowthOverview`)와 따로 받습니다. 실서버(이것)와 목업(`/api/growth`)이 섞여 있어 한쪽만 실패할 수
 * 있어서, 이게 실패하면 점수 추이 · 이전 회차 대비 변화 칸에만 오류와 "다시 시도" 를 두고 목표 · 배지는 그대로 보입니다
 * (PR #184 리뷰). 받은 리포트로 회차 비교(`useReportComparison`)를 부르는 건 화면이 합니다.
 */
export function useLatestInterview(): UseLatestInterviewResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    getLatestInterview()
      .then((interview) => {
        if (!cancelled) setState({ status: 'ready', interview })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('성장 관리 최근 리포트 조회 실패 code=%s', apiError.code)
        setState({ status: 'error', error: apiError })
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
