import { api } from '@/shared/api/apiClient'

import type { ComparisonAxis, RoundComparison } from '../types/comparison'

import './reportComparisonMock'

/**
 * 회차 비교 · 성장 추이 응답입니다. (API 명세서 v0.2 「회차 비교·성장 추이 조회」)
 *
 * ⚠️ **백엔드에 아직 없는 API 입니다.** 명세는 있지만 "시작 전" 이고, AI 파트 확인(응답 모양 · 질문 ID 기준 · 응답 시간)이
 * 남아 있어 바뀔 수 있습니다. 목업(`missingInBackend`)이 답합니다.
 */
type AxisScores = Record<ComparisonAxis, number | null>

export type ReportComparisonResponse = {
  reportId: string
  latestRound: number
  /** 비교한 회차 번호, 오름차순. 아래 배열들은 모두 이 순서입니다 */
  comparedRounds: number[]
  partialRounds: number[]
  rounds: Array<{ round: number; reportId: string; status: 'COMPLETED' | 'PARTIAL'; createdAt: string }>
  vsPrevious: {
    overallDelta: number | null
    axisDelta: AxisScores
    improved: string[]
    declined: string[]
    unchanged: string[]
    comment: string
  } | null
  trend: {
    overall: Array<number | null>
    axes: Record<ComparisonAxis, Array<number | null>>
    comment: string
    stalledAxes: ComparisonAxis[]
    bestRound: number
  }
  /** 문항별 변화. 성장 관리 화면은 쓰지 않습니다 — 리포트 화면 「회차 비교」 섹션을 만들 때 옮겨 담습니다 */
  byQuestion: unknown[]
}

const textOrNull = (value: string | null | undefined) => (value && value.trim() ? value : null)

export function toRoundComparison(response: ReportComparisonResponse): RoundComparison {
  const { comparedRounds, trend } = response
  const partial = new Set(response.partialRounds)

  const rounds = comparedRounds.map((round, index) => {
    // 회차 번호로 찾습니다. `rounds` 도 같은 순서라고 되어 있지만, 번호로 짝을 맞춰 두면 순서가 어긋나도 안전합니다
    const info = response.rounds.find((item) => item.round === round)
    return {
      round,
      reportId: info?.reportId ?? '',
      partial: partial.has(round) || info?.status === 'PARTIAL',
      startedAt: info?.createdAt ?? '',
      overall: trend.overall[index] ?? null,
      axes: {
        content: trend.axes.content[index] ?? null,
        speech: trend.axes.speech[index] ?? null,
        gaze: trend.axes.gaze[index] ?? null,
      },
    }
  })

  const vs = response.vsPrevious
  return {
    reportId: response.reportId,
    latestRound: response.latestRound,
    rounds,
    previous:
      vs && comparedRounds.length >= 2
        ? {
            previousRound: comparedRounds[comparedRounds.length - 2],
            overallDelta: vs.overallDelta,
            axisDelta: vs.axisDelta,
            improvedCount: vs.improved.length,
            declinedCount: vs.declined.length,
            unchangedCount: vs.unchanged.length,
            comment: textOrNull(vs.comment),
          }
        : null,
    trendComment: textOrNull(trend.comment),
    bestRound: trend.bestRound ?? null,
    stalledAxes: trend.stalledAxes ?? [],
  }
}

/**
 * 같은 면접을 다시 본 회차들(1회차 + 재면접)을 이 리포트의 회차까지 비교합니다. `GET /api/reports/{reportId}/comparison`
 *
 * 결과를 저장하지 않고 부를 때마다 AI 가 계산해서 **몇 초 걸릴 수 있고**, 60초에 10회까지입니다. 화면은 이 응답을
 * 기다리는 동안 다른 내용을 막지 말고, 같은 리포트로 거듭 부르지 마세요.
 *
 * 실패
 * - 202 `REPORT_NOT_READY` — 아직 분석 중인 리포트 / 409 `REPORT_FAILED` — 만들지 못한 리포트
 * - 404 `REPORT_NOT_FOUND` — 없는 리포트 · 남의 리포트 · id 형식 오류
 * - 429 `RATE_LIMIT_EXCEEDED`
 * - 502 `UNEXPECTED_AI_RESPONSE` · 503 `AI_UNAVAILABLE` · 504 `AI_TIMEOUT`
 */
export async function getReportComparison(reportId: string) {
  const response = await api.get<ReportComparisonResponse>(`/api/reports/${encodeURIComponent(reportId)}/comparison`)
  return toRoundComparison(response)
}
