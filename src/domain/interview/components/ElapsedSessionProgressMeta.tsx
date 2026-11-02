import { useElapsedSec } from '../hooks/useElapsedSec'

import SessionProgressMeta from './SessionProgressMeta'

type Props = {
  questionNumber: number | null
  questionTotal: number
  /** 첫 질문이 도착한 시각(epoch ms). 도착 전이면 null. */
  sessionStartedAt: number | null
  isSessionFinished: boolean
  limitSec: number | null
}

/** 매초 리렌더를 이 컴포넌트 안에 가두려고 useElapsedSec 을 여기서 호출한다. */
export default function ElapsedSessionProgressMeta({ questionNumber, questionTotal, sessionStartedAt, isSessionFinished, limitSec }: Props) {
  const elapsedSec = useElapsedSec(sessionStartedAt, isSessionFinished)

  return <SessionProgressMeta questionNumber={questionNumber} questionTotal={questionTotal} elapsedSec={elapsedSec} limitSec={limitSec} />
}
