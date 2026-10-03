import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import {
  canCheckReportStatus,
  getReportStatus,
  requestReport,
  type ReportRequestResponse,
  type ReportStatusResponse,
} from '../api/reportRequestApi'
import { connectReportSocket } from '../api/reportSocket'
import { ANALYSIS_MESSAGES, FINAL_REQUEST_ERRORS } from '../lib/analysisErrorMessage'
import { ANALYSIS_STAGES, toAnalysisStageKey, WAITING_TIPS } from '../types/analysis'

/** 팁이 바뀌는 간격(ms) */
const TIP_ROTATE_MS = 5000

/**
 * 이만큼 기다려도 끝나지 않으면 기다림을 멈추고 안내로 바꿉니다.
 *
 * AI 가 리포트 생성 폴링 상한으로 **10분**을 권장하고, 백엔드도 10분이 지나면 `AI_TIMEOUT` 으로 끝냅니다
 * (Cue-A/backend#50 `ReportPoller`). 그래서 보통은 이 시간이 되기 전에 소켓 `error` 가 먼저 옵니다.
 * 이 상한은 그 메시지를 놓쳤을 때(늦게 붙음 · 연결 끊김) 무한 스피너가 되지 않게 하는 안전장치입니다.
 * (이슈 #54 3-3, Q6a "하지 말 것")
 */
export const ANALYSIS_TIMEOUT_MS = 10 * 60 * 1000

export type AnalysisFailure = {
  /** 사용자에게 보여줄 문구 */
  message: string
  /** true 면 "다시 분석하기" 로 등록을 다시 부를 수 있습니다 */
  retryable: boolean
}

export type AnalysisProgress = {
  /** 0부터 셉니다. ANALYSIS_STAGES 의 몇 번째인지 */
  stageIndex: number
  /** 끝났으면 리포트 id. 리포트 화면으로 보낼 때 씁니다 */
  reportId: string | null
  /** 분석이 실패했으면 이유 */
  failure: AnalysisFailure | null
  /** 끝나지도 실패하지도 않은 채 `ANALYSIS_TIMEOUT_MS` 가 지났으면 true */
  isTimedOut: boolean
  tip: string
  /** 분석을 다시 요청합니다. `failure.retryable` 일 때만 부릅니다 */
  retry: () => void
}

/**
 * 등록 응답의 reportId 를 세션 id 로 기억해 둡니다.
 *
 * 새로고침하면 등록을 다시 부르게 되는데, 이미 요청한 면접은 409 `REPORT_ALREADY_EXISTS` 이고 응답에 reportId 가
 * 없습니다. 그래서 기억해 둔 id 로 소켓에 다시 붙고, 상태 조회(Cue-A/backend#56)로 그 사이 진행된 것을 따라잡습니다.
 * 끝나거나 실패하면 지웁니다 — 실패한 리포트는 다시 요청해야 하고, 그때는 등록부터 다시 가야 합니다.
 *
 * 탭 하나에서만 이어지면 되므로 sessionStorage 입니다. 저장이 막힌 브라우저에서는 기억하지 못할 뿐 동작은 같습니다.
 */
const storageKey = (sessionId: string) => `cue-a:analysis:${sessionId}`

function readReportId(sessionId: string): string | null {
  try {
    return sessionStorage.getItem(storageKey(sessionId))
  } catch {
    return null
  }
}

function rememberReportId(sessionId: string, reportId: string) {
  try {
    sessionStorage.setItem(storageKey(sessionId), reportId)
  } catch {
    // 기억하지 못하면 새로고침 때 409 안내가 뜰 뿐입니다.
  }
}

function forgetReportId(sessionId: string) {
  try {
    sessionStorage.removeItem(storageKey(sessionId))
  } catch {
    // 위와 같습니다.
  }
}

/**
 * 같은 세션의 등록 요청을 하나로 묶습니다.
 *
 * 개발 모드(StrictMode)는 effect 를 두 번 돌립니다. 그대로 두면 등록이 두 번 나가고, 백엔드는 두 번째를
 * 409 `REPORT_ALREADY_EXISTS` 로 막아서 **개발 중에만** 분석이 실패한 것처럼 보입니다. 첫 요청이 끝나기 전에
 * 다시 부르면 같은 요청을 돌려줍니다.
 */
const pendingRequests = new Map<string, Promise<ReportRequestResponse>>()

function requestReportOnce(sessionId: string): Promise<ReportRequestResponse> {
  const pending = pendingRequests.get(sessionId)
  if (pending) return pending

  const request = requestReport(sessionId).finally(() => pendingRequests.delete(sessionId))
  pendingRequests.set(sessionId, request)
  return request
}

/**
 * 리포트 분석을 맡기고 진행 상황을 따라갑니다. (Cue-A/backend#50)
 *
 * 1. `POST /api/interviews/{sessionId}/reports` 로 분석을 등록하고 reportId 를 받습니다
 * 2. `/ws/reports/{reportId}` 에 붙어 `progress` 로 단계를 옮깁니다
 * 3. 붙은 직후 상태 조회(`GET /api/reports/{reportId}/status`)를 **한 번** 불러, 붙기 전에 진행되거나 끝난 것을
 *    따라잡습니다. 소켓은 지난 메시지를 다시 보내주지 않기 때문입니다 (Cue-A/backend#56)
 * 4. `report` 가 오면(또는 조회가 끝났다고 하면) `reportId` 를 채웁니다. 화면이 리포트로 보냅니다
 * 5. `error` 나 등록 실패는 `failure` 로 줍니다
 *
 * 단계는 **뒤로 가지 않습니다.** 백엔드가 실패 뒤 스스로 한 번 더 돌리면(`CONTENT_FAILED` · `MEDIA_FETCH_FAILED`)
 * 단계가 처음부터 다시 올 수 있는데, 막대가 줄어들면 고장 난 것처럼 보입니다. 모르는 단계 값도 무시합니다.
 */
export function useAnalysisProgress(sessionId: string | undefined): AnalysisProgress {
  const [stageIndex, setStageIndex] = useState(0)
  const [reportId, setReportId] = useState<string | null>(null)
  const [failure, setFailure] = useState<AnalysisFailure | null>(null)
  /** "다시 분석하기" 를 누를 때마다 올립니다. 등록 · 소켓 · 기다림 상한이 모두 이 값으로 새로 시작합니다 */
  const [attempt, setAttempt] = useState(0)
  /** 기다림 상한이 지난 시도 번호. 다시 요청하면 번호가 달라져서 저절로 풀립니다 */
  const [timedOutAttempt, setTimedOutAttempt] = useState<number | null>(null)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    if (!sessionId) return

    let alive = true
    let disconnect = () => {}

    /** 소켓이 결과(`report` · `error`)를 먼저 줬으면 true. 늦게 도착한 조회 응답은 버립니다 (backend#56 "호출 순서") */
    let settledBySocket = false

    const fail = (code: string, retryable: boolean) => {
      forgetReportId(sessionId)
      console.error('리포트 분석 실패 code=%s retryable=%s', code, retryable)
      setFailure({ message: toUserMessage(code, ANALYSIS_MESSAGES), retryable })
    }

    const toStageIndex = (stage: string) => {
      const key = toAnalysisStageKey(stage)
      if (!key) {
        console.error('알 수 없는 리포트 분석 단계 stage=%s', stage)
        return null
      }
      return ANALYSIS_STAGES.findIndex((item) => item.key === key)
    }

    const applyStatus = (status: ReportStatusResponse) => {
      if (status.status === 'PROCESSING') {
        const index = status.stage ? toStageIndex(status.stage) : null
        if (index !== null) setStageIndex((previous) => Math.max(previous, index))
        return
      }
      if (status.status === 'FAILED') {
        fail(status.errorCode ?? 'UNKNOWN', status.retryable ?? false)
        return
      }
      forgetReportId(sessionId)
      setReportId(status.reportId)
    }

    /**
     * @param fromSaved 새로고침으로 기억해 둔 id 인지. 그 id 가 404 면 기억이 틀린 것이라(DB 를 비웠다 등) 지우고
     *   등록부터 다시 갑니다. 방금 등록해서 받은 id 가 404 인 건 서버 문제라 소켓만으로 기다립니다
     */
    const catchUp = (id: string, fromSaved: boolean) => {
      if (!canCheckReportStatus(sessionId, id)) return

      getReportStatus(id)
        .then((status) => {
          if (alive && !settledBySocket) applyStatus(status)
        })
        .catch((cause: unknown) => {
          if (!alive || settledBySocket) return
          const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
          if (code === 'REPORT_NOT_FOUND' && fromSaved) {
            forgetReportId(sessionId)
            setAttempt((previous) => previous + 1)
            return
          }
          // 조회는 따라잡기용이라 실패해도 소켓으로 계속 기다립니다.
          console.warn('리포트 상태 조회 실패 code=%s — 소켓으로 계속 기다립니다', code)
        })
    }

    const listen = (id: string, fromSaved: boolean) => {
      disconnect = connectReportSocket(id, sessionId, {
        onProgress: ({ stage }) => {
          const index = toStageIndex(stage)
          if (index !== null) setStageIndex((previous) => Math.max(previous, index))
        },
        onReport: (push) => {
          settledBySocket = true
          forgetReportId(sessionId)
          setReportId(push.reportId)
        },
        onError: (push) => {
          settledBySocket = true
          fail(push.errorCode, push.retryable)
        },
      })
      catchUp(id, fromSaved)
    }

    // 다시 분석할 때는 기억해 둔 id 가 이미 지워져 있어서 등록부터 갑니다.
    const saved = readReportId(sessionId)
    if (saved) {
      listen(saved, true)
    } else {
      requestReportOnce(sessionId)
        .then((response) => {
          if (!alive) return
          rememberReportId(sessionId, response.reportId)
          listen(response.reportId, false)
        })
        .catch((cause: unknown) => {
          if (!alive) return
          const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
          console.error('리포트 분석 등록 실패 code=%s', code)
          setFailure({
            message: toUserMessage(code, ANALYSIS_MESSAGES),
            retryable: !FINAL_REQUEST_ERRORS.has(code),
          })
        })
    }

    const timeout = window.setTimeout(() => setTimedOutAttempt(attempt), ANALYSIS_TIMEOUT_MS)

    return () => {
      alive = false
      disconnect()
      window.clearTimeout(timeout)
    }
  }, [sessionId, attempt])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTipIndex((previous) => (previous + 1) % WAITING_TIPS.length)
    }, TIP_ROTATE_MS)

    return () => window.clearInterval(timer)
  }, [])

  const retry = useCallback(() => {
    setFailure(null)
    setStageIndex(0)
    setAttempt((previous) => previous + 1)
  }, [])

  return {
    stageIndex,
    reportId,
    failure,
    // 끝났거나 실패했으면 늦었다고 하지 않습니다. 각자 자기 화면이 있습니다.
    isTimedOut: timedOutAttempt === attempt && reportId === null && failure === null,
    tip: WAITING_TIPS[tipIndex],
    retry,
  }
}
