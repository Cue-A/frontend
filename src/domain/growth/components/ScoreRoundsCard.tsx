import { ROUTES } from '@/app/routes'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { barHeightPercent, MAX_ROUNDS_SHOWN, scoreAxis } from '../lib/growthDisplay'
import type { ScoreRounds } from '../types/growth'

import GrowthCardHeader from './GrowthCardHeader'

type Props = {
  /** undefined 면 불러오는 중, null 이면 점수가 나온 회차가 없음 */
  scoreRounds: ScoreRounds | null | undefined
}

/** 회차 막대. 최신 회차만 진하게 칠합니다 (시안 bar-1) */
function RoundBars({ scoreRounds }: { scoreRounds: ScoreRounds }) {
  const rounds = scoreRounds.rounds.slice(-MAX_ROUNDS_SHOWN)
  const axis = scoreAxis(rounds.map((item) => item.score))
  const latestRound = rounds[rounds.length - 1].round
  const tickTop = (tick: number) => `${100 - barHeightPercent(tick, axis)}%`

  return (
    <>
      {/* 화면 읽기 프로그램에는 막대 대신 목록으로 읽어 줍니다 */}
      <ol className="sr-only">
        {rounds.map((item) => (
          <li key={item.round}>
            {item.round}회차 {item.score}점{item.round === latestRound ? ' (최신)' : ''}
          </li>
        ))}
      </ol>

      <div aria-hidden className="mt-6 flex h-60 flex-col">
        {/* 막대 · 눈금 자리. 아래 7(28px)은 회차 글자 자리입니다 */}
        <div className="relative ml-10 flex-1">
          {axis.ticks.map((tick) => (
            <div key={tick} className="absolute inset-x-0 h-px bg-neutral-200" style={{ top: tickTop(tick) }}>
              <span className="absolute -left-10 w-8 -translate-y-1/2 text-right text-micro text-neutral-400">
                {tick}
              </span>
            </div>
          ))}

          <div className="absolute inset-0 flex justify-around px-2">
            {rounds.map((item) => {
              const latest = item.round === latestRound
              const height = barHeightPercent(item.score, axis)
              return (
                <div key={item.round} className="relative h-full w-14">
                  <span
                    className={`absolute inset-x-0 text-center text-body-md ${latest ? 'text-primary-500' : 'text-neutral-500'}`}
                    style={{ bottom: `calc(${height}% + 4px)` }}
                  >
                    {item.score}
                  </span>
                  <div
                    className={`absolute inset-x-0 bottom-0 rounded-sm ${latest ? 'bg-primary-500' : 'bg-primary-200'}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="ml-10 flex h-7 items-end justify-around px-2">
          {rounds.map((item) => (
            <span key={item.round} className="w-14 whitespace-nowrap text-center text-body-sm text-neutral-400">
              {item.round}회차{item.round === latestRound && rounds.length > 1 ? ' (최신)' : ''}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}

/**
 * 회차별 종합 점수 추이 (시안 card-growth-chart).
 *
 * **가장 최근에 연습한 면접 묶음** 하나를 그립니다. 같은 면접을 다시 본 회차끼리 비교해야 달라진 게 보입니다 — 다른
 * 회사 · 직무 면접 점수를 한 줄에 놓으면 오르내림이 실력이 아니라 질문 차이가 됩니다. 묶음을 고르는 칸은 시안에 없습니다.
 *
 * 세로축은 0점부터가 아니라 가장 낮은 점수 근처부터 그립니다(`scoreAxis`). 0점부터 그리면 68점과 82점이 거의 같은
 * 높이라 달라진 게 안 보입니다. 회차가 많으면 최근 8회차만 그립니다.
 */
export default function ScoreRoundsCard({ scoreRounds }: Props) {
  return (
    <Card label="회차별 종합 점수 추이" padding="lg" className="min-w-0 lg:row-span-2">
      <GrowthCardHeader title="회차별 종합 점수 추이" />

      {scoreRounds === undefined ? (
        <p aria-busy className="mt-2 text-body-sm text-neutral-400">
          점수 추이를 불러오는 중이에요…
        </p>
      ) : scoreRounds === null ? (
        <div className="mt-6 flex min-h-60 flex-col items-center justify-center gap-1 rounded-md bg-surface-muted p-6 text-center">
          <p className="text-body-md font-semibold text-neutral-700">아직 점수가 나온 회차가 없어요</p>
          <p className="break-keep text-body-sm text-neutral-500">
            면접을 보고 분석을 받으면 회차마다 종합 점수가 여기에 쌓여요.
          </p>
          <Button variant="primary" size="sm" to={ROUTES.SESSION_SETUP} className="mt-3">
            새 연습 시작
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-1 text-body-sm text-neutral-400">
            {scoreRounds.title} · 총 {scoreRounds.rounds.length}회차
          </p>
          <RoundBars scoreRounds={scoreRounds} />
        </>
      )}
    </Card>
  )
}
