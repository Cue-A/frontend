import { IconMicrophone, IconMicrophoneOff, IconVideo, IconVideoOff } from '@tabler/icons-react'
import type { ReactNode } from 'react'

import type { SubmitErrorState } from '../hooks/useInterviewSession'
import type { SessionPhase } from '../types/interview'

import ListeningIndicator from './ListeningIndicator'
import SubmitAnswerButton from './SubmitAnswerButton'

type Props = {
  phase: SessionPhase
  onSubmitAnswer?: () => void
  /** 자막 표시 토글. 켜져 있으면 흰 버튼으로 보인다. */
  captionVisible: boolean
  onToggleCaption: () => void
  /** 마이크 · 카메라가 켜져 있는지(연결 상태). 표시만 하고 끄는 기능은 없다. */
  micOn: boolean
  cameraOn: boolean
  /** STT_FAILED 등으로 재녹음이 필요한 상태 */
  needsRerecord?: boolean
  submitError?: SubmitErrorState | null
  /** 질문당 남은 시간(초). null 이면 제한 없음이라 표시하지 않는다. "답변 듣는 중" 알약 안에 보여준다. */
  remainingSec?: number | null
}

const ROUND_BUTTON = 'flex h-13 w-13 items-center justify-center rounded-full border-0'

/**
 * 마이크 · 카메라가 켜져 있는지 보여주는 **상태 표시**입니다. 버튼이 아니라서 누를 수 없다.
 * 면접 중 끄는 기능은 두지 않는다 — 마이크를 끄면 답변 녹음이 무음이 되어 STT 가 실패하고, 카메라를 끄면 영상 분석
 * 근거가 빠진다. 연결이 끊겼으면 아이콘을 흐리게 하고 사선(\)을 긋는다. 자막 버튼(CC)도 같은 모양을 쓴다.
 */
const ICON_BUTTON = `${ROUND_BUTTON} relative bg-stage-surface-hover/80`

/** 꺼진 것을 알리는 사선. CC 버튼이 쓴다. 마이크 · 카메라는 Tabler 의 Off 아이콘이 사선을 포함한다. */
function OffSlash() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className="absolute" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 4l16 16" strokeLinecap="round" />
    </svg>
  )
}

function DeviceStatusIcon({ label, on, children }: { label: string; on: boolean; children: ReactNode }) {
  return (
    <span
      role="img"
      aria-label={`${label} ${on ? '켜짐' : '꺼짐'}`}
      className={`${ICON_BUTTON} ${on ? 'text-stage-text' : 'text-stage-muted'}`}
    >
      {children}
    </span>
  )
}

function Divider() {
  return <span className="h-8 w-px bg-stage-border" aria-hidden="true" />
}

/**
 * 하단 조작부(알약형 독)입니다. `[마이크 상태][카메라 상태][CC] | [답변 듣는 중][답변 완료 ✓]`. 면접 종료는 상단바 왼쪽 위 X 버튼이 맡는다.
 * 재녹음 · 제출 에러 문구는 독 위에 한 줄씩 쌓는다. (제출 중 진행 문구는 질문 카드의 자막 자리에 보여준다)
 */
export default function AnswerControlBar({
  phase,
  onSubmitAnswer,
  captionVisible,
  onToggleCaption,
  micOn,
  cameraOn,
  needsRerecord = false,
  submitError = null,
  remainingSec = null,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      {needsRerecord && (
        <span className="text-body-sm text-semantic-danger">답변이 잘 들리지 않았어요. 다시 답변해주세요.</span>
      )}

      {submitError && <span className="text-body-sm text-semantic-danger">{submitError.message}</span>}

      <div className="flex items-center gap-4 rounded-full bg-stage-surface/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <DeviceStatusIcon label="마이크" on={micOn}>
            {micOn ? <IconMicrophone size={22} aria-hidden="true" /> : <IconMicrophoneOff size={22} aria-hidden="true" />}
          </DeviceStatusIcon>
          <DeviceStatusIcon label="카메라" on={cameraOn}>
            {cameraOn ? <IconVideo size={22} aria-hidden="true" /> : <IconVideoOff size={22} aria-hidden="true" />}
          </DeviceStatusIcon>
          <button
            type="button"
            onClick={onToggleCaption}
            aria-pressed={captionVisible}
            aria-label={captionVisible ? '실시간 자막 끄기' : '실시간 자막 켜기'}
            className={`${ICON_BUTTON} text-body-lg hover:bg-stage-border ${captionVisible ? 'text-stage-text' : 'text-stage-muted'}`}
          >
            CC
            {!captionVisible && <OffSlash />}
          </button>
        </div>

        <Divider />

        <div className="flex items-center gap-3">
          <ListeningIndicator active={phase === 'answering'} remainingSec={remainingSec} />
          {/* waitingNextQuestion · submitting · finished 모두 중복 제출 방지를 위해 비활성화한다. */}
          <SubmitAnswerButton disabled={phase !== 'answering'} loading={phase === 'submitting'} onClick={onSubmitAnswer} />
        </div>
      </div>
    </div>
  )
}
