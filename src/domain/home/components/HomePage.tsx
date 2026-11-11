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
 * 위쪽 숫자 카드 · 연습 기록 · 최근 리포트는 백엔드 홈 API(`/api/home/stats` · `/practice` · `/recent-reports`)로 받습니다.
 * 오른쪽은 성장 관리와 같은 곳에서 받습니다 — 배지 · 이번 주 목표는 `/api/growth`, 다가오는 면접일은
 * `/api/calendar/events/upcoming` (이슈 #201). 두 화면의 숫자 · 일정이 늘 같아야 합니다. 인재상 · 질문은행만 백엔드에 아직
 * 없어 목업(`/api/home`)이 답합니다 (api/homeMock.ts — `?mock=empty` 로 막 가입한 사람의 빈 화면을 볼 수 있습니다).
 *
 * 칸마다 따로 받아서 한 칸이 실패하면 그 칸에만 "다시 불러오기" 를 둡니다. 화면 전체를 막는 안내는 다섯 묶음(숫자 카드 ·
 * 최근 리포트 · 목표와 배지 · 다가오는 일정 · 인재상과 질문은행)이 다 실패했을 때만 띄웁니다.
 *
 * 배경은 시안처럼 화면 전체에 옅은 워시를 깔아서, 여백을 레이아웃이 아니라 이 화면이 정합니다
 * (router.tsx 의 `fullBleed`).
 */
export default function HomePage() {
  const me = useMe()
  const { stats, recentReports, growth, upcomingEvents, extras } = useHomeOverview()
  const [period, setPeriod] = useState<PracticePeriod>(DEFAULT_PRACTICE_PERIOD)
  const practice = usePracticeRecord(period)

  const statsData = stats.status === 'ready' ? stats.data : null
  const reportsData = recentReports.status === 'ready' ? recentReports.data : null
  const growthData = growth.status === 'ready' ? growth.data : null
  const extrasData = extras.status === 'ready' ? extras.data : null
  const isNewUser = statsData !== null && statsData.streak.best === 0 && reportsData?.length === 0

  // 다섯 묶음이 다 실패했을 때만 화면 전체를 막습니다. 하나라도 받았으면 그 칸은 보여줍니다 (PR #202 리뷰)
  const sections = [stats, recentReports, growth, upcomingEvents, extras]
  const allFailed = sections.every((section) => section.status === 'error')
  const retryAll = () => sections.forEach((section) => section.retry())

  return (
    <div className="min-h-screen bg-wash-tall px-6 py-6 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <HomeTopBar me={me} />
        <HomeGreeting me={me} isNewUser={isNewUser} />

        {allFailed ? (
          <Card padding="lg">
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-body-lg text-neutral-900">홈 화면을 불러오지 못했어요</p>
              <p className="text-body-sm text-neutral-500">
                {toUserMessage(stats.status === 'error' ? stats.error.code : 'UNKNOWN')}
              </p>
              <Button size="sm" onClick={retryAll} className="mt-2">
                다시 불러오기
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="flex min-w-0 flex-col gap-5">
              <StatCards
                stats={statsData}
                statsFailed={stats.status === 'error'}
                // 지금 탭의 기록을 못 받았으면 이전 탭 숫자를 흐리게 남기지 않고 "–" 로 둡니다.
                record={practice.error ? null : practice.record}
                recordStale={practice.isStale}
                recordFailed={practice.error !== null}
                periodLabel={practicePeriodOf(period).label}
              />
              <PracticeRecordCard period={period} onPeriodChange={setPeriod} practice={practice} />
              <RecentReports
                reports={reportsData}
                onRetry={recentReports.status === 'error' ? recentReports.retry : undefined}
              />
            </div>

            <div className="flex flex-col gap-5">
              {/* 칸마다 받는 곳이 달라서(목표 · 배지 /api/growth, 일정 /api/calendar, 인재상 · 질문은행 /api/home) 실패도 칸마다 둡니다 */}
              <BadgeCard
                badges={growthData?.badges ?? null}
                onRetry={growth.status === 'error' ? growth.retry : undefined}
              />
              <WeeklyGoalCard
                goal={growthData ? growthData.weeklyGoal : undefined}
                onRetry={growth.status === 'error' ? growth.retry : undefined}
              />
              <UpcomingEventsCard
                events={upcomingEvents.status === 'ready' ? upcomingEvents.data : null}
                onRetry={upcomingEvents.status === 'error' ? upcomingEvents.retry : undefined}
              />
              <DiscoverCard
                talentKeywords={extrasData?.talentKeywords ?? null}
                popularQuestions={extrasData?.popularQuestions ?? null}
                onRetry={extras.status === 'error' ? extras.retry : undefined}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
