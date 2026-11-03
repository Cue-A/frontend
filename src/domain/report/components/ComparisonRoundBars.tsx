import { Link } from 'react-router-dom'

import { toReport } from '@/app/routes'
import { barHeightPercent, MAX_ROUNDS_SHOWN, scoreAxis } from '@/shared/lib/scoreDisplay'

import type { ComparisonRound } from '../types/comparison'

/** 회차 아래 글자. 이 리포트 · 부분 리포트 회차에 덧붙입니다 */
function roundLabel(item: ComparisonRound, current: boolean) {
  const tags = [current && '이 리포트', item.partial && '부분'].filter(Boolean)
  return `${item.round}회차${tags.length > 0 ? ` (${tags.join(' · ')})` : ''}`
}

/** 막대의 이름. 화면 읽기 프로그램이 "2회차 72점, 리포트 보기" 처럼 읽습니다 */
function barLabel(item: ComparisonRound, current: boolean, linked: boolean) {
  const score = item.overall === null ? '부분 리포트라 종합 점수 없음' : `${item.overall}점`
  return `${item.round}회차${current ? '(이 리포트)' : ''} ${score}${linked ? ', 리포트 보기' : ''}`
}

/** 막대 한 칸의 모양. 링크든 아니든 같은 모양입니다 */
function BarFace({ item, current, height }: { item: ComparisonRound; current: boolean; height: number | null }) {
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
        className={`absolute inset-x-0 text-center text-body-md ${current ? 'text-primary-500' : 'text-neutral-500'}`}
        style={{ bottom: `calc(${height}% + 4px)` }}
      >
        {item.overall}
      </span>
      <span
        aria-hidden
        className={`absolute inset-x-0 bottom-0 rounded-sm transition-colors ${
          current ? 'bg-primary-500' : 'bg-primary-200 group-hover:bg-primary-400'
        }`}
        style={{ height: `${height}%` }}
      />
    </>
  )
}

/**
 * 회차별 종합 점수 막대입니다. (이슈 #157)
 *
 * 성장 관리의 "회차별 종합 점수 추이" 와 같은 모양입니다. 다른 점은 **이 리포트가 마지막 회차**라는 것 — 이 리포트 막대만
 * 진하게 칠하고 링크를 걸지 않습니다(지금 보고 있는 화면). 다른 회차 막대를 누르면 그 회차 리포트로 갑니다.
 *
 * 부분 리포트 회차는 종합 점수가 null 이라 점선 칸만 둡니다 — 0점으로 그리면 "못했다" 로 읽힙니다.
 * 회차 번호는 응답의 `comparedRounds` 에서 옵니다. 리포트가 없는 회차는 빠져서 1 · 2 · 4회차처럼 비어 보이는 게 맞습니다.
 */
export default function ComparisonRoundBars({ rounds, currentRound }: { rounds: ComparisonRound[]; currentRound: number }) {
  const shown = rounds.slice(-MAX_ROUNDS_SHOWN)
  const scores = shown.flatMap((item) => (item.overall === null ? [] : [item.overall]))
  const axis = scoreAxis(scores.length > 0 ? scores : [100])
  const tickTop = (tick: number) => `${100 - barHeightPercent(tick, axis)}%`

  return (
    <div className="flex h-56 flex-col">
      {/* 막대 · 눈금 자리. 아래 7(28px)은 회차 글자 자리입니다 */}
      <div className="relative ml-10 flex-1">
        {axis.ticks.map((tick) => (
          <div key={tick} aria-hidden className="absolute inset-x-0 h-px bg-neutral-200" style={{ top: tickTop(tick) }}>
            <span className="absolute -left-10 w-8 -translate-y-1/2 text-right text-micro text-neutral-400">{tick}</span>
          </div>
        ))}

        <ol className="absolute inset-0 flex justify-around px-2">
          {shown.map((item) => {
            const current = item.round === currentRound
            const height = item.overall === null ? null : barHeightPercent(item.overall, axis)
            const linked = !current && item.reportId !== null
            return (
              <li key={item.round} className="relative h-full w-14">
                {linked && item.reportId ? (
                  <Link
                    to={toReport(item.reportId)}
                    aria-label={barLabel(item, current, true)}
                    className="group absolute inset-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                  >
                    <BarFace item={item} current={current} height={height} />
                  </Link>
                ) : (
                  <div className="absolute inset-0">
                    <span className="sr-only">{barLabel(item, current, false)}</span>
                    <BarFace item={item} current={current} height={height} />
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
            {roundLabel(item, item.round === currentRound)}
          </span>
        ))}
      </div>
    </div>
  )
}
