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
 * `border` 는 토큰이 dev 에 들어오기 전까지 쓰는 임시값입니다.
 */
export default function ScoreSection({ metrics, subMetrics, comment }: Props) {
  return (
    <section aria-label="세부 점수" className="flex flex-col gap-6 border p-6">
      <div className="flex flex-col gap-1">
        <h2>세부 점수</h2>
        {comment && <p>{comment}</p>}
      </div>

      <ul className="flex flex-col gap-3">
        {metrics.map((metric) => (
          <li key={metric.key} className="flex items-center gap-4">
            <span className="w-24 shrink-0">{metric.label}</span>

            <div className="h-2 min-w-0 flex-1 border">
              {metric.score !== null && (
                <div className="h-full bg-current" style={{ width: `${metric.score}%` }} />
              )}
            </div>

            {metric.score === null ? (
              <span className="w-24 shrink-0 text-right">{metric.unavailableLabel ?? '—'}</span>
            ) : (
              <span className="w-24 shrink-0 text-right tabular-nums">{metric.score} / 100</span>
            )}
          </li>
        ))}
      </ul>

      {subMetrics.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {subMetrics.map((sub) => (
            <div key={sub.key} className="flex min-w-64 flex-1 flex-col gap-2 border p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3>{sub.label}</h3>
                <span className="tabular-nums">{sub.value}</span>
              </div>

              <p>{sub.description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
