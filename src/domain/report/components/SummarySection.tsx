import Badge from '@/shared/ui/Badge'
import Card from '@/shared/ui/Card'

import type { ReportSummary } from '../types/report'

/** 면접 흐름의 상태 라벨 색입니다. 모르는 값이면 회색으로 떨어뜨립니다. */
const STATUS_TONE: Record<string, 'success' | 'info' | 'warning'> = {
  안정: 'success',
  보통: 'info',
  흔들림: 'warning',
}

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
    <Card label="이번 면접 요약" padding="lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-h2 text-neutral-900">이번 면접 요약</h2>
          <p className="text-body-sm text-neutral-500">{subtitle}</p>
        </div>

        <p className="rounded-sm bg-primary-100 p-5 text-body-md text-neutral-900">
          {summary.verdict}
        </p>

        {summary.overview.length > 0 && (
          <dl className="flex flex-wrap">
            {summary.overview.map((fact) => (
              <div key={fact.key} className="min-w-40 flex-1 rounded-sm bg-neutral-50 p-4">
                <dt className="text-body-sm text-neutral-500">{fact.label}</dt>
                <dd className="text-body-lg tabular-nums text-neutral-900">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {summary.turns.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-body-lg text-neutral-900">면접 흐름</h3>

            <ul className="flex flex-col">
              {summary.turns.map((turn) => (
                <li
                  key={turn.turnId}
                  className="flex items-start gap-4 border-b border-neutral-200 p-4 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-body-lg text-neutral-900">{turn.title}</p>
                    <p className="text-body-sm text-neutral-500">{turn.comment}</p>
                  </div>

                  <Badge tone={STATUS_TONE[turn.status] ?? 'neutral'}>{turn.status}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {summary.strengths.length > 0 && (
            <div className="min-w-64 flex-1 rounded-sm bg-badge-success-bg p-5">
              <h3 className="text-body-lg text-badge-success-text">잘한 점</h3>
              <ul className="mt-2 flex flex-col gap-1 text-body-md text-neutral-700">
                {summary.strengths.map((item) => (
                  <li key={item.text}>{item.text}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.weaknesses.length > 0 && (
            <div className="min-w-64 flex-1 rounded-sm bg-badge-warning-bg p-5">
              <h3 className="text-body-lg text-badge-warning-text">아쉬운 점</h3>
              <ul className="mt-2 flex flex-col gap-1 text-body-md text-neutral-700">
                {summary.weaknesses.map((item) => (
                  <li key={item.text}>{item.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
