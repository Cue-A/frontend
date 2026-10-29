import { formatMonthDay } from '../lib/homeDate'
import type { ActivityDay } from '../types/home'

/**
 * 하루 연습 횟수 → 칸 색. 시안처럼 보라 한 가지 색을 옅은 것에서 진한 것으로 씁니다 (0 · 1 · 2 · 3회 이상).
 * 안 한 날도 회색이 아니라 가장 옅은 보라입니다(시안 그대로).
 */
const LEVEL_CLASSES = ['bg-primary-100', 'bg-primary-200', 'bg-primary-400', 'bg-primary-500']

function levelOf(count: number) {
  return Math.min(count, LEVEL_CLASSES.length - 1)
}

/** 한 칸이 차지하는 폭(px, 간격 포함). 시안 10주 잔디가 열 줄에 140px 입니다 */
const CELL_PITCH_PX = 14

type Props = {
  days: ActivityDay[]
  /** "10주" — 왼쪽 아래 "10주 전" 과 스크린리더 요약에 씁니다 */
  periodLabel: string
  activeDays: number
  totalCount: number
}

/**
 * 연습 잔디. 한 줄(세로 7칸)이 7일이고 왼쪽이 오래된 날입니다.
 *
 * 칸 크기는 기간마다 다릅니다. 4주 · 10주는 시안 크기(14px)로 그리고, 6개월 · 1년은 그 크기로는 카드를
 * 넘쳐서 칸을 줄여 폭에 맞춥니다. 그래서 너비와 모서리를 계산값으로 둡니다.
 *
 * 칸마다 마우스를 올리면 날짜와 횟수가 뜨고(`title`), 스크린리더는 칸 대신 요약 한 줄을 읽습니다.
 */
export default function PracticeHeatmap({ days, periodLabel, activeDays, totalCount }: Props) {
  const columnCount = Math.ceil(days.length / 7)
  const gapClass = columnCount > 30 ? 'gap-px' : 'gap-0.5'

  return (
    <div className="flex flex-col gap-3">
      <div
        role="img"
        aria-label={`최근 ${periodLabel} 동안 ${activeDays}일, 모두 ${totalCount}회 연습했어요`}
        className={`grid w-full grid-flow-col grid-rows-7 ${gapClass}`}
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          maxWidth: columnCount * CELL_PITCH_PX,
        }}
      >
        {days.map((day) => (
          <span
            key={day.date}
            title={`${formatMonthDay(day.date)} · ${day.count === 0 ? '연습 없음' : `연습 ${day.count}회`}`}
            className={`aspect-square ${LEVEL_CLASSES[levelOf(day.count)]}`}
            // 칸 크기가 기간마다 달라서 모서리를 칸 크기에 대한 비율로 둡니다. px 로 두면 1년 탭의 작은 칸은 원이 됩니다.
            style={{ borderRadius: '25%' }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-body-sm text-neutral-400">
        <span>{periodLabel} 전</span>
        <span className="flex items-center gap-1">
          적음
          {LEVEL_CLASSES.map((levelClass) => (
            <span key={levelClass} aria-hidden className={`h-2.5 w-2.5 ${levelClass}`} style={{ borderRadius: '25%' }} />
          ))}
          많음
        </span>
      </div>
    </div>
  )
}
