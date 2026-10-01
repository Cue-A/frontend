import { IconFlame, IconShieldCheck, IconSparkles, IconTrendingUp, IconTrophy } from '@tabler/icons-react'

import Card from '@/shared/ui/Card'

import type { BadgeCode, BadgeSummary, BadgeTone } from '../types/home'

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
  /** null 이면 불러오는 중 */
  badges: BadgeSummary | null
}

/** 획득한 뱃지. 아직 못 딴 배지는 회색으로 두고 이름은 보여줍니다 — 무엇을 하면 받는지 알 수 있게 */
export default function BadgeCard({ badges }: Props) {
  return (
    <Card label="획득한 뱃지" padding="lg">
      <CardHeader
        title="획득한 뱃지"
        aside={
          badges && (
            <span className="text-body-md font-semibold text-primary-500">
              {badges.earnedCount} / {badges.totalCount}
              <span className="sr-only">개 획득</span>
            </span>
          )
        }
      />

      {badges === null ? (
        <div aria-busy className="mt-5 flex justify-between gap-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <span key={index} className="flex flex-col items-center gap-2">
              <SkeletonBlock shape="circle" className="h-11 w-11" />
              <SkeletonBlock className="h-3 w-10" />
            </span>
          ))}
        </div>
      ) : (
        <>
          {/* 칸을 똑같이 나누면 "3회 연속 상승" 처럼 긴 설명만 두 줄로 꺾여서 줄이 들쭉날쭉해집니다. 글 길이만큼 차지하게 둡니다 */}
          <ul className="mt-5 flex justify-between gap-2">
            {badges.featured.map((badge) => {
              const Icon = BADGE_ICON[badge.code]
              return (
                <li key={badge.code} className="flex flex-col items-center text-center">
                  <span
                    aria-hidden
                    className={`flex h-11 w-11 items-center justify-center rounded-full ring-4 ${
                      badge.earned ? `${EARNED_CLASS[badge.tone]} text-neutral-0` : 'bg-neutral-200 text-neutral-400 ring-neutral-50'
                    }`}
                  >
                    <Icon size={20} stroke={2} />
                  </span>
                  <span className={`mt-3 text-body-sm font-semibold ${badge.earned ? 'text-neutral-900' : 'text-neutral-500'}`}>
                    {badge.name}
                  </span>
                  <span className="whitespace-nowrap text-micro text-neutral-500">{badge.description}</span>
                  {!badge.earned && <span className="sr-only">(아직 받지 않음)</span>}
                </li>
              )
            })}
          </ul>

          {badges.nextHint && (
            <p className="mt-5 rounded-sm bg-surface-muted px-4 py-3 text-body-sm text-primary-700">{badges.nextHint}</p>
          )}
        </>
      )}
    </Card>
  )
}
