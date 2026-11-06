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
 * 획득한 뱃지 (시안 card-badges). **받은 배지만** 보여줍니다 — 전에는 못 받은 배지도 회색으로 같이 두었는데, 카드 제목이
 * "획득한 뱃지" 라 받은 것처럼 읽혀서 뺐습니다 (이슈 #190 작업 중 결정). 홈의 배지 카드도 같습니다.
 *
 * 시안의 원은 비어 있는 자리표시라, 홈의 배지 카드와 같은 아이콘 · 색을 씁니다. 같은 배지가 화면마다 다르게 생기면 안 됩니다.
 */
export default function BadgesCard({ badges }: Props) {
  const earned = badges?.filter((badge) => badge.earned)

  return (
    <Card label="획득한 뱃지" padding="lg" className="min-w-0">
      <GrowthCardHeader title="획득한 뱃지" />

      {earned === undefined ? (
        <p aria-busy className="mt-5 text-body-sm text-neutral-400">
          배지를 불러오는 중이에요…
        </p>
      ) : earned.length === 0 ? (
        <p className="mt-5 text-body-md text-neutral-500">
          아직 받은 배지가 없어요. 면접 연습을 마치면 받을 수 있어요.
        </p>
      ) : (
        // 한 줄에 다섯 칸을 나눠 놓고 받은 순서대로 왼쪽부터 채웁니다. 배지는 다섯 개라 한 줄을 넘지 않습니다 (PR #184 리뷰)
        <ul className="mt-5 grid grid-cols-5 justify-items-center gap-y-5">
          {earned.map((badge) => {
            const Icon = BADGE_ICON[badge.code] ?? IconAward
            return (
              <li key={badge.code} className="flex w-12 flex-col items-center gap-3 text-center">
                <span
                  aria-hidden
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-neutral-0 ${EARNED_CLASS[badge.tone]}`}
                >
                  <Icon size={22} stroke={2} />
                </span>
                <span className="whitespace-nowrap text-micro text-neutral-500">{badge.name}</span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
