import Card from '@/shared/ui/Card'

import type { ScoreMetric, SubMetric } from '../types/report'

type Props = {
  metrics: ScoreMetric[]
  subMetrics: SubMetric[]
  comment: string | null
}

/**
 * 세부 점수와 보조 지표입니다. (C-01 "세부 점수")
 *
 * 점수가 null 인 항목은 막대를 비우고 사유를 보여줍니다. 시선 분석은 실제로
 * 자주 실패하는데, 0점으로 그리면 "못했다"로 읽혀서 사실과 달라집니다.
 *
 * 막대 너비는 계산값이라 인라인 style 을 씁니다.
 * (docs/01-conventions.md "스타일" 절)
 */
export default function ScoreSection({ metrics, subMetrics, comment }: Props) {
  return (
    <Card label="세부 점수" padding="lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-h2 text-neutral-900">세부 점수</h2>
          {comment && <p className="text-body-md text-neutral-500">{comment}</p>}
        </div>

        <ul className="flex flex-col gap-3">
          {metrics.map((metric) => (
            <li key={metric.key} className="flex items-center gap-4">
              <span className="w-24 shrink-0 text-body-md text-neutral-700">{metric.label}</span>

              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-xs bg-neutral-200">
                {metric.score !== null && (
                  <div
                    className="h-full rounded-xs bg-primary-500"
                    style={{ width: `${metric.score}%` }}
                  />
                )}
              </div>

              {metric.score === null ? (
                <span className="w-24 shrink-0 text-right text-body-sm text-neutral-400">
                  {metric.unavailableLabel ?? '—'}
                </span>
              ) : (
                <span className="w-24 shrink-0 text-right text-stat tabular-nums text-neutral-900">
                  {metric.score} <span className="text-body-sm text-neutral-400">/ 100</span>
                </span>
              )}
            </li>
          ))}
        </ul>

        {subMetrics.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {subMetrics.map((sub) => (
              <div
                key={sub.key}
                className="flex min-w-64 flex-1 flex-col gap-2 rounded-sm bg-neutral-50 p-5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-body-lg text-neutral-900">{sub.label}</h3>
                  <span className="text-stat tabular-nums text-primary-600">{sub.value}</span>
                </div>

                <p className="text-body-sm text-neutral-500">{sub.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
