import Card from '@/shared/ui/Card'

import { goalMessage } from '../lib/growthDisplay'
import type { WeeklyGoal } from '../types/growth'

import GrowthCardHeader from './GrowthCardHeader'

const RING_SIZE = 96
const RING_STROKE = 10
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

/** 진행 고리. 12시 방향에서 시계 방향으로 찹니다 (시안 RingWrap) */
function GoalRing({ done, target }: WeeklyGoal) {
  const ratio = target > 0 ? Math.min(done / target, 1) : 0

  return (
    <div className="relative shrink-0">
      <svg aria-hidden width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="-rotate-90">
        <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} strokeWidth={RING_STROKE} className="fill-none stroke-neutral-200" />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - ratio)}
          className="fill-none stroke-primary-500"
        />
      </svg>
      <span aria-hidden className="absolute inset-0 flex items-center justify-center text-body-lg font-bold text-neutral-900">
        {done}/{target}
      </span>
    </div>
  )
}

type Props = {
  /** undefined 면 불러오는 중, null 이면 이번 주 목표를 안 정함 */
  goal: WeeklyGoal | null | undefined
  /** 목표를 저장했다는 알림. 없으면 null */
  notice: string | null
  /** 목표 수정 창을 엽니다 */
  onEdit: () => void
}

/**
 * 이번 주 목표 (시안 954:2415). "목표 수정" 은 목표 수정 창(`GoalEditDialog`)을 엽니다 — 창은 시안이 없어 임시 디자인입니다.
 * 목표를 아직 안 정했으면 같은 창을 "목표 정하기" 로 엽니다.
 */
export default function WeeklyGoalCard({ goal, notice, onEdit }: Props) {
  return (
    <Card label="이번 주 목표" padding="lg" className="min-w-0">
      <GrowthCardHeader
        title="이번 주 목표"
        aside={
          goal !== undefined && (
            <button
              type="button"
              onClick={onEdit}
              className="shrink-0 rounded-xs text-body-sm text-primary-500 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              {goal === null ? '목표 정하기' : '목표 수정'}
            </button>
          )
        }
      />

      {goal === undefined ? (
        <p aria-busy className="mt-5 text-body-sm text-neutral-400">
          이번 주 목표를 불러오는 중이에요…
        </p>
      ) : goal === null ? (
        <p className="mt-5 break-keep text-body-md text-neutral-500">
          이번 주 목표가 아직 없어요. 몇 번 연습할지 정하면 여기에서 얼마나 했는지 볼 수 있어요.
        </p>
      ) : (
        <div className="mt-5 flex items-center gap-6">
          <GoalRing done={goal.done} target={goal.target} />
          <div className="min-w-0">
            <p className="text-body-md text-neutral-900">
              {goal.done} / {goal.target}회 완료
            </p>
            <p className="mt-1.5 break-keep text-body-sm text-neutral-500">{goalMessage(goal)}</p>
          </div>
        </div>
      )}

      {/* 알림 줄은 늘 붙여 둡니다. 새로 그려진 안내 줄은 화면 읽기 프로그램이 읽지 않는 경우가 있습니다 */}
      <p role="status" className={notice ? 'mt-4 text-body-sm text-badge-success-text' : 'sr-only'}>
        {notice}
      </p>
    </Card>
  )
}
