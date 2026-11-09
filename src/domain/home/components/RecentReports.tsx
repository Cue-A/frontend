import { IconChevronRight } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { ROUTES, toReport } from '@/app/routes'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import { initialOf } from '@/shared/lib/initialOf'
import Card from '@/shared/ui/Card'

import { formatDotDate } from '../lib/homeDate'
import { scoreTone } from '../lib/homeDisplay'
import type { RecentReport } from '../types/home'

import CardLink from './CardLink'
import SkeletonBlock from './SkeletonBlock'

const ROW_CLASS = 'flex items-center gap-4 rounded-lg bg-neutral-0/80 px-5 py-4'

/**
 * 한 줄. 서버가 면접 종류 · 걸린 시간을 주지 않아서 왼쪽 네모에는 제목(기업, 없으면 직무) 첫 글자를 쓰고,
 * 아랫줄은 날짜 · 문항 수만 적습니다.
 */
function ReportRow({ report }: { report: RecentReport }) {
  return (
    <Link to={toReport(report.reportId)} className={`${ROW_CLASS} transition-colors hover:bg-neutral-0`}>
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-badge-brand-bg text-body-sm font-bold text-badge-brand-text"
      >
        {initialOf(report.title)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-lg text-neutral-900">{report.title}</span>
        <span className="block text-body-sm text-neutral-500">
          {formatDotDate(report.practicedOn)} · 질문 {report.questionCount}개{report.partial && ' · 일부 항목 빠짐'}
        </span>
      </span>

      {report.score === null ? (
        <Badge>점수 없음</Badge>
      ) : (
        <Badge tone={scoreTone(report.score)}>{report.score}점</Badge>
      )}
      <IconChevronRight size={18} stroke={2} aria-hidden className="shrink-0 text-neutral-400" />
    </Link>
  )
}

type Props = {
  /** null 이면 불러오는 중 */
  reports: RecentReport[] | null
  /** 이 칸만 못 불러왔을 때 다시 받기. 있으면 목록 대신 안내를 그립니다 */
  onRetry?: () => void
}

/**
 * 최근 리포트 요약. 시안대로 카드 하나가 아니라 줄마다 판이 따로 있습니다.
 * 줄을 누르면 그 리포트(C-01)로 갑니다. "전체보기" 는 보관함 > 연습 기록으로 갑니다 (이슈 #142).
 */
export default function RecentReports({ reports, onRetry }: Props) {
  return (
    <section aria-labelledby="home-recent-reports" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="home-recent-reports" className="text-h2 text-neutral-900">
          최근 리포트 요약
        </h2>
        <CardLink label="전체보기" to={ROUTES.LIBRARY_PRACTICE} />
      </div>

      {onRetry ? (
        <Card padding="lg">
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-body-lg text-neutral-900">최근 리포트를 불러오지 못했어요</p>
            <Button size="sm" onClick={onRetry} className="mt-2">
              다시 불러오기
            </Button>
          </div>
        </Card>
      ) : reports === null ? (
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
