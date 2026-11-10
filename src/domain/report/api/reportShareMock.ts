import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import { MOCK_FAILED_REPORT, MOCK_REPORT_IDS, mockReportDetail, setMockShare } from './reportMock'
import type { ReportShareResponse } from './reportResponse'
import type { PublicReportResponse } from './sharedReportApi'
import { mockTimelineOf } from './timelineMock'

/**
 * 리포트 공유 링크 목업입니다 — 만들기 · 해제 · 공개 조회 (이슈 #199 · Cue-A/backend#137).
 *
 * 실제 서버처럼 움직입니다.
 * - 이미 공유 중이면 같은 링크, 해제한 뒤 다시 만들면 새 링크
 * - 해제한 링크 · 예전 링크 · 모르는 링크는 404 `SHARED_REPORT_NOT_FOUND`
 * - 분석이 실패한 리포트는 409 `REPORT_FAILED`
 *
 * 목업은 메모리에만 둬서 **새 탭에서는 이 탭의 공유 상태를 모릅니다.** 그래도 받은 사람 화면을 새 탭으로 열어 볼 수 있게,
 * 목업 리포트(`MOCK_REPORT_IDS`)의 링크는 `shareId` 만 보고 어느 리포트인지 찾습니다. 이 탭에서 해제했거나 다시 만든
 * 링크는 이 탭에서만 막힙니다.
 *
 * `shareId` 에 리포트 · 몇 번째 링크인지 넣는 인코딩(`shareIdOf` · `generations` · `openLinks`)은 **목업 전용**입니다.
 * 실서버의 `shareId` 는 아무 뜻 없는 UUID 입니다. 이 목업을 걷어낼 때 같이 지워 주세요 (PR #200 리뷰).
 */

const SCENARIO_IDS: string[] = Object.values(MOCK_REPORT_IDS)

/** 리포트마다 몇 번째로 만든 링크인지. 해제한 뒤 다시 만들면 늘어서 새 링크가 됩니다 */
const generations = new Map<string, number>()
/** 지금 열려 있는 링크 → 리포트. 목업 리포트가 아닌 리포트(분석 중 화면에서 만든 것)는 이걸로만 찾습니다 */
const openLinks = new Map<string, string>()

const hex = (value: number, length: number) => value.toString(16).padStart(length, '0')

/** 실제 서버처럼 UUID 모양입니다. 목업 리포트면 뒤 12자리에 몇 번째 리포트 · 몇 번째 링크인지 넣어 새 탭에서도 찾게 합니다 */
function shareIdOf(reportId: string, generation: number) {
  const index = SCENARIO_IDS.indexOf(reportId)
  const tail =
    index >= 0 ? `${hex(generation, 8)}${hex(index, 4)}` : hex(Math.floor(Math.random() * 0xffffffffffff), 12)
  return `5a7e1d40-3c2b-4f9e-8a61-${tail}`
}

function reportIdOfShare(shareId: string): string | null {
  const open = openLinks.get(shareId)
  if (open) return open

  const match = /^5a7e1d40-3c2b-4f9e-8a61-([0-9a-f]{8})([0-9a-f]{4})$/.exec(shareId)
  if (!match) return null
  const reportId = SCENARIO_IDS[parseInt(match[2], 16)]
  // 이 탭에서 한 번이라도 다룬 리포트면 지금 열린 링크(`openLinks`)에 없는 것은 해제됐거나 예전 링크입니다
  if (!reportId || generations.has(reportId)) return null
  return reportId
}

function notFound(): never {
  throw new ApiError('SHARED_REPORT_NOT_FOUND', '공유가 해제됐거나 없는 링크입니다')
}

registerMock('POST', '/api/reports/:reportId/share', ({ reportId }): ReportShareResponse => {
  if (reportId === MOCK_FAILED_REPORT.reportId) {
    throw new ApiError('REPORT_FAILED', '리포트 생성에 실패했습니다')
  }

  const current = mockReportDetail(reportId).share
  if (current) return current

  const generation = (generations.get(reportId) ?? 0) + 1
  generations.set(reportId, generation)
  const share = { shareId: shareIdOf(reportId, generation), sharedAt: new Date().toISOString() }
  setMockShare(reportId, share)
  openLinks.set(share.shareId, reportId)
  return share
})

registerMock('DELETE', '/api/reports/:reportId/share', ({ reportId }) => {
  const current = mockReportDetail(reportId).share
  if (current) openLinks.delete(current.shareId)
  // 공유하지 않은 리포트를 해제해도 오류가 아닙니다. 다시 만들면 새 링크가 나오도록 몇 번째인지는 남깁니다
  generations.set(reportId, generations.get(reportId) ?? 0)
  setMockShare(reportId, null)
  return null
})

registerMock('GET', '/api/public/reports/:shareId', ({ shareId }): PublicReportResponse => {
  const reportId = reportIdOfShare(shareId)
  if (!reportId || reportId === MOCK_FAILED_REPORT.reportId) notFound()

  // 본인 전용 값(reportId · sessionId · retry · share)은 넣지 않고, 타임라인 · 개선 답변을 한 응답에 담습니다
  const detail = mockReportDetail(reportId)
  return {
    status: detail.status,
    overall: detail.overall,
    summary: detail.summary,
    axes: detail.axes,
    questions: detail.questions,
    resilience: detail.resilience,
    companyComment: detail.companyComment,
    timeline: mockTimelineOf(detail).questions,
    improvedAnswers: detail.improvedAnswers,
    generatedAt: detail.generatedAt,
    createdAt: detail.createdAt,
    completedAt: detail.completedAt,
  }
})
