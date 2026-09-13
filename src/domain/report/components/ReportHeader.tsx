import Card from '@/shared/ui/Card'

import type { Report } from '../types/report'

type Props = {
  report: Report
}

/** '네이버 · 기획 직무 면접 · 2026.07.18 · 질문 4문항' */
function buildMeta(report: Report) {
  const parts = [
    report.companyName,
    `${report.jobRole} 면접`,
    report.interviewDate,
    `질문 ${report.questionCount}문항`,
  ]

  return parts.filter(Boolean).join(' · ')
}

/** '▲ 2회차 +6점' — 첫 회차면 비교할 대상이 없어 아예 그리지 않습니다. */
function buildDelta(report: Report) {
  const delta = report.totalScoreDelta
  if (!delta) return null

  const arrow = delta.diff >= 0 ? '▲' : '▼'
  const sign = delta.diff >= 0 ? '+' : ''

  return `${arrow} ${delta.fromAttempt}회차 ${sign}${delta.diff}점`
}

/**
 * 리포트 제목과 종합 점수 카드입니다. (C-01 상단)
 * 시안대로 점수는 오른쪽에 붙습니다. 좁아지면 아래로 떨어집니다.
 */
export default function ReportHeader({ report }: Props) {
  const delta = buildDelta(report)
  const isUp = (report.totalScoreDelta?.diff ?? 0) >= 0

  return (
    <header className="flex flex-wrap items-start justify-between gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-neutral-900">리포트</h1>
        <p className="text-body-md text-neutral-500">{buildMeta(report)}</p>
      </div>

      <Card padding="md" className="w-64 bg-primary-100">
        <div className="flex flex-col gap-2">
          <p className="text-body-sm text-neutral-700">종합 점수</p>

          <p className="flex items-baseline gap-2 tabular-nums">
            <span className="text-display text-primary-600">{report.totalScore}</span>
            <span className="text-body-md text-neutral-500">/ 100</span>
          </p>

          {delta && (
            <p
              className={`text-body-sm font-semibold tabular-nums ${
                isUp ? 'text-semantic-success' : 'text-semantic-danger'
              }`}
            >
              {delta}
            </p>
          )}
        </div>
      </Card>
    </header>
  )
}
