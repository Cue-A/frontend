import Card from '@/shared/ui/Card'

import type { WeeklyGoal } from '../types/home'

import CardHeader from './CardHeader'
import ComingSoonLink from './ComingSoonLink'
import SkeletonBlock from './SkeletonBlock'

const RING_SIZE = 80
const RING_STROKE = 8
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

/** 진행 고리. 12시 방향에서 시계 방향으로 찹니다 */
function GoalRing({ done, target }: { done: number; target: number }) {
  const ratio = target > 0 ? Math.min(done / target, 1) : 0

  return (
    <div role="img" aria-label={`${target}회 중 ${done}회 완료`} className="relative shrink-0">
      <svg aria-hidden width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="-rotate-90">
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          strokeWidth={RING_STROKE}
          className="fill-none stroke-primary-100"
        />
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
      <span aria-hidden className="absolute inset-0 flex items-center justify-center text-h2 font-bold text-neutral-900">
        {done}/{target}
      </span>
    </div>
  )
}

function goalMessage({ done, target }: WeeklyGoal) {
  const remaining = target - done
  return remaining > 0 ? `${remaining}회만 더 하면 목표 달성이에요` : '이번 주 목표를 달성했어요!'
}

type Props = {
  /** undefined 면 불러오는 중, null 이면 이번 주 목표를 안 정함 */
  goal: WeeklyGoal | null | undefined
}

/** 이번 주 목표. 목표를 고치는 화면(모달)은 아직 없어서 "목표 수정" 은 준비 중입니다 */
export default function WeeklyGoalCard({ goal }: Props) {
  return (
    <Card label="이번 주 목표" padding="lg" surface="glass-soft">
      <CardHeader
        title="이번 주 목표"
        aside={<ComingSoonLink label={goal === null ? '목표 정하기' : '목표 수정'} withArrow={false} />}
      />

      {goal === undefined ? (
        <div aria-busy className="mt-5 flex items-center gap-5">
          <SkeletonBlock shape="circle" className="h-20 w-20" />
          <span className="flex flex-1 flex-col gap-2">
            <SkeletonBlock className="h-5 w-full" />
            <SkeletonBlock className="h-4 w-32" />
          </span>
        </div>
      ) : goal === null ? (
        <p className="mt-4 text-body-md text-neutral-500">
          이번 주 목표가 아직 없어요. 목표를 정하면 여기에서 얼마나 했는지 볼 수 있어요.
        </p>
      ) : (
        <div className="mt-5 flex items-center gap-5">
          <GoalRing done={goal.done} target={goal.target} />
          <div className="min-w-0">
            <p className="break-keep text-balance text-body-lg text-neutral-900">{goal.title}</p>
            <p className="mt-1 text-body-sm text-neutral-500">{goalMessage(goal)}</p>
          </div>
        </div>
      )}
    </Card>
  )
}
