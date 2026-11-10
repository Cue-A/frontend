import { registerMock } from '@/shared/api/mock'

import { mockReportDetail } from './reportMock'
import type { ReportDetailResponse } from './reportResponse'
import type { ReportTimelineResponse } from './timelineApi'

/**
 * XAI 타임라인 목업입니다. 백엔드 `ReportTimelineResponse`(#90)처럼 **상세 응답의 축별 근거를 원 질문별로 묶어** 만듭니다.
 * 그래서 리포트 목업의 회차마다 근거 · 축 상태가 상세와 같습니다. 실패한 축을 다시 분석해 살아나면 그 근거도 같이 생깁니다.
 */

const AXES = ['content', 'speech', 'gaze'] as const

/** 상세 응답의 축별 근거를 원 질문별로 묶습니다. 공개 리포트 목업(`reportShareMock.ts`)도 같은 걸 씁니다 */
export function mockTimelineOf(detail: ReportDetailResponse): ReportTimelineResponse {
  const questions = [...detail.questions].sort((a, b) => a.questionNumber - b.questionNumber)

  return {
    reportId: detail.reportId,
    status: detail.status === 'PARTIAL' ? 'PARTIAL' : 'COMPLETED',
    axes: {
      content: detail.axes.content?.status ?? null,
      speech: detail.axes.speech?.status ?? null,
      gaze: detail.axes.gaze?.status ?? null,
    },
    questions: questions.map((question) => ({
      questionId: question.questionId,
      questionNumber: question.questionNumber,
      questionText: question.questionText,
      durationSec: question.durationSec,
      hadReask: question.hadReask,
      evidence: AXES.flatMap((axis) =>
        (detail.axes[axis]?.evidence ?? [])
          .filter((item) => item.questionId === question.questionId)
          .map((item) => ({
            axis,
            questionId: item.questionId,
            isReask: false,
            tStart: item.tStart,
            tEnd: item.tEnd,
            kind: item.kind,
            label: item.label,
            comment: item.comment,
          })),
      ).sort((a, b) => (a.tStart ?? 0) - (b.tStart ?? 0)),
    })),
  }
}

registerMock('GET', '/api/reports/:reportId/timeline', ({ reportId }): ReportTimelineResponse =>
  mockTimelineOf(mockReportDetail(reportId)),
)
