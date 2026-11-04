import { formatDuration } from '@/shared/lib/formatDuration'

type Props = {
  questionNumber: number | null
  questionTotal: number
  elapsedSec: number
  limitSec: number | null
}

/**
 * 상단바 우측 진행 메타입니다. 질문 수만큼 나뉜 진행 막대 + "질문 N / M" + 시계 알약.
 * "질문 N / M" 형태만 쓴다 — "주제 N / M" 은 쓰지 않는다 (백엔드 확정 사항).
 */
export default function SessionProgressMeta({ questionNumber, questionTotal, elapsedSec, limitSec }: Props) {
  const current = questionNumber ?? 0

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-end gap-1.5 pt-2">
        <div className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: questionTotal }, (_, index) => (
            <span key={index} className={`h-1 w-9 rounded-full ${index < current ? 'bg-primary-500' : 'bg-stage-border'}`} />
          ))}
        </div>
        <span className="text-body-sm text-stage-sub">
          질문 {questionNumber ?? '—'} / {questionTotal}
        </span>
      </div>

      {/* 폭 고정: 숫자 폭이 글자마다 달라(1 · 0 …) 매초 박스가 흔들리지 않게 tabular-nums + 고정 폭을 쓴다. 제한 시간 유무로 폭이 둘 중 하나다. */}
      <div
        className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-stage-surface/70 px-4 text-body-md tabular-nums text-stage-text ${
          limitSec !== null ? 'w-44' : 'w-28'
        }`}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{formatDuration(elapsedSec)}</span>
        {limitSec !== null && <span className="text-stage-sub">/ {formatDuration(limitSec)}</span>}
      </div>
    </div>
  )
}
