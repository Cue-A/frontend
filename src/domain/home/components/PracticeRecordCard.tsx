import { IconCalendar } from '@tabler/icons-react'

import { toUserMessage } from '@/shared/api/errorMessage'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import type { UsePracticeRecordResult } from '../hooks/usePracticeRecord'
import { formatDateRange } from '../lib/homeDate'
import { practicePeriodOf } from '../lib/practicePeriod'
import type { PracticePeriod } from '../types/home'

import PeriodTabs from './PeriodTabs'
import PracticeHeatmap from './PracticeHeatmap'
import ScoreTrendChart from './ScoreTrendChart'
import SkeletonBlock from './SkeletonBlock'

type Props = {
  period: PracticePeriod
  onPeriodChange: (period: PracticePeriod) => void
  practice: UsePracticeRecordResult
}

/** 잔디 아래 작은 숫자 판 두 개 (총 연습 · 활동한 날) */
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-surface-muted px-4 py-3">
      <p className="text-body-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-h2 font-bold text-neutral-900">{value}</p>
    </div>
  )
}

/**
 * 연습 기록 카드 — 왼쪽 잔디, 오른쪽 점수 추이, 오른쪽 위 기간 탭.
 *
 * 기간 표시(`06.18 – 08.26`)는 시안에서 버튼처럼 생겼지만 날짜를 직접 고르는 기능은 시안 어디에도 정의가
 * 없어서 **보여주기만** 합니다. 기간은 탭으로만 바꿉니다.
 */
export default function PracticeRecordCard({ period, onPeriodChange, practice }: Props) {
  const { label: periodLabel } = practicePeriodOf(period)
  const { record, isStale, error, retry } = practice
  const isEmpty = record !== null && record.totalCount === 0

  return (
    <Card label="연습 기록" padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-h2 text-neutral-900">연습 기록</h2>
          <p className="mt-1 text-body-sm text-neutral-500">
            {isEmpty && !isStale
              ? '첫 연습을 마치면 여기에 기록이 쌓여요'
              : `최근 ${periodLabel}간의 연습 스트릭이에요`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PeriodTabs value={period} onChange={onPeriodChange} />
          {record && !error && (
            <span className={`inline-flex items-center gap-2 rounded-sm border border-neutral-200 px-3 py-2 text-body-sm text-neutral-700 ${isStale ? 'opacity-50' : ''}`}>
              <IconCalendar size={16} stroke={2} aria-hidden className="text-neutral-500" />
              <span className="sr-only">기간</span>
              {formatDateRange(record.startDate, record.endDate)}
            </span>
          )}
        </div>
      </div>

      {error ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-md bg-surface-muted p-8 text-center">
          <p className="text-body-md text-neutral-700">{toUserMessage(error.code)}</p>
          <Button size="sm" onClick={retry}>
            다시 불러오기
          </Button>
        </div>
      ) : record === null ? (
        <div aria-busy className="mt-6 grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <SkeletonBlock className="h-24 w-36" />
            <div className="grid grid-cols-2 gap-3">
              <SkeletonBlock className="h-16" />
              <SkeletonBlock className="h-16" />
            </div>
          </div>
          <SkeletonBlock className="h-48" />
        </div>
      ) : (
        <div
          aria-busy={isStale}
          className={`mt-6 grid gap-8 transition-opacity lg:grid-cols-[18rem_minmax(0,1fr)] ${isStale ? 'opacity-50' : ''}`}
        >
          <div className="flex flex-col gap-4">
            <PracticeHeatmap
              days={record.days}
              periodLabel={practicePeriodOf(record.period).label}
              activeDays={record.activeDays}
              totalCount={record.totalCount}
            />
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="총 연습" value={`${record.totalCount}회`} />
              <MiniStat label="활동한 날" value={`${record.activeDays}일`} />
            </div>
          </div>

          <ScoreTrendChart trend={record.trend} />
        </div>
      )}
    </Card>
  )
}
