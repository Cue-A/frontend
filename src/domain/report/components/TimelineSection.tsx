import Card from '@/shared/ui/Card'

import type { TurnFlow } from '../types/report'

type Props = {
  turns: TurnFlow[]
}

function formatSeconds(seconds: number) {
  const total = Math.floor(seconds)
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

/**
 * XAI 타임라인입니다. (C-01 "XAI 타임라인")
 *
 * 시안의 마커 트랙과 "구간 보기" 버튼은 답변 영상이 있어야 의미가 있어서
 * 이번에는 넣지 않았습니다. 영상 재생이 들어오면 여기에 붙입니다.
 * 지금은 질문별 시작 시각과 점수를 목록으로 보여줍니다.
 */
export default function TimelineSection({ turns }: Props) {
  if (turns.length === 0) return null

  return (
    <Card label="XAI 타임라인" padding="lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-h2 text-neutral-900">XAI 타임라인</h2>
          <p className="text-body-sm text-neutral-500">
            질문별로 어느 구간에서 무슨 일이 있었는지 보여줍니다
          </p>
        </div>

        <ul className="flex flex-col">
          {turns.map((turn) => (
            <li
              key={turn.turnId}
              className="flex flex-wrap items-center gap-4 border-b border-neutral-200 p-4 last:border-b-0"
            >
              <span className="min-w-0 flex-1 text-body-md text-neutral-900">{turn.title}</span>
              <span className="text-body-sm tabular-nums text-neutral-500">
                {turn.endSeconds === null
                  ? formatSeconds(turn.startSeconds)
                  : `${formatSeconds(turn.startSeconds)} – ${formatSeconds(turn.endSeconds)}`}
              </span>
              <span className="w-16 text-right text-stat tabular-nums text-primary-600">
                {turn.score === null ? '—' : `${turn.score}점`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
