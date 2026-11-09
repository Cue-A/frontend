import { api } from '@/shared/api/apiClient'

import type { ReportContent } from '../types/report'
import type { ReportTimeline } from '../types/timeline'

import { toReportContent, type ReportContentResponse } from './reportResponse'
import { toReportTimeline, type ReportTimelineResponse } from './timelineApi'

import './reportShareMock'

/**
 * 공유 링크로 연 리포트의 응답입니다 (Cue-A/backend#137 `PublicReportResponse`).
 *
 * 본인 화면에서 따로 부르던 셋(상세 · 타임라인 · 개선 답변)이 **한 응답**에 옵니다. 각 칸의 모양은 본인 응답과 같습니다.
 * 본인 전용 값(`reportId` · `sessionId` · `retry` · `share`)은 없고, 녹음 · 영상 · 회차 비교도 없습니다.
 */
export type PublicReportResponse = ReportContentResponse & {
  /** 타임라인 조회의 `questions` 와 같습니다. 축 상태는 `axes` 에 있어 따로 오지 않습니다 */
  timeline: ReportTimelineResponse['questions']
}

/** 공개 리포트 화면이 그리는 것 — 리포트 내용과 XAI 타임라인 */
export type SharedReport = {
  report: ReportContent
  timeline: ReportTimeline
}

export function toSharedReport(response: PublicReportResponse): SharedReport {
  return {
    // 남의 리포트라 다시 분석할 수 없습니다. 안내 문구에 "다시 분석할 수 있어요" 를 붙이지 않습니다
    report: toReportContent(response, { canRetry: false }),
    // 본인 화면과 같은 타임라인 변환을 씁니다. 축 상태는 따로 오지 않고 상세의 `axes` 에 있습니다
    timeline: toReportTimeline({
      axes: {
        content: response.axes.content?.status ?? null,
        speech: response.axes.speech?.status ?? null,
        gaze: response.axes.gaze?.status ?? null,
      },
      questions: response.timeline ?? [],
    }),
  }
}

/**
 * 공개 리포트 조회. `GET /api/public/reports/{shareId}` — `public` 도메인입니다 (Cue-A/backend#137).
 *
 * - **로그인 없이** 부릅니다. 백엔드가 `/api/public/` 에서는 토큰을 보지 않아서, 로그인한 사람의 토큰이 만료돼 있어도
 *   401 이 나지 않습니다(재발급 · 로그인 화면으로 튕기지 않음)
 * - 없는 · 해제된 · 형식이 틀린 링크는 모두 404 `SHARED_REPORT_NOT_FOUND`
 * - IP 기준 1분에 60번
 */
export async function getSharedReport(shareId: string) {
  const response = await api.get<PublicReportResponse>(`/api/public/reports/${encodeURIComponent(shareId)}`)
  return toSharedReport(response)
}
