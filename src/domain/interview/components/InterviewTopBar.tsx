import type { InterviewerStyle } from '../types/interview'

import ElapsedSessionProgressMeta from './ElapsedSessionProgressMeta'
import InterviewerStyleBadge from './InterviewerStyleBadge'
import RecordingIndicator from './RecordingIndicator'

type Props = {
  recordingStartedAt: number | null
  interviewerStyle: InterviewerStyle
  jobRole?: string | null
  companyName?: string | null
  questionNumber: number | null
  questionTotal: number
  sessionStartedAt: number | null
  isSessionFinished: boolean
  sessionLimitSec: number | null
}

export default function InterviewTopBar({
  recordingStartedAt,
  interviewerStyle,
  jobRole = null,
  companyName = null,
  questionNumber,
  questionTotal,
  sessionStartedAt,
  isSessionFinished,
  sessionLimitSec,
}: Props) {
  return (
    // 좌(REC) / 중앙(면접관 모드 배지) / 우(진행 메타) 3분할. 배지를 항상 정중앙에
    // 두기 위해 좌우 폭이 달라도 흔들리지 않는 grid-cols-[1fr_auto_1fr]를 쓴다.
    <header className="grid h-24 grid-cols-[1fr_auto_1fr] items-center gap-4 px-10">
      <div className="flex items-center gap-4">
        {recordingStartedAt !== null && <RecordingIndicator />}
      </div>

      <InterviewerStyleBadge interviewerStyle={interviewerStyle} jobRole={jobRole} companyName={companyName} />

      <div className="justify-self-end">
        <ElapsedSessionProgressMeta
          questionNumber={questionNumber}
          questionTotal={questionTotal}
          sessionStartedAt={sessionStartedAt}
          isSessionFinished={isSessionFinished}
          limitSec={sessionLimitSec}
        />
      </div>
    </header>
  )
}
