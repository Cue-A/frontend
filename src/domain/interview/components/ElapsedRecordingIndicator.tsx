import { useElapsedSec } from '../hooks/useElapsedSec'

import RecordingIndicator from './RecordingIndicator'

type Props = {
  /** 답변 녹화를 시작한 시각(epoch ms). 녹화 중이 아니면 null — 이때는 REC 표시를 숨긴다. */
  recordingStartedAt: number | null
}

/** 매초 리렌더를 이 컴포넌트 안에 가두려고 useElapsedSec 을 여기서 호출한다. */
export default function ElapsedRecordingIndicator({ recordingStartedAt }: Props) {
  const elapsedSec = useElapsedSec(recordingStartedAt)

  if (recordingStartedAt === null) return null
  return <RecordingIndicator elapsedSec={elapsedSec} />
}
