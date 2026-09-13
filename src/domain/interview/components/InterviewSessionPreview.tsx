import { useRef, useState } from 'react'

import type { DeviceStatus, InterviewerStyle, Question, QuestionType, SessionPhase } from '../types/interview'

import DeviceStatusChip from './DeviceStatusChip'
import InterviewSessionPage from './InterviewSessionPage'
import QuestionCard from './QuestionCard'

/**
 * B-01 확인용 프리뷰입니다. 실제 서비스 라우트가 아니라 개발 중 시안 대조용이고,
 * 리뷰 끝나면 라우트(App 라우터의 /dev/interview-preview)와 함께 지워도 됩니다.
 *
 * 검증 기준은 위쪽의 "전체 폭 단일 렌더"다. 여러 상태를 한 화면에 욱여넣으면
 * 각 화면이 뷰포트 절반 폭에 눌려서 실제 시안과 비율을 대조할 수 없다 —
 * 아래쪽 "조합 그리드"는 회귀(예: 배지 색 실수로 되돌아가는 것) 확인용 보조자료일 뿐,
 * 여백·정렬 같은 레이아웃 검증은 반드시 전체 폭 렌더에서 한다.
 */

const QUESTION_TYPES: QuestionType[] = ['QUESTION', 'FOLLOWUP', 'REASK']
const PHASES: SessionPhase[] = ['presenting', 'answering', 'submitting', 'waitingNextQuestion', 'finished']
const DEVICE_STATUSES: DeviceStatus[] = ['ok', 'warning']
const INTERVIEWER_STYLES: InterviewerStyle[] = ['friendly', 'pressure']
const SPEAKING_INTENSITIES = [0, 0.3, 0.7, 1] as const

const SAMPLE_TEXT: Record<QuestionType, string> = {
  QUESTION: '포트폴리오에 랜덤 포레스트를 쓰셨네요. 왜 이 모델을 선택하셨나요?',
  FOLLOWUP: '방금 답변에서 언급한 전처리 과정을 조금 더 자세히 설명해 주시겠어요?',
  REASK: '죄송하지만 답변이 잘 들리지 않았어요. 다시 한 번 말씀해 주시겠어요?',
}

const DEVICE_STATUS_MESSAGE: Record<DeviceStatus, string> = {
  ok: '카메라 · 마이크 정상',
  warning: '마이크 입력이 약해요',
}

function buildQuestion(questionType: QuestionType, audioAvailable: boolean): Question {
  return {
    questionId: `preview-${questionType}`,
    questionType,
    text: SAMPLE_TEXT[questionType],
    audioUrl: audioAvailable ? 'https://example.com/tts.mp3' : null,
    audioAvailable,
    category: questionType === 'REASK' ? null : '프로젝트경험',
    difficulty: questionType === 'REASK' ? null : 'L2',
    questionNumber: 2,
    questionTotal: 6,
  }
}

function ControlGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  formatOption,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
  formatOption?: (value: T) => string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-body-sm text-neutral-500">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-xs border px-2 py-1 text-body-sm ${
              option === value
                ? 'border-primary-500 bg-primary-100 text-primary-600'
                : 'border-neutral-300 text-neutral-700'
            }`}
          >
            {formatOption ? formatOption(option) : option}
          </button>
        ))}
      </div>
    </div>
  )
}

type PreviewState = {
  questionType: QuestionType
  hideQuestionText: boolean
  audioAvailable: boolean
  phase: SessionPhase
  deviceStatus: DeviceStatus
  interviewerStyle: InterviewerStyle
  hasCameraStream: boolean
  speakingIntensity: number
}

const INITIAL_STATE: PreviewState = {
  questionType: 'QUESTION',
  hideQuestionText: false,
  audioAvailable: true,
  phase: 'answering',
  deviceStatus: 'ok',
  interviewerStyle: 'friendly',
  hasCameraStream: false,
  speakingIntensity: 0,
}

const MIN_WIDTH_PX = 1024

/**
 * 검증 기준: 매 순간 상태 하나만 전체 폭으로 렌더링한다. 여러 상태는 컨트롤로 바꿔가며 본다.
 */
function LiveFullWidthPreview() {
  const [state, setState] = useState<PreviewState>(INITIAL_STATE)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const set = <K extends keyof PreviewState>(key: K) => (value: PreviewState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 text-neutral-900">전체 폭 단일 렌더 (검증 기준)</h2>
        <p className="text-body-sm text-neutral-500">
          아래 컨트롤로 상태를 바꿔가며 실제 화면 폭에서 시안과 대조한다. 이 화면은
          {` ${MIN_WIDTH_PX}px`} 미만 반응형을 지원하지 않는다 — 뷰포트가 좁으면
          InterviewSessionPage 에 명시된 min-width 때문에 가로 스크롤이 생기는 게 정상이며,
          그 이하 폭은 시안 검증 대상이 아니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 rounded-lg border border-neutral-200 bg-neutral-0 p-4">
        <ControlGroup label="questionType" value={state.questionType} options={QUESTION_TYPES} onChange={set('questionType')} />
        <ControlGroup
          label="hideQuestionText"
          value={String(state.hideQuestionText) as 'true' | 'false'}
          options={['false', 'true']}
          onChange={(v) => set('hideQuestionText')(v === 'true')}
        />
        <ControlGroup
          label="audioAvailable"
          value={String(state.audioAvailable) as 'true' | 'false'}
          options={['true', 'false']}
          onChange={(v) => set('audioAvailable')(v === 'true')}
        />
        <ControlGroup label="phase" value={state.phase} options={PHASES} onChange={set('phase')} />
        <ControlGroup label="deviceStatus" value={state.deviceStatus} options={DEVICE_STATUSES} onChange={set('deviceStatus')} />
        <ControlGroup
          label="interviewerStyle"
          value={state.interviewerStyle}
          options={INTERVIEWER_STYLES}
          onChange={set('interviewerStyle')}
        />
        <ControlGroup
          label="hasCameraStream"
          value={String(state.hasCameraStream) as 'true' | 'false'}
          options={['false', 'true']}
          onChange={(v) => set('hasCameraStream')(v === 'true')}
        />
        <div className="flex flex-col gap-1">
          <span className="text-body-sm text-neutral-500">speakingIntensity</span>
          <div className="flex flex-wrap gap-1">
            {SPEAKING_INTENSITIES.map((intensity) => (
              <button
                key={intensity}
                type="button"
                onClick={() => set('speakingIntensity')(intensity)}
                className={`rounded-xs border px-2 py-1 text-body-sm ${
                  intensity === state.speakingIntensity
                    ? 'border-primary-500 bg-primary-100 text-primary-600'
                    : 'border-neutral-300 text-neutral-700'
                }`}
              >
                {intensity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* min-w 때문에 좁은 뷰포트에서는 자연스럽게 가로 스크롤이 생긴다 (겹침·잘림 대신). */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <InterviewSessionPage
          videoRef={videoRef}
          onExit={() => {}}
          recordingElapsedSec={13}
          interviewerStyle={state.interviewerStyle}
          sessionElapsedSec={324}
          sessionLimitSec={900}
          deviceStatus={state.deviceStatus}
          deviceStatusMessage={DEVICE_STATUS_MESSAGE[state.deviceStatus]}
          speakingIntensity={state.speakingIntensity}
          hasCameraStream={state.hasCameraStream}
          caption="저는 데이터 분석 프로젝트에서 전처리를 담당했고..."
          question={buildQuestion(state.questionType, state.audioAvailable)}
          hideQuestionText={state.hideQuestionText}
          phase={state.phase}
        />
      </div>
    </section>
  )
}

function ComboLabel({ text }: { text: string }) {
  return <p className="text-body-sm text-neutral-500">{text}</p>
}

function QuestionCardComboGrid() {
  const HIDE_OPTIONS = [false, true]
  const AUDIO_OPTIONS = [true, false]
  const CARD_PHASES: SessionPhase[] = ['presenting', 'answering', 'submitting']

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {QUESTION_TYPES.flatMap((questionType) =>
        HIDE_OPTIONS.flatMap((hideQuestionText) =>
          AUDIO_OPTIONS.flatMap((audioAvailable) =>
            CARD_PHASES.map((phase) => {
              const key = `${questionType}-${hideQuestionText}-${audioAvailable}-${phase}`
              return (
                <div key={key} className="flex flex-col gap-2">
                  <ComboLabel
                    text={`${questionType} · hideQuestionText=${hideQuestionText} · audioAvailable=${audioAvailable} · phase=${phase}`}
                  />
                  <QuestionCard
                    question={buildQuestion(questionType, audioAvailable)}
                    hideQuestionText={hideQuestionText}
                    phase={phase}
                  />
                </div>
              )
            }),
          ),
        ),
      )}
    </div>
  )
}

export default function InterviewSessionPreview() {
  return (
    <div className="flex flex-col gap-10 bg-neutral-50 p-8">
      <h1 className="text-h1 text-neutral-900">InterviewSessionPage 프리뷰 (B-01 확인용)</h1>

      <LiveFullWidthPreview />

      <section className="flex flex-col gap-4 border-t border-neutral-200 pt-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-h2 text-neutral-900">조합 그리드 (회귀 확인용 보조자료 — 검증 기준 아님)</h2>
          <p className="text-body-sm text-neutral-500">
            카드가 뷰포트 절반 이하 폭으로 눌려 있어 여백·비율 검증에는 쓰지 않는다.
            FOLLOWUP/REASK 배지 색·아이콘이 실수로 뒤섞이지 않았는지처럼 좁은 폭에서도
            드러나는 회귀만 여기서 훑는다.
          </p>
        </div>

        {DEVICE_STATUSES.map((deviceStatus) => (
          <div key={deviceStatus} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-body-lg text-neutral-900">deviceStatus = {deviceStatus}</h3>
              <DeviceStatusChip status={deviceStatus} message={DEVICE_STATUS_MESSAGE[deviceStatus]} />
            </div>

            <QuestionCardComboGrid />
          </div>
        ))}
      </section>
    </div>
  )
}
