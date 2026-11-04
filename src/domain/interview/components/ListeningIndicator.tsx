import { formatDuration } from '@/shared/lib/formatDuration'

type Props = {
  active: boolean
  /** 질문당 남은 시간(초). null 이면 제한이 없어 표시하지 않는다. 답변 중이 아니면 자리만 지키고 `--:--` 로 둔다. */
  remainingSec?: number | null
}

const BAR_HEIGHTS = ['h-2', 'h-4', 'h-6', 'h-4', 'h-5', 'h-3', 'h-2'] as const

/**
 * "답변 듣는 중 · 01:23 남음" — 파란 파형 + 연한 알약. 답변 중에만 파형이 움직인다.
 * 남은 시간은 숫자 폭을 맞추고(tabular-nums) 답변 중이 아닐 때도 자리를 지켜서, 단계가 바뀌어도 독 폭이 흔들리지 않는다.
 */
export default function ListeningIndicator({ active, remainingSec = null }: Props) {
  return (
    <span className={`flex h-13 w-fit items-center gap-3 rounded-full bg-stage-surface-hover/80 px-5 text-body-md text-stage-soft ${active ? '' : 'opacity-50'}`}>
      <span className="flex h-6 items-center gap-0.75" aria-hidden="true">
        {BAR_HEIGHTS.map((height, index) => (
          <span
            key={index}
            style={{ animationDelay: `${index * 120}ms` }}
            className={`w-0.75 rounded-full bg-semantic-info ${height} ${active ? 'motion-safe:animate-pulse' : ''}`}
          />
        ))}
      </span>
      답변 듣는 중
      {remainingSec !== null && (
        <span className="tabular-nums text-stage-sub">
          {active ? formatDuration(remainingSec) : '--:--'} 남음
        </span>
      )}
    </span>
  )
}
