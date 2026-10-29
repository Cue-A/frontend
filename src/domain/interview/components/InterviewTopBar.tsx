import type { InterviewerStyle } from '../types/interview'

import ExitButton from './ExitButton'
import InterviewerStyleBadge from './InterviewerStyleBadge'
import RecordingIndicator from './RecordingIndicator'
import SessionProgressMeta from './SessionProgressMeta'

type Props = {
  onExit?: () => void
  recordingElapsedSec: number
  interviewerStyle: InterviewerStyle
  questionNumber: number | null
  questionTotal: number
  sessionElapsedSec: number
  sessionLimitSec: number | null
}

export default function InterviewTopBar({
  onExit,
  recordingElapsedSec,
  interviewerStyle,
  questionNumber,
  questionTotal,
  sessionElapsedSec,
  sessionLimitSec,
}: Props) {
  return (
    // 좌(종료·REC) / 중앙(면접관 모드 배지) / 우(진행 메타) 3분할. 배지를 항상 정중앙에
    // 두기 위해 좌우 폭이 달라도 흔들리지 않는 grid-cols-[1fr_auto_1fr]를 쓴다.
    <header className="grid h-18 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-neutral-200 bg-neutral-0 px-10">
      <div className="flex items-center gap-4">
        <ExitButton onClick={onExit} />
        <RecordingIndicator elapsedSec={recordingElapsedSec} />
      </div>

      <InterviewerStyleBadge interviewerStyle={interviewerStyle} />

      <div className="justify-self-end">
        <SessionProgressMeta
          questionNumber={questionNumber}
          questionTotal={questionTotal}
          elapsedSec={sessionElapsedSec}
          limitSec={sessionLimitSec}
        />
      </div>
    </header>
  )
}
