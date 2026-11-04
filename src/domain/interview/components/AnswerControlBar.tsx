import type { ReactNode } from 'react'

import type { SubmitErrorState } from '../hooks/useInterviewSession'
import type { SessionPhase } from '../types/interview'

import ListeningIndicator from './ListeningIndicator'
import SubmitAnswerButton from './SubmitAnswerButton'

type Props = {
  phase: SessionPhase
  onSubmitAnswer?: () => void
  onExit?: () => void
  /** 자막 표시 토글. 켜져 있으면 흰 버튼으로 보인다. */
  captionVisible: boolean
  onToggleCaption: () => void
  /** waitingNextQuestion 단계 안내 문구("답변 정리 중" 등). 그 외 단계에서는 무시된다. */
  progressLabel?: string | null
  /** STT_FAILED 등으로 재녹음이 필요한 상태 */
  needsRerecord?: boolean
  submitError?: SubmitErrorState | null
  /** 질문당 남은 시간(초). null 이면 제한 없음이라 표시하지 않는다. "답변 듣는 중" 알약 안에 보여준다. */
  remainingSec?: number | null
}

const ROUND_BUTTON = 'flex h-13 w-13 items-center justify-center rounded-full border-0'

/**
 * 마이크 · 카메라 토글 자리입니다. **지금은 UI 만 있고 눌러도 동작하지 않습니다(비활성).**
 * 면접 중 마이크를 끄면 답변 녹음이 무음이 되어 STT 가 실패하고, 카메라를 끄면 영상 분석 근거가 빠집니다.
 * 동작시키려면 경고 · 제출 차단 · 서버 처리 규칙이 먼저 필요하다.
 */
function PlaceholderToggle({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled
      aria-label={`${label} (준비 중)`}
      title={`${label} — 준비 중`}
      className={`${ROUND_BUTTON} cursor-not-allowed bg-stage-surface-hover/80 text-stage-text opacity-50`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="h-8 w-px bg-stage-border" aria-hidden="true" />
}

/**
 * 하단 조작부(알약형 독)입니다. `[마이크][카메라][CC] | [답변 듣는 중][답변 완료 ✓] | [종료]`.
 * 남은 시간 · 안내 · 에러 문구는 독 위에 한 줄씩 쌓는다.
 */
export default function AnswerControlBar({
  phase,
  onSubmitAnswer,
  onExit,
  captionVisible,
  onToggleCaption,
  progressLabel = null,
  needsRerecord = false,
  submitError = null,
  remainingSec = null,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      {phase === 'waitingNextQuestion' && progressLabel && (
        <span className="text-body-sm text-stage-sub">{progressLabel}</span>
      )}

      {needsRerecord && (
        <span className="text-body-sm text-semantic-danger">답변이 잘 들리지 않았어요. 다시 답변해주세요.</span>
      )}

      {submitError && <span className="text-body-sm text-semantic-danger">{submitError.message}</span>}

      <div className="flex items-center gap-4 rounded-full bg-stage-surface/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <PlaceholderToggle label="마이크">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="9" y="3" width="6" height="12" rx="3" />
              <path d="M5 11a7 7 0 0014 0M12 18v3" strokeLinecap="round" />
            </svg>
          </PlaceholderToggle>
          <PlaceholderToggle label="카메라">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="2" y="6" width="14" height="12" rx="2" />
              <path d="M16 10l6-3v10l-6-3" strokeLinejoin="round" />
            </svg>
          </PlaceholderToggle>
          <button
            type="button"
            onClick={onToggleCaption}
            aria-pressed={captionVisible}
            aria-label={captionVisible ? '실시간 자막 끄기' : '실시간 자막 켜기'}
            className={`${ROUND_BUTTON} text-body-lg ${
              captionVisible ? 'bg-stage-cta text-stage-cta-text' : 'bg-stage-surface-hover/80 text-stage-text hover:bg-stage-border'
            }`}
          >
            CC
          </button>
        </div>

        <Divider />

        <div className="flex items-center gap-3">
          <ListeningIndicator active={phase === 'answering'} remainingSec={remainingSec} />
          {/* waitingNextQuestion · submitting · finished 모두 중복 제출 방지를 위해 비활성화한다. */}
          <SubmitAnswerButton disabled={phase !== 'answering'} loading={phase === 'submitting'} onClick={onSubmitAnswer} />
        </div>

        <Divider />

        <button
          type="button"
          onClick={onExit}
          aria-label="면접 종료"
          className={`${ROUND_BUTTON} bg-semantic-danger text-neutral-0 hover:opacity-90`}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
