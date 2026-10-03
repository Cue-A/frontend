import { api } from '@/shared/api/apiClient'
import { isRealApi } from '@/shared/api/mock'

import './reportRequestMock'

/** 리포트 분석 작업을 등록한 직후의 응답입니다. (Cue-A/backend#50 `ReportRequestResponse`) */
export type ReportRequestResponse = {
  /** UUID. 소켓 경로와 리포트 조회에 씁니다 */
  reportId: string
  sessionId: string
  /** 등록 직후에는 항상 `PROCESSING` 입니다 */
  status: 'PROCESSING'
  createdAt: string
}

/**
 * 등록 경로입니다. 소켓을 실제로 붙일지도 이 경로로 정합니다. (reportSocket.ts)
 *
 * 리포트 등록은 면접 세션의 하위 자원이라 **`interviews` 도메인**입니다. 소켓(`/ws/reports/...`)은 `reports`
 * 도메인이라 `VITE_REAL_APIS` 로 따로 켜면 등록은 실제 서버에, 소켓은 목업에 붙는 반쪽 상태가 됩니다.
 */
export const reportRequestPath = (sessionId: string) =>
  `/api/interviews/${encodeURIComponent(sessionId)}/reports`

/**
 * 끝난 면접의 리포트 분석을 맡깁니다. 결과는 기다리지 않고 바로 202 로 옵니다.
 * 진행 상황과 결과는 `connectReportSocket(reportId)` 로 받습니다. (Cue-A/backend#50)
 *
 * 실패
 * - 409 `SESSION_NOT_COMPLETED` · `SESSION_ABORTED` — 끝나지 않았거나 중단된 면접
 * - 409 `REPORT_ALREADY_EXISTS` — 이미 요청한 면접. 실패(`FAILED`)한 리포트만 다시 요청할 수 있고, 그때는
 *   reportId 가 그대로입니다
 * - 422 `REPORT_TOO_SHORT` — 되묻기를 뺀 답변이 2문항 미만
 * - 503 `AI_UNAVAILABLE` · 504 `AI_TIMEOUT` — 다시 요청하면 풀릴 수 있습니다
 * - 분당 10회 제한 (`RATE_LIMIT_EXCEEDED`)
 */
export function requestReport(sessionId: string) {
  return api.post<ReportRequestResponse>(reportRequestPath(sessionId))
}

/**
 * 분석 상태입니다. (Cue-A/backend#56 · #60 `ReportStatusResponse`)
 *
 * 점수 · 본문은 담지 않습니다. 소켓에 늦게 붙었거나 새로고침한 화면이 **지금 어디까지 왔는지** 맞추는 데만 씁니다.
 */
export type ReportStatusResponse = {
  reportId: string
  sessionId: string
  status: 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED'
  /** `PROCESSING` 일 때만. 첫 진행 알림 전이면 null. 소켓 `progress.stage` 와 같은 값입니다 */
  stage: string | null
  /** `PROCESSING` 일 때만 0~1. 화면은 쓰지 않고 단계로만 셉니다 */
  progress: number | null
  /** `FAILED` 일 때만 */
  errorCode: string | null
  /**
   * `FAILED` 일 때만. 소켓 `error.message` 와 같은 문구입니다 (Cue-A/backend#60).
   * 화면에는 쓰지 않습니다 — 소켓 실패와 마찬가지로 `errorCode` 로 우리 문구를 고릅니다 (`ANALYSIS_MESSAGES`)
   */
  message: string | null
  /** `FAILED` 일 때만. 소켓 `error.retryable` 과 같은 규칙입니다 */
  retryable: boolean | null
  createdAt: string
  /** 끝났으면(완료 · 실패) 시각. 진행 중이거나 다시 요청하면 null */
  completedAt: string | null
}

const reportStatusPath = (reportId: string) => `/api/reports/${encodeURIComponent(reportId)}/status`

/**
 * 분석이 지금 어디까지 왔는지 한 번 묻습니다. (Cue-A/backend#56)
 *
 * 백엔드가 정한 쓰는 법은 **소켓에 붙은 직후 한 번**입니다. 소켓은 붙는 순간 지난 메시지를 다시 보내주지 않아서,
 * 붙기 전에 끝났거나 진행된 것을 이걸로 따라잡습니다. 폴링용이 아닙니다(분당 30회 제한).
 *
 * 없는 리포트 · 남의 리포트 · UUID 가 아닌 값은 모두 404 `REPORT_NOT_FOUND` 입니다.
 */
export function getReportStatus(reportId: string) {
  return api.get<ReportStatusResponse>(reportStatusPath(reportId))
}

/**
 * 상태 조회를 불러도 되는지 봅니다.
 *
 * 상태 조회 경로는 `reports` 도메인이고, 등록과 소켓은 `interviews` 도메인을 따릅니다(`reportSocket.ts`).
 * 둘이 갈리면 **실제 reportId 로 목업 상태를 묻는** 반쪽 상태가 됩니다 — 목업은 그 id 를 몰라서 404 를 주고,
 * 화면은 기억한 id 가 틀렸다고 오해합니다. 그래서 둘이 같은 쪽(둘 다 실제 · 둘 다 목업)일 때만 부르고,
 * 아니면 콘솔에 설정을 알려주고 소켓만으로 기다립니다(상태 조회가 생기기 전과 같은 동작).
 *
 * 실제로 붙일 때는 `VITE_REAL_APIS` 에 `interviews` 와 `reports` 를 같이 켭니다. 리포트 **상세** 조회는
 * 백엔드에 아직 없어서 `reports` 를 켜도 목업이 답합니다(`missingInBackend`, #78).
 */
export function canCheckReportStatus(sessionId: string, reportId: string): boolean {
  const same = isRealApi(reportRequestPath(sessionId)) === isRealApi(reportStatusPath(reportId))
  if (!same) {
    console.warn(
      '리포트 상태 조회를 건너뜁니다 — 분석 등록(interviews)과 상태 조회(reports)가 한쪽만 실제 서버입니다. VITE_REAL_APIS 에 둘을 같이 켜주세요.',
    )
  }
  return same
}
