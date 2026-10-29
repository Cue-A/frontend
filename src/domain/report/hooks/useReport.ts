import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { getReport } from '../api/reportApi'
import type { Report } from '../types/report'

type ReportState = {
  data: Report | null
  isLoading: boolean
  /** 사용자에게 보여줄 문구. 없으면 null */
  error: string | null
  /**
   * 화면을 비우지 않고 다시 불러옵니다. 부분 재시도가 끝나 리포트가 통째로 바뀌었을 때 씁니다.
   * 새 리포트를 돌려주고, 불러오지 못했으면 null 입니다.
   */
  reload: () => Promise<Report | null>
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

  /*
    다시 불러오는 동안에도 지금 리포트를 그대로 둡니다. 로딩 화면으로 갔다 오면 보던 자리를 잃습니다.
    실패해도 지금 리포트를 지우지 않고 null 만 돌려줍니다. 안내는 부르는 쪽이 합니다.

    그 사이 다른 회차로 옮겨서 그 회차 결과가 먼저 도착했으면 덮지 않습니다. 늦게 온 옛 회차가 새 회차
    자리에 들어가면 화면이 로딩에서 빠져나오지 못합니다.
  */
  const reload = useCallback(async (): Promise<Report | null> => {
    if (!reportId) return null

    try {
      const data = await getReport(reportId)
      setSettled((previous) =>
        previous && previous.reportId !== reportId ? previous : { reportId, data, error: null },
      )
      return data
    } catch (cause: unknown) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      console.error('리포트 다시 불러오기 실패 code=%s', code)
      return null
    }
  }, [reportId])

  if (!reportId) {
    return { data: null, isLoading: false, error: NOT_FOUND_MESSAGE, reload }
  }

  // id 가 바뀌면 이전 결과는 버리고 다시 로딩으로 봅니다.
  if (settled?.reportId !== reportId) {
    return { data: null, isLoading: true, error: null, reload }
  }

  return { data: settled.data, isLoading: false, error: settled.error, reload }
}
