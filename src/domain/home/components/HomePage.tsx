import { useState } from 'react'

import { useMe } from '@/domain/user/hooks/useMe'
import { toUserMessage } from '@/shared/api/errorMessage'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useHomeOverview } from '../hooks/useHomeOverview'
import { usePracticeRecord } from '../hooks/usePracticeRecord'
import { DEFAULT_PRACTICE_PERIOD, practicePeriodOf } from '../lib/practicePeriod'
import type { PracticePeriod } from '../types/home'

import BadgeCard from './BadgeCard'
import DiscoverCard from './DiscoverCard'
import HomeGreeting from './HomeGreeting'
import HomeTopBar from './HomeTopBar'
import PracticeRecordCard from './PracticeRecordCard'
import RecentReports from './RecentReports'
import StatCards from './StatCards'
import UpcomingEventsCard from './UpcomingEventsCard'
import WeeklyGoalCard from './WeeklyGoalCard'

/**
 * 홈 대시보드 (A-04 `04-홈대시보드`). 로그인 · 회원가입이 끝나면 오는 곳이고, 사이드바 "홈" 도 여기입니다.
 *
 * 전에는 로그인 뒤 랜딩으로 돌아갔습니다. 이제 로그인 · 회원가입 뒤 기본 이동, 사이드바 "홈", 로그인한 채
 * 로그인 화면에 왔을 때가 모두 여기로 옵니다 (router.tsx · useLoginRedirect). 랜딩은 서비스 첫 화면이라 그대로 둡니다.
 *
 * 백엔드에 홈 API 가 없어서 **인사말의 닉네임(`/api/users/me`)만 실제 값**이고 나머지는 목업입니다
 * (api/homeMock.ts — `?mock=empty` 로 막 가입한 사람의 빈 화면을 볼 수 있습니다).
 *
 * 배경은 시안처럼 화면 전체에 옅은 워시를 깔아서, 여백을 레이아웃이 아니라 이 화면이 정합니다
 * (router.tsx 의 `fullBleed`).
 */
export default function HomePage() {
  const me = useMe()
  const overview = useHomeOverview()
  const [period, setPeriod] = useState<PracticePeriod>(DEFAULT_PRACTICE_PERIOD)
  const practice = usePracticeRecord(period)

  const ready = overview.status === 'ready' ? overview.overview : null
  const isNewUser = ready !== null && ready.streak.best === 0 && ready.recentReports.length === 0

  return (
    <div className="min-h-screen bg-wash px-6 py-6 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <HomeTopBar me={me} />
        <HomeGreeting me={me} isNewUser={isNewUser} />

        {overview.status === 'error' ? (
          <Card padding="lg">
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-body-lg text-neutral-900">홈 화면을 불러오지 못했어요</p>
              <p className="text-body-sm text-neutral-500">{toUserMessage(overview.error.code)}</p>
              <Button size="sm" onClick={overview.retry} className="mt-2">
                다시 불러오기
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="flex min-w-0 flex-col gap-5">
              <StatCards
                overview={ready}
                // 지금 탭의 기록을 못 받았으면 이전 탭 숫자를 흐리게 남기지 않고 "–" 로 둡니다.
                record={practice.error ? null : practice.record}
                recordStale={practice.isStale}
                recordFailed={practice.error !== null}
                periodLabel={practicePeriodOf(period).label}
              />
              <PracticeRecordCard period={period} onPeriodChange={setPeriod} practice={practice} />
              <RecentReports reports={ready?.recentReports ?? null} />
            </div>

            <div className="flex flex-col gap-5">
              <BadgeCard badges={ready?.badges ?? null} />
              <WeeklyGoalCard goal={ready ? ready.weeklyGoal : undefined} />
              <UpcomingEventsCard events={ready?.upcomingEvents ?? null} />
              <DiscoverCard
                talentKeywords={ready?.talentKeywords ?? null}
                popularQuestions={ready?.popularQuestions ?? null}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
