import type { ReportSummary } from '../types/report'

type Props = {
  summary: ReportSummary
  /** 소제목에 쓰는 '기획 직무 · 2026.07.18' */
  subtitle: string
}

/**
 * 이번 면접 요약입니다. (C-01 "이번 면접 요약")
 * 한 줄 총평 → 면접 개요 → 면접 흐름 → 잘한 점 / 아쉬운 점 순서입니다.
 */
export default function SummarySection({ summary, subtitle }: Props) {
  return (
    <section aria-label="이번 면접 요약" className="flex flex-col gap-6 border p-6">
      <div className="flex flex-col gap-1">
        <h2>이번 면접 요약</h2>
        <p>{subtitle}</p>
      </div>

      <p className="border p-5">{summary.verdict}</p>

      {summary.overview.length > 0 && (
        <dl className="flex flex-wrap">
          {summary.overview.map((fact) => (
            <div key={fact.key} className="min-w-40 flex-1 border p-4">
              <dt>{fact.label}</dt>
              <dd className="tabular-nums">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {summary.turns.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3>면접 흐름</h3>

          <ul className="flex flex-col">
            {summary.turns.map((turn) => (
              <li key={turn.turnId} className="flex items-start gap-4 border p-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p>{turn.title}</p>
                  <p>{turn.comment}</p>
                </div>

                <span className="shrink-0">{turn.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {summary.strengths.length > 0 && (
          <div className="min-w-64 flex-1 border p-5">
            <h3>잘한 점</h3>
            <ul>
              {summary.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {summary.weaknesses.length > 0 && (
          <div className="min-w-64 flex-1 border p-5">
            <h3>아쉬운 점</h3>
            <ul>
              {summary.weaknesses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
