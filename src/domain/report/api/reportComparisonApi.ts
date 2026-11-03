import { api } from '@/shared/api/apiClient'

import type { ComparisonAxis, QuestionChange, RoundComparison } from '../types/comparison'

import './reportComparisonMock'

/**
 * 회차 비교 · 성장 추이 응답입니다. (Cue-A/backend#104 `ReportComparisonResponse`)
 */
type AxisScores = Partial<Record<ComparisonAxis, number | null>>

/**
 * 서버 응답 모양입니다. 명세 예시보다 **느슨하게** 받습니다 (이슈 #140).
 *
 * AI 응답 모양이 아직 "AI 파트 확인 필요" 상태라, 값이 빠지거나(undefined) 통째로 null 로 오는 칸이 있을 수 있습니다.
 * 특히 명세 필드표의 `trend.axes` 는 "실패 · 미사용 축은 null" 이라, 배열 안의 값이 null 인지 **배열 자체가 null** 인지가
 * 정해지지 않았습니다(시선을 한 번도 안 쓴 면접). 그래서 `?` · `| null` 을 붙여 두고 변환(`toRoundComparison`)에서 한 번
 * 정리합니다. 화면은 정리된 `RoundComparison` 만 보므로 이런 경우를 따로 신경 쓰지 않습니다.
 */
export type ReportComparisonResponse = {
  reportId: string
  latestRound: number
  /** 비교한 회차 번호, 오름차순. 아래 배열들은 모두 이 순서입니다 */
  comparedRounds?: number[] | null
  partialRounds?: number[] | null
  rounds?: Array<{ round: number; reportId: string; status: 'COMPLETED' | 'PARTIAL'; createdAt: string }> | null
  vsPrevious?: {
    /** 비교 대상 직전 회차. `latestRound - 1` 이 아닙니다 */
    fromRound?: number | null
    /** 기준 회차(이 리포트) */
    toRound?: number | null
    overallDelta?: number | null
    axisDelta?: AxisScores | null
    improved?: string[] | null
    declined?: string[] | null
    unchanged?: string[] | null
    comment?: string | null
  } | null
  trend?: {
    overall?: Array<number | null> | null
    axes?: Partial<Record<ComparisonAxis, Array<number | null> | null>> | null
    comment?: string | null
    stalledAxes?: ComparisonAxis[] | null
    bestRound?: number | null
  } | null
  /** 문항별 변화. 리포트 화면 「회차 비교」 섹션이 씁니다 (이슈 #157) */
  byQuestion?: Array<{
    questionId?: string | null
    questionText?: string | null
    category?: string | null
    scores?: Array<number | null> | null
    deltaFromPrevious?: number | null
    deltaFromFirst?: number | null
    comment?: string | null
  }> | null
}

const textOrNull = (value: string | null | undefined) => (value && value.trim() ? value : null)

/** 숫자가 아니면(undefined · null · NaN) null — 화면이 "비교 불가" 로 그립니다. 그대로 두면 "▼NaN" 이 됩니다 */
const numberOrNull = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

/** 문항별 변화를 화면 값으로 바꿉니다. 문항 id 가 없는 줄은 짝을 맞출 수 없어 뺍니다 */
function toQuestionChanges(response: ReportComparisonResponse, roundCount: number): QuestionChange[] {
  return (response.byQuestion ?? []).flatMap((item) => {
    if (!item.questionId) return []
    // 점수는 회차 수만큼 맞춥니다. 모자라면 null, 넘치면 버려서 화면이 회차와 짝을 맞출 수 있게 합니다
    const scores = Array.from({ length: roundCount }, (_, index) => numberOrNull(item.scores?.[index]))
    return [
      {
        questionId: item.questionId,
        questionText: textOrNull(item.questionText),
        category: textOrNull(item.category),
        scores,
        deltaFromPrevious: numberOrNull(item.deltaFromPrevious),
        deltaFromFirst: numberOrNull(item.deltaFromFirst),
        comment: textOrNull(item.comment),
      },
    ]
  })
}

export function toRoundComparison(response: ReportComparisonResponse): RoundComparison {
  const comparedRounds = response.comparedRounds ?? []
  const trend = response.trend ?? {}
  const axes = trend.axes ?? {}
  const partial = new Set(response.partialRounds ?? [])
  const roundInfo = response.rounds ?? []

  // 축 배열 자체가 null(그 축을 한 번도 못 잰 면접)이어도, 배열 안 값이 null 이어도 같은 null 로 봅니다
  const axisScore = (axis: ComparisonAxis, index: number) => numberOrNull(axes[axis]?.[index])

  const rounds = comparedRounds.map((round, index) => {
    // 회차 번호로 찾습니다. `rounds` 도 같은 순서라고 되어 있지만, 번호로 짝을 맞춰 두면 순서가 어긋나도 안전합니다
    const info = roundInfo.find((item) => item.round === round)
    return {
      round,
      // 못 찾으면 null — 화면이 링크 없이 막대만 그립니다. 빈 글자로 두면 `/reports/` 로 가는 깨진 링크가 됩니다
      reportId: info?.reportId || null,
      partial: partial.has(round) || info?.status === 'PARTIAL',
      startedAt: info?.createdAt ?? null,
      overall: numberOrNull(trend.overall?.[index]),
      axes: {
        content: axisScore('content', index),
        speech: axisScore('speech', index),
        gaze: axisScore('gaze', index),
      },
    }
  })

  const vs = response.vsPrevious
  const axisDelta = vs?.axisDelta ?? {}
  return {
    reportId: response.reportId,
    latestRound: response.latestRound,
    rounds,
    previous:
      vs && comparedRounds.length >= 2
        ? {
            // 백엔드가 주는 값을 먼저 씁니다. 없으면 비교한 회차 중 끝에서 두 번째로 셉니다
            previousRound: numberOrNull(vs.fromRound) ?? comparedRounds[comparedRounds.length - 2],
            currentRound: numberOrNull(vs.toRound) ?? comparedRounds[comparedRounds.length - 1],
            overallDelta: numberOrNull(vs.overallDelta),
            axisDelta: {
              content: numberOrNull(axisDelta.content),
              speech: numberOrNull(axisDelta.speech),
              gaze: numberOrNull(axisDelta.gaze),
            },
            improvedCount: vs.improved?.length ?? 0,
            declinedCount: vs.declined?.length ?? 0,
            unchangedCount: vs.unchanged?.length ?? 0,
            comment: textOrNull(vs.comment),
          }
        : null,
    trendComment: textOrNull(trend.comment),
    bestRound: numberOrNull(trend.bestRound),
    stalledAxes: trend.stalledAxes ?? [],
    questions: toQuestionChanges(response, comparedRounds.length),
  }
}

/**
 * 같은 면접을 다시 본 회차들(1회차 + 재면접)을 이 리포트의 회차까지 비교합니다. `GET /api/reports/{reportId}/comparison`
 *
 * 결과를 저장하지 않고 부를 때마다 AI 가 계산해서 **몇 초 걸릴 수 있고**, 60초에 10회까지입니다. 화면은 이 응답을
 * 기다리는 동안 다른 내용을 막지 말고, 같은 리포트로 거듭 부르지 마세요 (`useReportComparison` 이 리포트별로 들고 있습니다).
 *
 * 1회차 리포트에서 부르면 뒤에 재연습이 있어도 1회차까지만 옵니다 — "이 리포트의 회차까지" 비교입니다. 재연습 이력이 없는
 * 리포트도 200 이고 `comparedRounds` 가 하나입니다.
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
