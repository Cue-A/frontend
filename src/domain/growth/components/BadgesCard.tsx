import { IconAward, IconFlame, IconShieldCheck, IconSparkles, IconTrendingUp, IconTrophy } from '@tabler/icons-react'

import Card from '@/shared/ui/Card'

import type { BadgeTone, GrowthBadge } from '../types/growth'

import GrowthCardHeader from './GrowthCardHeader'

/** 배지 아이콘. Tabler outline 입니다 (docs/design-system.md §7). 모르는 배지는 `IconAward` 로 그립니다 */
const BADGE_ICON: Record<string, typeof IconSparkles> = {
  FIRST_SESSION: IconSparkles,
  STREAK_3: IconFlame,
  PRESSURE_CLEAR: IconShieldCheck,
  RISING: IconTrendingUp,
  TEN_SESSIONS: IconTrophy,
}

/** 딴 배지의 원 색 (배지 3색 규칙의 메인 색, docs/design-system.md §2.4) */
const EARNED_CLASS: Record<BadgeTone, string> = {
  brand: 'bg-badge-brand',
  warning: 'bg-badge-warning',
  danger: 'bg-badge-danger',
  info: 'bg-badge-info',
  success: 'bg-badge-success',
}

type Props = {
  /** undefined 면 불러오는 중 */
  badges: GrowthBadge[] | undefined
}

/**
 * 획득한 뱃지 (시안 card-badges). 아직 못 딴 배지도 회색으로 두고 이름은 보여줍니다 — 무엇을 하면 받는지 알 수 있게.
 *
 * 시안의 원은 비어 있는 자리표시라, 홈의 배지 카드와 같은 아이콘 · 색을 씁니다. 같은 배지가 화면마다 다르게 생기면 안 됩니다.
 */
export default function BadgesCard({ badges }: Props) {
  return (
    <Card label="획득한 뱃지" padding="lg" className="min-w-0">
      <GrowthCardHeader title="획득한 뱃지" />

      {badges === undefined ? (
        <p aria-busy className="mt-5 text-body-sm text-neutral-400">
          배지를 불러오는 중이에요…
        </p>
      ) : badges.length === 0 ? (
        <p className="mt-5 text-body-md text-neutral-500">아직 받을 수 있는 배지가 없어요.</p>
      ) : (
        <ul className="mt-5 flex flex-wrap gap-5">
          {badges.map((badge) => {
            const Icon = BADGE_ICON[badge.code] ?? IconAward
            return (
              <li key={badge.code} className="flex w-13 flex-col items-center gap-3 text-center">
                <span
                  aria-hidden
                  className={`flex h-13 w-13 items-center justify-center rounded-full ${
                    badge.earned ? `${EARNED_CLASS[badge.tone]} text-neutral-0` : 'bg-neutral-200 text-neutral-400'
                  }`}
                >
                  <Icon size={22} stroke={2} />
                </span>
                <span className={`whitespace-nowrap text-micro ${badge.earned ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  {badge.name}
                  {!badge.earned && <span className="sr-only"> (아직 받지 않음)</span>}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
