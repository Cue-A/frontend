import type { UseReportComparisonResult } from '@/domain/report/hooks/useReportComparison'
import type { ComparisonAxis, PreviousComparison } from '@/domain/report/types/comparison'
import Card from '@/shared/ui/Card'

import { AXIS_LABEL, deltaView, spokenDelta, type DeltaView } from '../lib/growthDisplay'
import type { LatestInterview } from '../types/growth'

import GrowthCardHeader from './GrowthCardHeader'

type Props = {
  /** undefined 면 불러오는 중, null 이면 분석이 끝난 리포트가 없음 */
  interview: LatestInterview | null | undefined
  /** 그 면접의 회차 비교 (`useReportComparison`) */
  comparison: UseReportComparisonResult
}

const AXES: ComparisonAxis[] = ['content', 'speech', 'gaze']

const TONE_CLASS: Record<DeltaView['tone'], string> = {
  up: 'text-badge-success-text',
  down: 'text-badge-danger-text',
  flat: 'text-neutral-500',
  unknown: 'text-neutral-400',
}

/** 변화량 한 칸. 기호(▲ ▼)는 화면 읽기 프로그램이 건너뛸 수 있어 말로 된 글을 따로 붙입니다 */
function Delta({ label, delta, strong = false }: { label: string; delta: number | null; strong?: boolean }) {
  const view = deltaView(delta)
  return (
    <li className="whitespace-nowrap">
      <span className={strong ? 'font-semibold text-neutral-900' : 'text-neutral-700'}>{label}</span>{' '}
      <span aria-hidden className={`${TONE_CLASS[view.tone]} ${strong ? 'font-semibold' : ''}`}>
        {view.text}
      </span>
      <span className="sr-only">{spokenDelta(delta)}</span>
    </li>
  )
}

/** 「종합 ▲4 · 내용 ▲8 · 말하기 ▼2 · 시선 비교 불가」 */
function DeltaRow({ previous }: { previous: PreviousComparison }) {
  return (
    <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-md">
      <Delta label="종합" delta={previous.overallDelta} strong />
      {AXES.map((axis) => (
        <Delta key={axis} label={AXIS_LABEL[axis]} delta={previous.axisDelta[axis]} />
      ))}
    </ul>
  )
}

/** 비교할 이전 회차가 없을 때 · 리포트가 없을 때 한 줄 (명세 상태별 화면) */
const NO_PREVIOUS = '재면접을 보면 지난 회차와 비교해 드려요.'

/**
 * 이전 회차 대비 변화 (시안 card-growth-analysis, 기능명세서 GRW-2).
 *
 * 리포트 도메인의 회차 비교(`vsPrevious` · `trend.comment`)를 씁니다. 점수 추이 카드와 같은 응답이라 따로 부르지 않습니다.
 *
 * - 머리 줄 오른쪽에 「5회차 vs 4회차」 — 비교 대상은 `latestRound - 1` 이 아니라 비교한 회차 중 끝에서 두 번째입니다
 * - 「종합 ▲4 · 내용 ▲8 · 말하기 ▼2 · 시선 비교 불가」 한 줄 — 오름 ▲ · 내림 ▼ · 0 은 변화 없음 · null 은 비교 불가
 * - 본문은 직전 대비 코멘트, 전체 추이 코멘트 순서입니다
 *
 * 시안은 본문 문단만 있습니다. 변화량 줄과 회차 표시는 명세의 화면 예시를 따라 더했습니다.
 * 불러오지 못하면 이 카드는 이유만 적고, "다시 시도" 는 같은 응답을 쓰는 점수 추이 카드에 둡니다.
 */
export default function RoundChangeCard({ interview, comparison }: Props) {
  const ready = comparison.status === 'ready' ? comparison.comparison : null
  const previous = ready?.previous ?? null
  const paragraphs = [previous?.comment, ready?.trendComment].filter((text): text is string => Boolean(text))

  return (
    <Card label="이전 회차 대비 변화" padding="lg">
      <GrowthCardHeader
        title="이전 회차 대비 변화"
        aside={
          ready &&
          previous && (
            <span className="shrink-0 text-body-sm text-neutral-400">
              {ready.latestRound}회차 vs {previous.previousRound}회차
            </span>
          )
        }
      />

      {interview === null ? (
        <p className="mt-5 break-keep text-body-md text-neutral-500">{NO_PREVIOUS}</p>
      ) : interview === undefined || comparison.status === 'loading' || comparison.status === 'idle' ? (
        <div aria-busy className="mt-5 flex flex-col gap-2">
          <span className="h-5 w-64 rounded-xs bg-neutral-50 motion-safe:animate-pulse" />
          <span className="h-5 w-full rounded-xs bg-neutral-50 motion-safe:animate-pulse" />
          <span className="sr-only">이전 회차와 비교하는 중이에요</span>
        </div>
      ) : comparison.status === 'error' ? (
        <p className="mt-5 break-keep text-body-md text-neutral-500">{comparison.error.message}</p>
      ) : previous === null ? (
        <p className="mt-5 break-keep text-body-md text-neutral-500">{NO_PREVIOUS}</p>
      ) : (
        <>
          <DeltaRow previous={previous} />
          {paragraphs.length > 0 && (
            <div className="mt-4 flex flex-col gap-1">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="break-keep text-body-md text-neutral-700">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  )
}
