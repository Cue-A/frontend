import { formatDuration } from '@/shared/lib/formatDuration'
import { SCORE_AXIS_LABEL } from '@/shared/lib/scoreDisplay'
import Card from '@/shared/ui/Card'

import type { UseReportTimelineResult } from '../hooks/useReportTimeline'
import type { TurnFlow } from '../types/report'
import type { ReportTimeline, TimelineAxis, TimelineEvidence } from '../types/timeline'

type Props = {
  turns: TurnFlow[]
  timeline: UseReportTimelineResult
  /**
   * 답변 영상의 그 문항 · 그 시각으로 옮깁니다. 영상 목록을 아직 못 받았거나 못 받으면 비웁니다 — 그때는 마커를 누를 수 없고
   * "구간 보기" 도 그리지 않습니다.
   */
  onSeek?: (questionId: string, seconds: number, fallbackQuestionId: string) => void
}

/** 마커 색. 잘한 점은 초록, 아쉬운 점은 빨강입니다 (리포트의 잘한 점 · 아쉬운 점 카드와 같은 계열) */
const MARKER_CLASS: Record<TimelineEvidence['kind'], string> = {
  strength: 'bg-semantic-success',
  weakness: 'bg-semantic-danger',
}

const KIND_LABEL: Record<TimelineEvidence['kind'], string> = {
  strength: '잘한 점',
  weakness: '아쉬운 점',
}

type Segment = {
  questionId: string
  questionNumber: number
  /** 트랙 맨 앞에서 이 문항이 시작하는 초 */
  offset: number
  duration: number
  evidence: TimelineEvidence[]
}

/** 문항을 한 줄 트랙에 차례로 놓습니다. 시각이 답변마다 0 부터라, 앞 문항들의 답변 길이를 더한 자리에서 시작합니다 */
function toSegments(timeline: ReportTimeline): { segments: Segment[]; total: number } {
  let offset = 0
  const segments = timeline.questions.map((question) => {
    const duration = question.durationSec ?? 0
    const segment = {
      questionId: question.questionId,
      questionNumber: question.questionNumber,
      offset,
      duration,
      evidence: question.evidence,
    }
    offset += duration
    return segment
  })
  return { segments, total: offset }
}

/** 축 이름 + 조사. "시선은(는)" 처럼 쓰지 않으려고 축마다 적어 둡니다 */
const AXIS_TOPIC: Record<TimelineAxis, string> = {
  content: '내용은',
  speech: '말하기는',
  gaze: '시선은',
}

/**
 * 근거가 가리키는 재생 시각입니다. **그 답변 녹음 · 영상 기준 초 그대로**이고 문항 길이로 자르지 않습니다 — 되묻기 근거는
 * 되묻기 답변 기준이라 원 질문 길이보다 클 수 있습니다. 영상 길이를 넘으면 답변 영상이 끝에 맞춥니다. (PR #173 리뷰)
 * 마커 이름 · 근거 목록의 시각도 이 값을 씁니다.
 */
function seekSecondsOf(item: TimelineEvidence) {
  return item.tStart ?? 0
}

/**
 * 트랙에 찍는 자리(그 문항 구간 안의 초)입니다. 한 줄 트랙은 문항 길이를 이어 붙인 근사치라, 구간을 넘는 근거는 구간 끝에
 * 찍습니다. 길이를 모르는 문항(`durationSec` null)은 구간이 0 이라 문항 시작에 찍힙니다.
 */
function trackSecondsOf(item: TimelineEvidence, segment: Segment) {
  return Math.min(seekSecondsOf(item), segment.duration)
}

/** 근거가 비어 있는 이유. 분석 실패와 미사용은 다른 말입니다 (세부 점수와 같은 구분) */
function missingAxisNotes(timeline: ReportTimeline): string[] {
  return (Object.keys(SCORE_AXIS_LABEL) as TimelineAxis[]).flatMap((axis) => {
    const status = timeline.axes[axis]
    if (status === 'failed') return [`${AXIS_TOPIC[axis]} 분석하지 못해서 마커가 없어요`]
    if (status === 'skipped') return [`${AXIS_TOPIC[axis]} 이번 면접에서 쓰지 않아 마커가 없어요`]
    return []
  })
}

function MarkerTrack({
  segments,
  total,
  onSeek,
}: {
  segments: Segment[]
  total: number
  onSeek?: Props['onSeek']
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-8 rounded-full bg-neutral-200/60">
        {/* 문항 경계. 첫 문항 앞은 트랙 시작이라 긋지 않습니다 */}
        {segments.slice(1).map((segment) => (
          <span
            key={`divider-${segment.questionId}`}
            aria-hidden
            className="absolute inset-y-1.5 w-px bg-neutral-300"
            style={{ left: `${(segment.offset / total) * 100}%` }}
          />
        ))}

        {segments.flatMap((segment) =>
          segment.evidence.map((item, index) => {
            const at = seekSecondsOf(item)
            const left = ((segment.offset + trackSecondsOf(item, segment)) / total) * 100
            const name = `Q${segment.questionNumber}${item.isReask ? ' 되묻기' : ''} ${formatDuration(at)} · ${
              SCORE_AXIS_LABEL[item.axis]
            } ${KIND_LABEL[item.kind]} — ${item.label}`
            const dot = `block h-3 w-3 rounded-full ring-2 ring-neutral-0 ${MARKER_CLASS[item.kind]}`

            return onSeek ? (
              <button
                key={`${segment.questionId}-${index}`}
                type="button"
                title={item.comment ?? name}
                // 되묻기 답변이 재생목록에 없으면 원 질문으로 갑니다
                onClick={() => onSeek(item.questionId, at, segment.questionId)}
                className="absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-primary-500"
                style={{ left: `${left}%` }}
              >
                <span aria-hidden className={dot} />
                <span className="sr-only">{name} 구간 보기</span>
              </button>
            ) : (
              <span
                key={`${segment.questionId}-${index}`}
                title={item.comment ?? name}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${left}%` }}
              >
                <span aria-hidden className={dot} />
                <span className="sr-only">{name}</span>
              </span>
            )
          }),
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-body-sm text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${MARKER_CLASS.strength}`} />
          잘한 점
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${MARKER_CLASS.weakness}`} />
          아쉬운 점
        </span>
      </div>
    </div>
  )
}

/**
 * 문항 줄 아래의 근거 목록입니다. "몇 분 몇 초에 왜" 를 글로 보여줍니다 — 마커 툴팁에만 두면 마우스를 올려야 보이고, 터치 ·
 * 키보드로는 보기 어렵습니다. 시각을 누르면 그 구간부터 재생합니다.
 *
 *   답변 00:08 · 말하기 · 아쉬운 점 · 침묵 — 예상 밖 질문에서 8초 동안 말이 멈췄습니다
 */
function EvidenceList({
  segment,
  title,
  onSeek,
}: {
  segment: Segment
  title: string
  onSeek?: Props['onSeek']
}) {
  if (segment.evidence.length === 0) return null

  return (
    <ul className="flex flex-col gap-1.5 pl-1">
      {segment.evidence.map((item, index) => {
        const at = seekSecondsOf(item)
        const time = formatDuration(at)
        // 문항 줄의 시각(트랙 기준)과 헷갈리지 않게 "그 답변 안의 시각" 이라고 붙입니다. 답변 영상의 재생 시각과 같습니다
        const where = item.isReask ? `되묻기 ${time}` : `답변 ${time}`
        return (
          <li key={`${item.questionId}-${index}`} className="flex items-start gap-2 text-body-sm">
            <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${MARKER_CLASS[item.kind]}`} />
            {onSeek ? (
              <button
                type="button"
                onClick={() => onSeek(item.questionId, at, segment.questionId)}
                className="shrink-0 rounded-xs font-semibold tabular-nums text-primary-600 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary-500"
              >
                {where}
                <span className="sr-only"> 구간 보기 — {title}</span>
              </button>
            ) : (
              <span className="shrink-0 font-semibold tabular-nums text-neutral-500">{where}</span>
            )}
            <span className="min-w-0 break-keep text-neutral-700">
              <span className="text-neutral-500">
                {SCORE_AXIS_LABEL[item.axis]} · {KIND_LABEL[item.kind]} ·{' '}
              </span>
              <span className="font-semibold">{item.label}</span>
              {item.comment && <span> — {item.comment}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * XAI 타임라인입니다. (C-01 "XAI 타임라인" · 이슈 #168)
 *
 * 위쪽 트랙에 축별 근거를 마커로 찍고, 아래에 문항별 시작 시각 · 점수 · "구간 보기" 와 그 문항의 근거(시각 · 축 · 이유)를
 * 글로 둡니다. 마커와 "구간 보기" 를 누르면
 * 답변 영상이 그 문항으로 바뀌고 그 시각부터 재생합니다. 되묻기에서 나온 근거는 원 질문 자리에 찍히고, 누르면 되묻기 답변으로
 * 갑니다.
 *
 * 트랙의 시각은 문항 답변을 차례로 이은 길이입니다. 면접 전체 영상이 없어서, 실제로는 문항별 영상 안의 시각으로 옮깁니다.
 * 타임라인을 못 받으면 지금처럼 문항 제목 · 점수만 보여주고 마커와 "구간 보기" 를 뺍니다.
 */
export default function TimelineSection({ turns, timeline, onSeek }: Props) {
  if (turns.length === 0) return null

  const ready = timeline.status === 'ready' ? timeline.timeline : null
  const track = ready ? toSegments(ready) : null
  const hasMarkers = track !== null && track.total > 0 && track.segments.some((segment) => segment.evidence.length > 0)
  const notes = ready ? missingAxisNotes(ready) : []
  const segmentOf = (turn: TurnFlow) => track?.segments.find((segment) => segment.questionNumber === turn.turnId)

  return (
    <Card label="XAI 타임라인" padding="lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-h2 text-neutral-900">XAI 타임라인</h2>
          <p className="text-body-sm text-neutral-500">
            {hasMarkers && onSeek
              ? '근거마다 몇 분 몇 초에 무슨 일이 있었는지 보여줘요. 마커나 시각을 누르면 그 구간의 답변 영상으로 이동해요'
              : '질문별로 어느 구간에서 무슨 일이 있었는지 보여줍니다'}
          </p>
          {notes.map((note) => (
            <p key={note} className="text-body-sm text-neutral-400">
              {note}
            </p>
          ))}
        </div>

        {hasMarkers && track && <MarkerTrack segments={track.segments} total={track.total} onSeek={onSeek} />}

        <ul className="flex flex-col">
          {turns.map((turn) => {
            const segment = segmentOf(turn)
            return (
              <li key={turn.turnId} className="flex flex-col gap-3 border-b border-neutral-200 p-4 last:border-b-0">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="min-w-0 flex-1 text-body-md text-neutral-900">{turn.title}</span>
                  {segment && track && track.total > 0 && (
                    <span className="text-body-sm tabular-nums text-neutral-400">{formatDuration(segment.offset)}</span>
                  )}
                  <span className="w-16 text-right text-stat tabular-nums text-primary-600">
                    {turn.score === null ? '—' : `${turn.score}점`}
                  </span>
                  {segment && onSeek && (
                    <button
                      type="button"
                      onClick={() => onSeek(segment.questionId, 0, segment.questionId)}
                      className="shrink-0 rounded-sm bg-neutral-50 px-3 py-1.5 text-body-sm text-neutral-700 transition-colors hover:bg-neutral-200/60 focus-visible:outline-2 focus-visible:outline-primary-500"
                    >
                      구간 보기
                      <span className="sr-only"> — {turn.title}</span>
                    </button>
                  )}
                </div>
                {segment && <EvidenceList segment={segment} title={turn.title} onSeek={onSeek} />}
              </li>
            )
          })}
        </ul>
      </div>
    </Card>
  )
}
