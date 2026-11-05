import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import { DELTA_TONE_CLASS, deltaView, SCORE_AXIS_LABEL, spokenDelta } from '@/shared/lib/scoreDisplay'

import type { UseReportComparisonResult } from '../hooks/useReportComparison'
import type { ComparisonAxis, PreviousComparison, QuestionChange, RoundComparison } from '../types/comparison'

import ComparisonRoundBars from './ComparisonRoundBars'

type Props = {
  /** 이 리포트의 회차 비교 (`useReportComparison`) */
  comparison: UseReportComparisonResult
}

const AXES: ComparisonAxis[] = ['content', 'speech', 'gaze']

/** 작은 제목. 섹션 안의 묶음 이름입니다 */
const SUB_TITLE_CLASS = 'text-body-lg font-semibold text-neutral-900'

/** 변화량 한 칸. 기호(▲ ▼)는 화면 읽기 프로그램이 건너뛸 수 있어 말로 된 글을 따로 붙입니다 */
function Delta({ label, delta, strong = false }: { label?: string; delta: number | null; strong?: boolean }) {
  const view = deltaView(delta)
  return (
    <span className="whitespace-nowrap">
      {label && <span className={strong ? 'font-semibold text-neutral-900' : 'text-neutral-700'}>{label} </span>}
      <span aria-hidden className={`${DELTA_TONE_CLASS[view.tone]} ${strong ? 'font-semibold' : ''}`}>
        {view.text}
      </span>
      <span className="sr-only">{spokenDelta(delta)}</span>
    </span>
  )
}

/** 두 칸(회차별 종합 점수 · 직전 회차 대비)의 제목 줄. 높이를 같게 둬서 아래 칸의 시작선이 나란히 맞습니다 */
const COLUMN_HEADER_CLASS = 'flex min-h-7 flex-wrap items-baseline justify-between gap-2'

/**
 * 직전 회차 대비 — 「종합 ▲4 · 내용 ▲8 · 말하기 ▼2 · 시선 비교 불가」와 코멘트
 *
 * 내용은 연한 회색 판에 담고, 판이 왼쪽 막대 그래프 칸과 같은 높이까지 늘어납니다. 글만 두면 그래프보다 짧게 끝나서
 * 두 칸의 위아래가 어긋나 보였습니다. 판 모양은 아래 "문항별 변화" 목록과 같습니다.
 */
function PreviousChange({ previous, trendComment }: { previous: PreviousComparison; trendComment: string | null }) {
  const counts = [
    previous.improvedCount > 0 && `좋아진 문항 ${previous.improvedCount}개`,
    previous.declinedCount > 0 && `떨어진 문항 ${previous.declinedCount}개`,
  ].filter(Boolean)
  const paragraphs = [previous.comment, trendComment].filter((text): text is string => Boolean(text))

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className={COLUMN_HEADER_CLASS}>
        <h3 className={SUB_TITLE_CLASS}>직전 회차 대비</h3>
        <span className="text-body-sm text-neutral-400">
          {previous.currentRound}회차 vs {previous.previousRound}회차
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 rounded-sm bg-neutral-50 px-5 py-4">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-md">
          <li>
            <Delta label="종합" delta={previous.overallDelta} strong />
          </li>
          {AXES.map((axis) => (
            <li key={axis}>
              <Delta label={SCORE_AXIS_LABEL[axis]} delta={previous.axisDelta[axis]} />
            </li>
          ))}
        </ul>

        {counts.length > 0 && <p className="text-body-sm text-neutral-500">{counts.join(' · ')}</p>}

        {paragraphs.map((paragraph, index) => (
          <p key={index} className="break-keep text-body-md text-neutral-700">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}

/** 문항별 변화 한 줄 — 질문, 회차별 점수(68 → 72 → 80), 직전 · 첫 회차 대비, 코멘트 */
function QuestionRow({ item, index, rounds }: { item: QuestionChange; index: number; rounds: number[] }) {
  return (
    <li className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        {item.category && (
          <Badge tone="neutral" onTint>
            {item.category}
          </Badge>
        )}
        <p className="min-w-0 flex-1 text-body-md font-semibold text-neutral-900">
          {item.questionText ?? `질문 ${index + 1}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm">
        <ol className="flex flex-wrap items-center gap-1 text-neutral-500" aria-label="회차별 점수">
          {item.scores.map((score, scoreIndex) => (
            <li key={rounds[scoreIndex] ?? scoreIndex} className="flex items-center gap-1">
              {scoreIndex > 0 && (
                <span aria-hidden className="text-neutral-300">
                  →
                </span>
              )}
              <span className={scoreIndex === item.scores.length - 1 ? 'font-semibold text-neutral-900' : ''}>
                <span className="sr-only">{rounds[scoreIndex]}회차 </span>
                {score === null ? '—' : score}
              </span>
            </li>
          ))}
        </ol>
        <span className="text-neutral-500">
          직전 대비 <Delta delta={item.deltaFromPrevious} />
        </span>
        <span className="text-neutral-500">
          처음 대비 <Delta delta={item.deltaFromFirst} />
        </span>
      </div>

      {item.comment && <p className="break-keep text-body-sm text-neutral-700">{item.comment}</p>}
    </li>
  )
}

/** 비교할 회차가 있을 때의 본문 */
function ComparisonBody({ comparison }: { comparison: RoundComparison }) {
  const roundNumbers = comparison.rounds.map((item) => item.round)

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3">
          <div className={COLUMN_HEADER_CLASS}>
            <h3 className={SUB_TITLE_CLASS}>회차별 종합 점수</h3>
          </div>
          <ComparisonRoundBars rounds={comparison.rounds} currentRound={comparison.latestRound} />
        </div>

        {comparison.previous ? (
          <PreviousChange previous={comparison.previous} trendComment={comparison.trendComment} />
        ) : (
          comparison.trendComment && (
            <p className="break-keep text-body-md text-neutral-700">{comparison.trendComment}</p>
          )
        )}
      </div>

      {comparison.questions.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className={SUB_TITLE_CLASS}>문항별 변화</h3>
            <p className="text-body-sm text-neutral-500">모든 회차에서 다시 받은 질문만 비교해요</p>
          </div>
          <ul className="divide-y divide-neutral-200 rounded-sm bg-neutral-50 px-5 py-4">
            {comparison.questions.map((item, index) => (
              <QuestionRow key={item.questionId} item={item} index={index} rounds={roundNumbers} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * 회차 비교 섹션입니다. (이슈 #157, `GET /api/reports/{reportId}/comparison`)
 *
 * 같은 면접을 다시 본 회차들을 **이 리포트의 회차까지** 비교합니다 — 1회차 리포트에서 보면 뒤에 재연습을 했어도 1회차만
 * 나옵니다. 사이드바 성장 관리(C-04)와 같은 응답을 쓰고, 모양도 성장 관리의 점수 추이 · 이전 회차 대비 변화 카드를 따랐습니다.
 * 시안이 없어 문항별 변화(`byQuestion`)는 같은 결로 새로 그렸습니다.
 *
 * 리포트 본문(세부 점수 아래)에 있고, 리포트 화면의 `성장 추이 보기` 탭은 이것만 따로 보여줍니다 (이슈 #183).
 *
 * AI 가 계산해서 몇 초 걸리는 API 라 리포트를 먼저 그리고 이 섹션만 따로 불러옵니다. 그동안 이 섹션에만 자리 표시를 둡니다.
 * - 회차가 하나뿐(재연습 이력 없음)이면 오류가 아니라 200 이고, "아직 비교할 회차가 없어요" 로 둡니다
 * - 불러오지 못하면 이 섹션에만 이유와 "다시 시도" 를 둡니다. 호출 제한(60초 10회)에 걸려도 같습니다
 */
export default function ComparisonSection({ comparison }: Props) {
  const ready = comparison.status === 'ready' ? comparison.comparison : null
  const compared = ready !== null && ready.rounds.length >= 2

  return (
    <Card label="회차 비교" padding="lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-h2 text-neutral-900">회차 비교</h2>
          <p className="text-body-sm text-neutral-500">
            {compared
              ? `${ready.rounds.map((item) => item.round).join(' · ')}회차 · 이 리포트의 회차까지 비교해요`
              : '같은 면접을 다시 본 회차와 비교해요'}
          </p>
        </div>

        {comparison.status === 'error' ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-2 rounded-sm bg-neutral-50 p-6 text-center"
          >
            <p className="break-keep text-body-md text-neutral-700">{comparison.error.message}</p>
            {comparison.error.retryable && (
              <Button size="sm" onClick={comparison.reload}>
                다시 시도
              </Button>
            )}
          </div>
        ) : ready === null ? (
          <div aria-busy className="h-56 rounded-sm bg-neutral-50 motion-safe:animate-pulse">
            <span className="sr-only">지난 회차와 비교하는 중이에요</span>
          </div>
        ) : compared ? (
          <ComparisonBody comparison={ready} />
        ) : (
          <div className="flex flex-col items-center gap-1 rounded-sm bg-neutral-50 p-6 text-center">
            <p className="text-body-md font-semibold text-neutral-700">아직 비교할 회차가 없어요</p>
            <p className="break-keep text-body-sm text-neutral-500">
              같은 질문으로 다시 연습하면 회차마다 무엇이 달라졌는지 여기서 보여드려요.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
