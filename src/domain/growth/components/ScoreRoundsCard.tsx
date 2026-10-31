import { Link } from 'react-router-dom'

import { ROUTES, toReport } from '@/app/routes'
import type { UseReportComparisonResult } from '@/domain/report/hooks/useReportComparison'
import type { ComparisonRound } from '@/domain/report/types/comparison'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { barHeightPercent, MAX_ROUNDS_SHOWN, scoreAxis } from '../lib/growthDisplay'
import type { LatestInterview } from '../types/growth'

import GrowthCardHeader from './GrowthCardHeader'

type Props = {
  /** undefined 면 불러오는 중, null 이면 분석이 끝난 리포트가 없음 */
  interview: LatestInterview | null | undefined
  /** 그 면접의 회차 비교 (`useReportComparison`) */
  comparison: UseReportComparisonResult
}

/** 회차 아래 글자. 최신 회차 · 부분 리포트 회차에 덧붙입니다 */
function roundLabel(item: ComparisonRound, latest: boolean, single: boolean) {
  const tags = [latest && !single && '최신', item.partial && '부분'].filter(Boolean)
  return `${item.round}회차${tags.length > 0 ? ` (${tags.join(' · ')})` : ''}`
}

/** 막대의 이름. 화면 읽기 프로그램이 "3회차 71점, 리포트 보기" 처럼 읽습니다. 링크가 없는 막대는 점수까지만 읽습니다 */
function barLabel(item: ComparisonRound, latest: boolean) {
  const score = item.overall === null ? '부분 리포트라 종합 점수 없음' : `${item.overall}점`
  return `${item.round}회차${latest ? '(최신)' : ''} ${score}${item.reportId ? ', 리포트 보기' : ''}`
}

/** 점수가 나온 회차가 없을 때. 리포트가 하나도 없거나, 비교 응답에 회차가 비어 왔을 때 같은 안내를 씁니다 */
function EmptyRounds() {
  return (
    <div className="mt-6 flex min-h-60 flex-col items-center justify-center gap-1 rounded-md bg-surface-muted p-6 text-center">
      <p className="text-body-md font-semibold text-neutral-700">아직 점수가 나온 회차가 없어요</p>
      <p className="break-keep text-body-sm text-neutral-500">
        면접을 보고 분석을 받으면 회차마다 종합 점수가 여기에 쌓여요.
      </p>
      <Button variant="primary" size="sm" to={ROUTES.SESSION_SETUP} className="mt-3">
        새 연습 시작
      </Button>
    </div>
  )
}

/** 막대 한 칸의 모양. 링크든 아니든 같은 모양입니다 */
function BarFace({ item, latest, height }: { item: ComparisonRound; latest: boolean; height: number | null }) {
  if (height === null) {
    return (
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 flex h-1/4 items-start justify-center rounded-sm border border-dashed border-neutral-300 pt-1 text-body-sm text-neutral-400 group-hover:border-primary-200"
      >
        —
      </span>
    )
  }

  return (
    <>
      <span
        aria-hidden
        className={`absolute inset-x-0 text-center text-body-md ${latest ? 'text-primary-500' : 'text-neutral-500'}`}
        style={{ bottom: `calc(${height}% + 4px)` }}
      >
        {item.overall}
      </span>
      <span
        aria-hidden
        className={`absolute inset-x-0 bottom-0 rounded-sm transition-colors ${
          latest ? 'bg-primary-500 group-hover:bg-primary-600' : 'bg-primary-200 group-hover:bg-primary-400'
        }`}
        style={{ height: `${height}%` }}
      />
    </>
  )
}

/**
 * 회차 막대. 최신 회차만 진하게 칠하고, 막대를 누르면 그 회차 리포트로 갑니다.
 *
 * 부분 리포트 회차는 종합 점수가 null 이라 막대를 그리지 않고 점선 칸만 둡니다 — 0점으로 그리면 "못했다" 로 읽힙니다.
 * 회차 번호는 응답의 `comparedRounds` 에서 옵니다. 3회차 리포트가 없으면 1 · 2 · 4회차처럼 비어 보이는 게 맞습니다.
 * 응답에서 그 회차의 리포트 id 를 못 찾으면 링크 없이 막대만 그립니다 — 없는 화면(`/reports/`)으로 보내지 않습니다.
 *
 * `rounds` 는 한 개 이상이어야 합니다. 비어 있으면 부르는 쪽이 `EmptyRounds` 를 그립니다.
 */
function RoundBars({ rounds }: { rounds: ComparisonRound[] }) {
  const shown = rounds.slice(-MAX_ROUNDS_SHOWN)
  const scores = shown.flatMap((item) => (item.overall === null ? [] : [item.overall]))
  const axis = scoreAxis(scores.length > 0 ? scores : [100])
  const latestRound = shown[shown.length - 1].round
  const single = shown.length === 1
  const tickTop = (tick: number) => `${100 - barHeightPercent(tick, axis)}%`

  return (
    <div className="mt-6 flex h-60 flex-col">
      {/* 막대 · 눈금 자리. 아래 7(28px)은 회차 글자 자리입니다 */}
      <div className="relative ml-10 flex-1">
        {axis.ticks.map((tick) => (
          <div key={tick} aria-hidden className="absolute inset-x-0 h-px bg-neutral-200" style={{ top: tickTop(tick) }}>
            <span className="absolute -left-10 w-8 -translate-y-1/2 text-right text-micro text-neutral-400">{tick}</span>
          </div>
        ))}

        <ol className="absolute inset-0 flex justify-around px-2">
          {shown.map((item) => {
            const latest = item.round === latestRound
            const height = item.overall === null ? null : barHeightPercent(item.overall, axis)
            return (
              <li key={item.round} className="relative h-full w-14">
                {item.reportId ? (
                  <Link
                    to={toReport(item.reportId)}
                    aria-label={barLabel(item, latest)}
                    className="group absolute inset-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                  >
                    <BarFace item={item} latest={latest} height={height} />
                  </Link>
                ) : (
                  <div className="absolute inset-0">
                    <span className="sr-only">{barLabel(item, latest)}</span>
                    <BarFace item={item} latest={latest} height={height} />
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </div>

      <div aria-hidden className="ml-10 flex h-7 items-end justify-around px-2">
        {shown.map((item) => (
          <span key={item.round} className="w-14 whitespace-nowrap text-center text-body-sm text-neutral-400">
            {roundLabel(item, item.round === latestRound, single)}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * 회차별 종합 점수 추이 (시안 card-growth-chart).
 *
 * **가장 최근에 연습한 면접 묶음** 하나를 그립니다. 같은 면접을 다시 본 회차끼리 비교해야 달라진 게 보입니다 — 다른
 * 회사 · 직무 면접 점수를 한 줄에 놓으면 오르내림이 실력이 아니라 질문 차이가 됩니다. 묶음을 고르는 칸은 시안에 없습니다.
 *
 * 점수는 리포트 도메인의 회차 비교(`GET /api/reports/{reportId}/comparison`)에서 옵니다. AI 가 계산해서 몇 초 걸리므로
 * 목표 · 배지와 따로 받고, 이 카드만 로딩 · 오류를 보여줍니다 (API 명세서 v0.2 「회차 비교·성장 추이 조회」 상태별 화면).
 *
 * 세로축은 0점부터가 아니라 가장 낮은 점수 근처부터 그립니다(`scoreAxis`). 회차가 많으면 최근 8회차만 그립니다.
 */
export default function ScoreRoundsCard({ interview, comparison }: Props) {
  return (
    <Card label="회차별 종합 점수 추이" padding="lg" className="min-w-0 lg:row-span-2">
      <GrowthCardHeader title="회차별 종합 점수 추이" />

      {interview === undefined ? (
        <p aria-busy className="mt-2 text-body-sm text-neutral-400">
          점수 추이를 불러오는 중이에요…
        </p>
      ) : interview === null ? (
        <EmptyRounds />
      ) : (
        <>
          <p className="mt-1 text-body-sm text-neutral-400">
            {interview.title}
            {/* 비교한 회차 수가 아니라 마지막 회차 번호입니다. 1 · 2 · 4회차를 비교했으면 4회차까지 본 면접입니다 */}
            {comparison.status === 'ready' &&
              comparison.comparison.rounds.length > 0 &&
              ` · 총 ${comparison.comparison.latestRound}회차`}
          </p>

          {comparison.status === 'ready' ? (
            comparison.comparison.rounds.length > 0 ? (
              <RoundBars rounds={comparison.comparison.rounds} />
            ) : (
              <EmptyRounds />
            )
          ) : comparison.status === 'error' ? (
            <div
              role="alert"
              className="mt-6 flex min-h-60 flex-col items-center justify-center gap-2 rounded-md bg-surface-muted p-6 text-center"
            >
              <p className="break-keep text-body-md text-neutral-700">{comparison.error.message}</p>
              {comparison.error.retryable && (
                <Button size="sm" onClick={comparison.reload}>
                  다시 시도
                </Button>
              )}
            </div>
          ) : (
            <div aria-busy className="mt-6 h-60 rounded-md bg-neutral-50 motion-safe:animate-pulse">
              <span className="sr-only">점수 추이를 불러오는 중이에요</span>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
