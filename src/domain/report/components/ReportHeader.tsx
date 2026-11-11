import Badge from '@/shared/ui/Badge'

import { totalScoreToneClass } from '../lib/scoreTone'
import type { ReportContent } from '../types/report'

type Props = {
  /** 본인 리포트(`Report`)와 공유 링크로 연 리포트(`ReportContent`)가 같이 씁니다 */
  report: ReportContent
}

/**
 * '네이버 · 기획 직무 면접 · 2026.07.18 · 질문 4문항'
 * 회사명 · 직무는 리포트 응답에 아직 없어서 비어 오면 그 칸만 뺍니다 ('2026.07.18 · 질문 4문항').
 */
function buildMeta(report: ReportContent) {
  const parts = [
    report.companyName,
    report.jobRole && `${report.jobRole} 면접`,
    report.interviewDate,
    `질문 ${report.questionCount}문항`,
  ]

  return parts.filter(Boolean).join(' · ')
}

/** '▲ 2회차 +6점' — 첫 회차면 비교할 대상이 없어 아예 그리지 않습니다. */
function buildDelta(report: ReportContent) {
  const delta = report.totalScoreDelta
  if (!delta) return null

  const arrow = delta.diff >= 0 ? '▲' : '▼'
  const sign = delta.diff >= 0 ? '+' : ''

  return `${arrow} ${delta.fromAttempt}회차 ${sign}${delta.diff}점`
}

/**
 * 결과 리포트 제목과 종합 점수입니다. (C-01 상단)
 * 시안대로 점수는 오른쪽에 붙습니다. 좁아지면 아래로 떨어집니다.
 *
 * 결과 리포트 수정 시안(이슈 #171): 점수 판의 배경을 없애고, 점수 숫자를 구간별 색으로 칠합니다(`lib/scoreTone.ts`).
 * 이전 회차 대비 변화는 점수 색과 헷갈리지 않게 연한 배경의 배지로 둡니다 — 22점(빨강) 아래에 초록 글자 "+6점" 이 붙으면
 * 어느 색이 무엇을 뜻하는지 읽기 어렵습니다.
 */
export default function ReportHeader({ report }: Props) {
  const delta = buildDelta(report)
  const isUp = (report.totalScoreDelta?.diff ?? 0) >= 0

  return (
    <header className="flex flex-wrap items-start justify-between gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-neutral-900">결과 리포트</h1>
        <p className="text-body-md text-neutral-500">{buildMeta(report)}</p>
      </div>

      {/* 총점이 없으면 통째로 뺍니다. 0점이나 빈 칸으로 두면 실제로 그 점수를 받은 것처럼 읽힙니다 (PR #118 리뷰) */}
      {report.totalScore !== null && (
        <div className="flex flex-col items-end gap-1">
          <p className="text-body-sm text-neutral-500">종합 점수</p>
          <p className="flex items-baseline gap-2 tabular-nums">
            <span className={`text-display ${totalScoreToneClass(report.totalScore)}`}>{report.totalScore}</span>
            <span className="text-body-md text-neutral-500">/ 100</span>
          </p>
          {delta && (
            <span className="tabular-nums">
              <Badge tone={isUp ? 'success' : 'danger'}>{delta}</Badge>
            </span>
          )}
        </div>
      )}
    </header>
  )
}
