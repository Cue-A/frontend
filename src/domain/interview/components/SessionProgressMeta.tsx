import { formatDuration } from '../lib/formatDuration'

type Props = {
  questionNumber: number | null
  questionTotal: number
  elapsedSec: number
  limitSec: number | null
}

/**
 * 상단바 우측 진행 메타 2줄입니다.
 * "질문 N / M" 형태만 쓴다 — "주제 N / M" 은 쓰지 않는다 (백엔드 확정 사항).
 */
export default function SessionProgressMeta({ questionNumber, questionTotal, elapsedSec, limitSec }: Props) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-body-md text-neutral-500">
        질문 {questionNumber ?? '—'}/{questionTotal}
      </span>
      <span className="text-body-md text-neutral-500">
        {formatDuration(elapsedSec)} {limitSec !== null && `/ ${formatDuration(limitSec)}`}
      </span>
    </div>
  )
}
