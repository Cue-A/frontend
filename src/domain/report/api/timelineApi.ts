import { api } from '@/shared/api/apiClient'

import type { ReportTimeline, TimelineAxis, TimelineAxisStatus, TimelineEvidence } from '../types/timeline'

import './timelineMock'

/** 서버 응답 모양입니다. (Cue-A/backend#90 `ReportTimelineResponse`) 화면이 쓰지 않는 회복력 · 재시도 상태는 뺐습니다 */
export type ReportTimelineResponse = {
  reportId: string
  status: 'COMPLETED' | 'PARTIAL'
  /** AI 값 그대로(`ok` · `failed` · `skipped`). 축이 빠졌으면 null */
  axes: Record<TimelineAxis, string | null> | null
  questions: {
    questionId: string
    questionNumber: number
    questionText: string | null
    durationSec: number | null
    hadReask: boolean
    evidence: {
      axis: string
      questionId: string
      isReask: boolean
      tStart: number | null
      tEnd: number | null
      kind: string
      label: string | null
      comment: string | null
    }[]
  }[]
}

const AXES: TimelineAxis[] = ['content', 'speech', 'gaze']

function isAxis(value: string): value is TimelineAxis {
  return (AXES as string[]).includes(value)
}

function toStatus(value: string | null | undefined): TimelineAxisStatus | null {
  return value === 'ok' || value === 'failed' || value === 'skipped' ? value : null
}

const secondsOrNull = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null

export function toReportTimeline(response: ReportTimelineResponse): ReportTimeline {
  const axes: ReportTimeline['axes'] = {}
  for (const axis of AXES) {
    const status = toStatus(response.axes?.[axis])
    if (status) axes[axis] = status
  }

  return {
    axes,
    questions: [...(response.questions ?? [])]
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .map((question) => ({
        questionId: question.questionId,
        questionNumber: question.questionNumber,
        questionText: question.questionText?.trim() ? question.questionText : null,
        durationSec: secondsOrNull(question.durationSec),
        hadReask: question.hadReask,
        // AI 가 모르는 축 · 종류를 보내면 그 근거만 뺍니다. 마커 색과 설명을 고를 수 없습니다
        evidence: (question.evidence ?? []).flatMap((item): TimelineEvidence[] => {
          if (!isAxis(item.axis) || (item.kind !== 'strength' && item.kind !== 'weakness')) return []
          return [
            {
              axis: item.axis,
              questionId: item.questionId,
              isReask: item.isReask,
              tStart: secondsOrNull(item.tStart),
              tEnd: secondsOrNull(item.tEnd),
              kind: item.kind,
              label: item.label?.trim() || (item.kind === 'strength' ? '잘한 점' : '아쉬운 점'),
              comment: item.comment?.trim() ? item.comment : null,
            },
          ]
        }),
      })),
  }
}

/**
 * XAI 타임라인. `GET /api/reports/{reportId}/timeline` (1분에 60번) — `reports` 도메인입니다.
 *
 * 상태별 응답(202 `REPORT_NOT_READY` · 409 `REPORT_FAILED` · 404 `REPORT_NOT_FOUND`)은 상세 조회와 같습니다. 리포트 화면은
 * 상세를 그린 뒤에 부르므로 보통은 끝난 리포트만 옵니다.
 */
export async function getReportTimeline(reportId: string) {
  const response = await api.get<ReportTimelineResponse>(`/api/reports/${encodeURIComponent(reportId)}/timeline`)
  return toReportTimeline(response)
}
