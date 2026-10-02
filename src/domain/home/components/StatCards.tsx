import { monthlyDiffText } from '../lib/homeDisplay'
import { practicePeriodOf } from '../lib/practicePeriod'
import type { HomeOverview, PracticeRecord } from '../types/home'

import SkeletonBlock from './SkeletonBlock'

type StatCardProps = {
  label: string
  /** null 이면 값이 없다는 뜻이라 "–" 를 그립니다. undefined 면 불러오는 중입니다 */
  value: number | null | undefined
  unit: string
  caption: string
  /** 시안의 두 번째 카드(연속 학습)처럼 브랜드 그라디언트로 강조합니다 */
  highlight?: boolean
  /** 기간 탭을 바꾸는 중이라 이전 탭의 값인지 */
  stale?: boolean
}

function StatCard({ label, value, unit, caption, highlight = false, stale = false }: StatCardProps) {
  // 그라디언트 판은 `shared/ui/Card` 에 없는 모양이라 여기서 직접 그립니다. Card 에 색을 className 으로
  // 넘기면 어느 쪽 배경이 이길지 알 수 없습니다 (Card.tsx 주석).
  const surface = highlight
    ? 'bg-[image:var(--gradient-brand)] text-neutral-0'
    : 'bg-neutral-0/80 text-neutral-900'
  const subText = highlight ? 'text-neutral-0/80' : 'text-neutral-500'

  return (
    <div
      className={`flex flex-col rounded-lg p-5 transition-opacity ${surface} ${stale ? 'opacity-50' : ''}`}
      aria-busy={stale || value === undefined}
    >
      <p className={`text-body-sm ${subText}`}>{label}</p>

      {value === undefined ? (
        <>
          <SkeletonBlock className="mt-3 h-7 w-16" />
          <SkeletonBlock className="mt-2 h-4 w-20" />
        </>
      ) : (
        <>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-h1">{value ?? '–'}</span>
            {value !== null && <span className="text-body-md font-semibold">{unit}</span>}
          </p>
          <p className={`mt-1 text-body-sm ${subText}`}>{caption}</p>
        </>
      )}
    </div>
  )
}

type Props = {
  /** null 이면 불러오는 중 */
  overview: HomeOverview | null
  /** null 이면 불러오는 중이거나 못 불러옴 (`recordFailed`) */
  record: PracticeRecord | null
  recordStale: boolean
  recordFailed: boolean
  /** 고른 기간 탭 이름 (4주 · 10주 · 6개월 · 1년). 기록이 아직 없을 때만 씁니다 — 있으면 그 기록의 기간을 적습니다 */
  periodLabel: string
}

/**
 * 맨 위 숫자 카드 네 개.
 *
 * 앞의 둘(이번 달 · 연속 학습)은 기간과 상관없고, 뒤의 둘(기간 평균 · 총 연습)은 기간 탭을 따릅니다.
 * 시안의 "기간 평균" · "10주 누적" 이 그 뜻입니다.
 */
export default function StatCards({ overview, record, recordStale, recordFailed, periodLabel }: Props) {
  const recordValue = <T,>(pick: (value: PracticeRecord) => T) =>
    record ? pick(record) : recordFailed ? null : undefined

  const average = recordValue((value) => value.averageScore)
  const best = record?.bestScore ?? null
  // 탭을 바꾸는 중에는 숫자가 아직 이전 기간 것입니다(`recordStale`). 글자만 새 기간으로 바꾸면 "4주 누적" 옆에
  // 10주치 횟수가 잠깐 보여서, 글자도 숫자와 같은 기록의 기간을 따릅니다. (PR #88 리뷰)
  const shownPeriodLabel = record ? practicePeriodOf(record.period).label : periodLabel

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label={overview ? `이번 달 (${overview.thisMonth.month}월)` : '이번 달'}
        value={overview?.thisMonth.activeDays}
        unit="일"
        caption={overview ? monthlyDiffText(overview.thisMonth) : ''}
      />
      <StatCard
        highlight
        label="연속 학습"
        value={overview?.streak.current}
        unit="일째"
        caption={overview ? (overview.streak.best > 0 ? `최고 ${overview.streak.best}일` : '오늘 첫 연습으로 시작해요') : ''}
      />
      <StatCard
        label="기간 평균"
        value={average}
        unit="점"
        caption={best !== null ? `최고 ${best}점` : recordFailed ? '불러오지 못했어요' : '아직 점수가 없어요'}
        stale={recordStale}
      />
      <StatCard
        label="총 연습"
        value={recordValue((value) => value.totalCount)}
        unit="회"
        caption={recordFailed && !record ? '불러오지 못했어요' : `${shownPeriodLabel} 누적`}
        stale={recordStale}
      />
    </div>
  )
}
