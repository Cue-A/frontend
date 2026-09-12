import { useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { getReport } from '../api/reportApi'
import type { Report } from '../types/report'

type ReportState = {
  data: Report | null
  isLoading: boolean
  /** 사용자에게 보여줄 문구. 없으면 null */
  error: string | null
}

/** 응답이 도착한 결과. 어떤 id 의 결과인지 같이 들고 있습니다. */
type Settled = {
  reportId: string
  data: Report | null
  error: string | null
}

const NOT_FOUND_MESSAGE = '리포트를 찾을 수 없어요.'

/**
 * 리포트를 불러옵니다.
 * 화면은 이 훅의 상태만 그리고, 직접 fetch 하지 않습니다.
 *
 * setState 는 응답이 온 뒤에만 부릅니다. 로딩 여부는 "이 id 의 결과가
 * 아직 없다"로 계산합니다. effect 안에서 곧바로 setState 하면 렌더가
 * 한 번 더 돌아서 eslint(react-hooks) 가 막습니다.
 */
export function useReport(reportId: string | undefined): ReportState {
  const [settled, setSettled] = useState<Settled | null>(null)

  useEffect(() => {
    if (!reportId) return

    let alive = true

    getReport(reportId)
      .then((data) => {
        if (alive) setSettled({ reportId, data, error: null })
      })
      .catch((cause: unknown) => {
        if (!alive) return

        const error =
          cause instanceof ApiError ? toUserMessage(cause.code) : '잠시 후 다시 시도해 주세요.'

        setSettled({ reportId, data: null, error })
      })

    return () => {
      alive = false
    }
  }, [reportId])

  if (!reportId) {
    return { data: null, isLoading: false, error: NOT_FOUND_MESSAGE }
  }

  // id 가 바뀌면 이전 결과는 버리고 다시 로딩으로 봅니다.
  if (settled?.reportId !== reportId) {
    return { data: null, isLoading: true, error: null }
  }

  return { data: settled.data, isLoading: false, error: settled.error }
}
