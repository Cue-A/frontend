import { api } from '@/shared/api/apiClient'

import type { RetryAxis } from '../types/report'

import './reportRetryMock'

/**
 * 부분 재시도를 등록한 직후의 응답입니다.
 *
 * ⚠️ **임시 계약입니다.** 백엔드에 이 API 가 아직 없습니다(Cue-A/backend `docs/13-report.md` "아직 없는 것" —
 * "실패한 축만 재시도. `PARTIAL` 전용. 만들지 팀 확인 필요"). 리포트 분석 등록(`ReportRequestResponse`)과 같은
 * 모양으로 두었습니다. 백엔드가 만들면 이 파일과 목업만 맞추면 됩니다.
 */
export type ReportRetryResponse = {
  reportId: string
  /** 등록 직후에는 항상 `PROCESSING` 입니다 */
  status: 'PROCESSING'
}

/**
 * 재시도 경로입니다. 소켓을 실제로 붙일지도 이 경로로 정합니다. (`reportSocket.ts` `connectRetrySocket`)
 *
 * 리포트의 하위 동작이라 `reports` 도메인에 둡니다. AI 쪽 경로는 `POST /ai/sessions/{session_id}/report/retry`
 * 이고(AI 계약 14장), 백엔드가 그 앞에서 받는 경로는 아직 정해지지 않았습니다.
 */
export const reportRetryPath = (reportId: string) =>
  `/api/reports/${encodeURIComponent(reportId)}/retry`

/**
 * 실패한 축만 다시 분석하게 맡깁니다. 결과는 기다리지 않고 바로 돌아옵니다.
 * 진행 상황과 결과는 `connectRetrySocket(reportId)` 로 받습니다.
 *
 * AI 계약(14장) 기준으로 정한 것
 * - **`PARTIAL` 리포트만** 됩니다. 내용 분석 실패(`FAILED`)는 리포트가 없어서 분석 등록부터 다시 갑니다
 * - `axes` 는 다시 계산할 축입니다. 비어 있으면 400 `INVALID_REQUEST`
 * - 요청하지 않은 축은 첫 분석 값을 다시 씁니다. 시선만 다시 하면 내용 채점(LLM)을 다시 부르지 않습니다
 * - 끝나면 리포트가 **통째로 바뀝니다** — 총점 · 상태까지 새 값입니다(`PARTIAL` → `COMPLETED` 가능)
 *
 * 축 이름은 AI 이름(`speech` · `gaze`)을 그대로 보냅니다. 백엔드 엔티티는 시선을 `score_vision` 으로 부르는데
 * (이슈 #32 5번), 어느 이름으로 받을지 정해지면 여기서 바꿉니다.
 */
export function requestAxisRetry(reportId: string, axes: RetryAxis[]) {
  return api.post<ReportRetryResponse>(reportRetryPath(reportId), { axes })
}
