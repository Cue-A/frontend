import type { SessionPhase } from '../types/interview'

import ListeningIndicator from './ListeningIndicator'
import SubmitAnswerButton from './SubmitAnswerButton'

type Props = {
  phase: SessionPhase
  onSubmitAnswer?: () => void
}

export default function AnswerControlBar({ phase, onSubmitAnswer }: Props) {
  return (
    <div className="flex items-center justify-center gap-4">
      <ListeningIndicator active={phase === 'answering'} />
      <SubmitAnswerButton disabled={phase === 'presenting'} loading={phase === 'submitting'} onClick={onSubmitAnswer} />
    </div>
  )
}
