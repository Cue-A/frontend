import { formatDuration } from '../lib/formatDuration'

type Props = {
  elapsedSec: number
}

/** "REC 0:13" — 녹화 경과 시간. 타이머는 상위(B-01-2)가 소유하고 여기서는 초 값만 그린다. */
export default function RecordingIndicator({ elapsedSec }: Props) {
  return (
    <div className="flex items-center gap-2 text-body-md text-semantic-danger">
      <span className="h-2.5 w-2.5 rounded-full bg-semantic-danger" aria-hidden="true" />
      <span>REC {formatDuration(elapsedSec)}</span>
    </div>
  )
}
