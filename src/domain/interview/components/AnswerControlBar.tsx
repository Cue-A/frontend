import type { SubmitErrorState } from '../hooks/useInterviewSession'
import { formatDuration } from '@/shared/lib/formatDuration'
import type { SessionPhase } from '../types/interview'

import ListeningIndicator from './ListeningIndicator'
import SubmitAnswerButton from './SubmitAnswerButton'

type Props = {
  phase: SessionPhase
  onSubmitAnswer?: () => void
  /** waitingNextQuestion 단계 안내 문구("답변 정리 중" 등). 그 외 단계에서는 무시된다. */
  progressLabel?: string | null
  /** STT_FAILED 등으로 재녹음이 필요한 상태 */
  needsRerecord?: boolean
  submitError?: SubmitErrorState | null
  /** 질문당 남은 시간(초). null 이면 제한 없음이라 표시하지 않는다. answering 단계에서만 보여준다. */
  remainingSec?: number | null
  /** 답변 녹화 업로드 실패 문구. 텍스트 제출과는 별개 트랙이라 submitError 와 따로 둔다. */
  recordingFailureMessage?: string | null
}

export default function AnswerControlBar({
  phase,
  onSubmitAnswer,
  progressLabel = null,
  needsRerecord = false,
  submitError = null,
  remainingSec = null,
  recordingFailureMessage = null,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      {phase === 'answering' && remainingSec !== null && (
        <span className="text-body-sm text-neutral-500">남은 시간 {formatDuration(remainingSec)}</span>
      )}

      {phase === 'waitingNextQuestion' && progressLabel && (
        <span className="text-body-sm text-neutral-500">{progressLabel}</span>
      )}

      {needsRerecord && (
        <span className="text-body-sm text-semantic-danger">답변이 잘 들리지 않았어요. 다시 답변해주세요.</span>
      )}

      {submitError && <span className="text-body-sm text-semantic-danger">{submitError.message}</span>}

      {recordingFailureMessage && (
        <span className="text-body-sm text-semantic-danger">{recordingFailureMessage}</span>
      )}

      <div className="flex items-center justify-center gap-4">
        <ListeningIndicator active={phase === 'answering'} />
        {/* waitingNextQuestion · submitting · finished 모두 중복 제출 방지를 위해 비활성화한다. */}
        <SubmitAnswerButton disabled={phase !== 'answering'} loading={phase === 'submitting'} onClick={onSubmitAnswer} />
      </div>
    </div>
  )
}
