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
 * 위쪽 숫자 카드 · 연습 기록 · 최근 리포트는 백엔드 홈 API(`/api/home/stats` · `/practice` · `/recent-reports`)로 받고,
 * 오른쪽 배지 · 다가오는 일정 · 인재상 · 질문은행은 백엔드에 아직 없어 목업(`/api/home`)이 답합니다
 * (api/homeMock.ts — `?mock=empty` 로 막 가입한 사람의 빈 화면을 볼 수 있습니다). 이번 주 목표는 성장 관리와 같은
 * `/api/growth` 로 따로 받습니다(이슈 #201) — 두 화면의 목표 숫자가 늘 같아야 합니다.
 *
 * 칸마다 따로 받아서 한 칸이 실패하면 그 칸에만 "다시 불러오기" 를 둡니다. 화면 전체를 막는 안내는 네 칸(숫자 카드 · 최근 리포트 ·
 * 배지와 일정 · 이번 주 목표)이 다 실패했을 때만 띄웁니다.
 *
 * 배경은 시안처럼 화면 전체에 옅은 워시를 깔아서, 여백을 레이아웃이 아니라 이 화면이 정합니다
 * (router.tsx 의 `fullBleed`).
 */
export default function HomePage() {
  const me = useMe()
  const { stats, recentReports, extras, weeklyGoal } = useHomeOverview()
  const [period, setPeriod] = useState<PracticePeriod>(DEFAULT_PRACTICE_PERIOD)
  const practice = usePracticeRecord(period)

  const statsData = stats.status === 'ready' ? stats.data : null
  const reportsData = recentReports.status === 'ready' ? recentReports.data : null
  const extrasData = extras.status === 'ready' ? extras.data : null
  const isNewUser = statsData !== null && statsData.streak.best === 0 && reportsData?.length === 0

  // 넷 다 실패했을 때만 화면 전체를 막습니다. 이번 주 목표 하나라도 받았으면 그 칸은 보여줍니다 (PR #202 리뷰)
  const allFailed =
    stats.status === 'error' &&
    recentReports.status === 'error' &&
    extras.status === 'error' &&
    weeklyGoal.status === 'error'
  const retryAll = () => {
    stats.retry()
    recentReports.retry()
    extras.retry()
    weeklyGoal.retry()
  }

  return (
    <div className="min-h-screen bg-wash-tall px-6 py-6 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <HomeTopBar me={me} />
        <HomeGreeting me={me} isNewUser={isNewUser} />

        {allFailed ? (
          <Card padding="lg">
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-body-lg text-neutral-900">홈 화면을 불러오지 못했어요</p>
              <p className="text-body-sm text-neutral-500">{toUserMessage(stats.error.code)}</p>
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
              {extras.status === 'error' ? (
                <Card padding="lg">
                  <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <p className="text-body-lg text-neutral-900">배지 · 일정을 불러오지 못했어요</p>
                    <Button size="sm" onClick={extras.retry} className="mt-2">
                      다시 불러오기
                    </Button>
                  </div>
                </Card>
              ) : (
                <BadgeCard badges={extrasData?.badges ?? null} />
              )}
              {/* 이번 주 목표는 /api/growth 에서 따로 받아서, 배지 · 일정이 실패해도 보입니다 */}
              <WeeklyGoalCard
                goal={weeklyGoal.status === 'ready' ? weeklyGoal.data : undefined}
                onRetry={weeklyGoal.status === 'error' ? weeklyGoal.retry : undefined}
              />
              {extras.status !== 'error' && (
                <>
                  <UpcomingEventsCard events={extrasData?.upcomingEvents ?? null} />
                  <DiscoverCard
                    talentKeywords={extrasData?.talentKeywords ?? null}
                    popularQuestions={extrasData?.popularQuestions ?? null}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
