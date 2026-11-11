import { IconFlame, IconShieldCheck, IconSparkles, IconTrendingUp, IconTrophy } from '@tabler/icons-react'

import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import type { BadgeCode, BadgeTone, HomeBadge } from '../types/home'

import CardHeader from './CardHeader'
import SkeletonBlock from './SkeletonBlock'

/** 배지 아이콘. Tabler outline 입니다 (docs/design-system.md §7) */
const BADGE_ICON: Record<BadgeCode, typeof IconSparkles> = {
  FIRST_SESSION: IconSparkles,
  STREAK_3: IconFlame,
  PRESSURE_CLEAR: IconShieldCheck,
  RISING: IconTrendingUp,
  TEN_SESSIONS: IconTrophy,
}

/** 딴 배지: 메인 색 원 + 같은 색 20% 테두리 (배지 3색 규칙, docs/design-system.md §2.4) */
const EARNED_CLASS: Record<BadgeTone, string> = {
  brand: 'bg-badge-brand ring-badge-brand-bg',
  warning: 'bg-badge-warning ring-badge-warning-bg',
  danger: 'bg-badge-danger ring-badge-danger-bg',
  info: 'bg-badge-info ring-badge-info-bg',
  success: 'bg-badge-success ring-badge-success-bg',
}

type Props = {
  /** 배지 전부(못 받은 것 포함). null 이면 불러오는 중 */
  badges: HomeBadge[] | null
  /** 못 불러왔을 때 "다시 불러오기". 있으면 실패 안내를 그립니다 */
  onRetry?: () => void
}

/**
 * 획득한 뱃지. **받은 배지만** 보여주고 오른쪽 위에 받은 개수를 적습니다. 개수는 그린 배지 수로 셉니다 — 서버의 `earnedCount`
 * 를 쓰면 `featured` 가 일부만 올 때 개수와 목록이 어긋납니다 (PR #191 리뷰). 전에는 못 받은 배지도 회색으로 두고 "3 / 5" 로
 * 적었는데, 카드 제목이 "획득한 뱃지" 라 받은 것처럼 읽혀서 뺐습니다 (이슈 #190 작업 중 결정). 성장 관리의 배지 카드도 같습니다.
 *
 * 배지는 성장 관리와 같은 `GET /api/growth` 에서 받습니다 (이슈 #201). 전에 목업에 있던 "다음 뱃지까지 …" 안내는 서버가 주지
 * 않아 뺐습니다.
 */
export default function BadgeCard({ badges, onRetry }: Props) {
  const earned = badges ? badges.filter((badge) => badge.earned) : []

  return (
    <Card label="획득한 뱃지" padding="lg" surface="glass-soft">
      <CardHeader
        title="획득한 뱃지"
        aside={
          badges && (
            <span className="text-body-md font-semibold text-primary-500">
              {earned.length}개<span className="sr-only"> 획득</span>
            </span>
          )
        }
      />

      {onRetry ? (
        <div className="mt-4 flex flex-col items-start gap-3">
          <p className="text-body-md text-neutral-500">배지를 불러오지 못했어요.</p>
          <Button size="sm" onClick={onRetry}>
            다시 불러오기
          </Button>
        </div>
      ) : badges === null ? (
        <div aria-busy className="mt-5 flex justify-between gap-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <span key={index} className="flex flex-col items-center gap-2">
              <SkeletonBlock shape="circle" className="h-11 w-11" />
              <SkeletonBlock className="h-3 w-10" />
            </span>
          ))}
        </div>
      ) : earned.length === 0 ? (
        <p className="mt-5 text-body-md text-neutral-500">아직 받은 배지가 없어요.</p>
      ) : (
        // 칸을 똑같이 나누면 "3회 연속 상승" 처럼 긴 설명만 두 줄로 꺾여서 줄이 들쭉날쭉해집니다. 글 길이만큼 차지하게 두고,
        // 받은 배지가 적어도 양 끝으로 벌어지지 않게 왼쪽부터 붙입니다
        <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-4">
          {earned.map((badge) => {
            const Icon = BADGE_ICON[badge.code]
            return (
              <li key={badge.code} className="flex flex-col items-center text-center">
                <span
                  aria-hidden
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-neutral-0 ring-4 ${EARNED_CLASS[badge.tone]}`}
                >
                  <Icon size={20} stroke={2} />
                </span>
                <span className="mt-3 text-body-sm font-semibold text-neutral-900">{badge.name}</span>
                <span className="whitespace-nowrap text-micro text-neutral-500">{badge.description}</span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
