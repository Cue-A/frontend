import { IconChevronRight } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { ROUTES, toReport } from '@/app/routes'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { formatDotDate } from '../lib/homeDate'
import { INTERVIEW_KIND_DISPLAY, scoreTone } from '../lib/homeDisplay'
import type { RecentReport } from '../types/home'

import ComingSoonLink from './ComingSoonLink'
import SkeletonBlock from './SkeletonBlock'

/** 왼쪽 네모 아이콘 색. 배지 토큰의 배경 · 글자 짝을 그대로 씁니다 (docs/design-system.md §2.4) */
const KIND_CLASS = {
  brand: 'bg-badge-brand-bg text-badge-brand-text',
  info: 'bg-badge-info-bg text-badge-info-text',
  warning: 'bg-badge-warning-bg text-badge-warning-text',
  success: 'bg-badge-success-bg text-badge-success-text',
  danger: 'bg-badge-danger-bg text-badge-danger-text',
  neutral: 'bg-neutral-50 text-neutral-700',
} as const

const ROW_CLASS = 'flex items-center gap-4 rounded-lg bg-neutral-0 px-5 py-4 shadow-card'

function ReportRow({ report }: { report: RecentReport }) {
  const kind = INTERVIEW_KIND_DISPLAY[report.kind]
  const minutes = Math.max(1, Math.round(report.durationSec / 60))

  return (
    <Link to={toReport(report.reportId)} className={`${ROW_CLASS} transition-shadow hover:shadow-float`}>
      <span
        aria-hidden
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-body-sm font-bold ${KIND_CLASS[kind.tone]}`}
      >
        {kind.short}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-lg text-neutral-900">{report.title}</span>
        <span className="block text-body-sm text-neutral-500">
          {formatDotDate(report.practicedOn)} · 질문 {report.questionCount}개 · {minutes}분
        </span>
      </span>

      <Badge tone={scoreTone(report.score)}>{report.score}점</Badge>
      <IconChevronRight size={18} stroke={2} aria-hidden className="shrink-0 text-neutral-400" />
    </Link>
  )
}

type Props = {
  /** null 이면 불러오는 중 */
  reports: RecentReport[] | null
}

/**
 * 최근 리포트 요약. 시안대로 카드 하나가 아니라 줄마다 판이 따로 있습니다.
 * 줄을 누르면 그 리포트(C-01)로 갑니다. 전체 목록 화면(보관함 > 연습 기록)은 아직 없습니다.
 */
export default function RecentReports({ reports }: Props) {
  return (
    <section aria-labelledby="home-recent-reports" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="home-recent-reports" className="text-h2 text-neutral-900">
          최근 리포트 요약
        </h2>
        <ComingSoonLink label="전체보기" />
      </div>

      {reports === null ? (
        <ul aria-busy className="flex flex-col gap-3">
          {[0, 1, 2].map((index) => (
            <li key={index} className={ROW_CLASS}>
              <SkeletonBlock className="h-10 w-10" />
              <span className="flex flex-1 flex-col gap-2">
                <SkeletonBlock className="h-5 w-48" />
                <SkeletonBlock className="h-4 w-36" />
              </span>
            </li>
          ))}
        </ul>
      ) : reports.length === 0 ? (
        <Card padding="lg">
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-body-lg text-neutral-900">아직 리포트가 없어요</p>
            <p className="text-body-sm text-neutral-500">면접을 한 번 마치면 여기에 요약이 쌓여요</p>
            <Button variant="primary" size="sm" to={ROUTES.SESSION_SETUP} className="mt-2">
              면접 연습 시작하기
            </Button>
          </div>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((report) => (
            <li key={report.reportId}>
              <ReportRow report={report} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
