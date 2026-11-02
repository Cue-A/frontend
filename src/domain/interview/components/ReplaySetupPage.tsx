import { IconAlertTriangle, IconRepeat } from '@tabler/icons-react'
import { useId, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ROUTES, toDeviceCheck, toReplay } from '@/app/routes'
import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { createSession } from '../api/sessionApi'
import { useReplayOptions } from '../hooks/useReplayOptions'
import type { ReplayDeviceCheckState } from '../lib/replayDeviceCheckState'
import { REPLAY_START_MESSAGES } from '../lib/replayMessages'
import { labelOf } from '../lib/setupSummaryValues'
import type { ReplayOptions } from '../types/replay'
import {
  ANSWER_SECONDS_CHOICES,
  DEFAULT_ANSWER_SECONDS,
  DELIVERY_MODES,
  INTERVIEWER_STYLES,
  NO_TIME_LIMIT,
  type Company,
  type DeliveryMode,
  type SessionSetup,
} from '../types/sessionSetup'

import ChipGroup from './ChipGroup'
import InterviewFlowHeader from './InterviewFlowHeader'
import SetupSummary from './SetupSummary'

/** 셀렉트 모양은 옵션 설정과 같습니다 */
const FIELD_CLASS =
  'rounded-sm border border-neutral-200 bg-neutral-0 px-4 py-3 text-body-md text-neutral-900'

/** 칸 위의 항목 이름. 옵션 설정과 같은 글자입니다 */
const FIELD_LABEL_CLASS = 'flex items-center gap-2 text-body-lg font-semibold text-neutral-900'

/** 재연습 조건 + 이번에 고른 답변 시간 · 진행 방식을 옵션 설정과 같은 모양으로 합칩니다 */
function toReplaySetup(options: ReplayOptions, answerSeconds: number | null, deliveryMode: DeliveryMode): SessionSetup {
  return {
    jobRole: options.jobRole,
    resume: { documentId: options.documentId, title: options.documentTitle, fileName: null, fileSize: null },
    useCompanyQuestion: options.companyId !== null,
    // 화면은 기업 id 를 문자열로 씁니다. 보낼 때 세션 시작이 다시 숫자로 바꿉니다
    companyId: options.companyId === null ? null : String(options.companyId),
    customCulture: '',
    answerSeconds,
    questionCount: options.questionCount,
    interviewerStyle: options.interviewerStyle,
    deliveryMode,
  }
}

/** 설정 요약이 기업명을 찾는 목록입니다. 재연습은 기업이 하나뿐이라 그 하나만 둡니다 */
function companiesOf(options: ReplayOptions): Company[] {
  if (options.companyId === null || !options.companyName) return []
  return [{ companyId: String(options.companyId), name: options.companyName }]
}

function StatusCard({ children }: { children: ReactNode }) {
  return (
    <Card padding="lg" className="flex flex-col items-start gap-4">
      {children}
    </Card>
  )
}

/**
 * 재연습 설정 화면입니다. (이슈 #152)
 *
 * 재연습은 **첫 면접과 같은 질문으로 다시 보는 것**입니다. 주질문은 1회차 그대로 나오고 꼬리질문만 새 답변에 맞춰
 * 새로 나옵니다(백엔드 docs/12-replay.md). 그래서 질문을 정하는 조건 다섯 개(자기소개서 · 기업 · 직무 · 질문 수 ·
 * 면접관)는 첫 면접 값으로 고정되고 바꿀 수 없습니다 — 하나라도 다르면 백엔드가 거절합니다. 이 화면에서는 질문에
 * 영향이 없는 답변 시간과 진행 방식만 고릅니다.
 *
 * 주소의 `sessionId` 는 재연습할 면접(몇 회차든)입니다. 조건은 늘 1회차 값으로 옵니다.
 *
 * 첫 면접의 자기소개서가 지워졌거나 기업 정보를 쓸 수 없게 되면 이유를 보여주고 시작 버튼을 막습니다. 조건을 바꿀 수
 * 없어서 다른 문서로 바꾸라고 하지 않고, 새 면접으로 안내합니다.
 *
 * 시안이 없어 옵션 설정(A-05)의 카드 · 설정 요약 모양을 그대로 씁니다.
 */
export default function ReplaySetupPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const state = useReplayOptions(sessionId)
  const answerSecondsId = useId()
  const fixedHeadingId = useId()

  const [answerSeconds, setAnswerSeconds] = useState<number | null>(DEFAULT_ANSWER_SECONDS)
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('TEXT_VOICE')
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (state.status === 'loading') {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <InterviewFlowHeader current={1} />
        <StatusCard>
          <p className="text-body-md text-neutral-500">첫 면접의 조건을 불러오는 중이에요…</p>
        </StatusCard>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <InterviewFlowHeader current={1} />
        <StatusCard>
          <p role="alert" className="text-body-md text-neutral-700">
            {state.message}
          </p>
          <Button variant="primary" size="sm" to={ROUTES.SESSION_SETUP}>
            새 면접 설정하기
          </Button>
        </StatusCard>
      </div>
    )
  }

  const { options } = state
  const setup = toReplaySetup(options, answerSeconds, deliveryMode)

  const fixedRows = [
    { label: '자기소개서', value: options.documentTitle },
    { label: '기업', value: options.companyName ?? '선택 안 함' },
    { label: '직무', value: options.jobRole },
    { label: '질문 수', value: `${options.questionCount}문항` },
    { label: '면접관', value: labelOf(INTERVIEWER_STYLES, options.interviewerStyle) },
  ]

  const handleStart = () => {
    if (!sessionId || !options.replayable || isStarting) return

    setIsStarting(true)
    setError(null)

    createSession(setup, { sourceSessionId: sessionId })
      .then((session) => {
        const replayState: ReplayDeviceCheckState = { replaySetup: setup, backTo: toReplay(sessionId) }
        navigate(toDeviceCheck(session.sessionId), { state: replayState })
      })
      .catch((cause: unknown) => {
        setIsStarting(false)
        setError(cause instanceof ApiError ? toUserMessage(cause.code, REPLAY_START_MESSAGES) : '잠시 후 다시 시도해 주세요.')
      })
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <InterviewFlowHeader current={1} />

      <div className="flex flex-wrap items-start gap-6">
        <Card padding="lg" className="flex min-w-80 flex-[3] flex-col gap-8">
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-h1 text-neutral-900">
              <IconRepeat size={28} stroke={2} aria-hidden className="text-primary-500" />
              재연습 설정
            </h1>
            <p className="text-body-md text-neutral-500">
              첫 면접과 같은 질문으로 다시 연습해요. 꼬리질문은 이번 답변에 맞춰 새로 나와요.
            </p>
          </div>

          {!options.replayable && (
            <div role="alert" className="flex flex-col gap-2 rounded-sm bg-badge-warning-bg p-4 text-badge-warning-text">
              {options.blockReasons.map((reason) => (
                <p key={reason.code} className="flex items-start gap-2 text-body-md">
                  <IconAlertTriangle size={18} stroke={2} aria-hidden className="mt-0.5 shrink-0" />
                  {reason.message}
                </p>
              ))}
              <p className="text-body-sm">재연습 조건은 바꿀 수 없어요. 새 면접으로 연습해 주세요.</p>
            </div>
          )}

          <section aria-labelledby={fixedHeadingId} className="flex flex-col gap-3">
            <h2 id={fixedHeadingId} className={FIELD_LABEL_CLASS}>
              첫 면접 조건
            </h2>
            <p className="text-body-sm text-neutral-500">
              같은 질문을 받으려면 첫 면접과 조건이 같아야 해서 바꿀 수 없어요.
            </p>
            <dl className="flex flex-col rounded-sm bg-neutral-50 px-5 py-2">
              {fixedRows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-4 border-b border-neutral-200 py-2.5 last:border-b-0"
                >
                  <dt className="text-body-sm text-neutral-500">{row.label}</dt>
                  <dd className="text-right text-body-sm font-semibold text-neutral-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="flex min-w-52 flex-col gap-3">
            <label htmlFor={answerSecondsId} className={FIELD_LABEL_CLASS}>
              시간
            </label>
            <select
              id={answerSecondsId}
              value={answerSeconds === null ? NO_TIME_LIMIT : String(answerSeconds)}
              onChange={(event) =>
                setAnswerSeconds(event.target.value === NO_TIME_LIMIT ? null : Number(event.target.value))
              }
              className={FIELD_CLASS}
            >
              {ANSWER_SECONDS_CHOICES.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </select>
          </div>

          <ChipGroup label="진행 방식" choices={DELIVERY_MODES} value={deliveryMode} onChange={setDeliveryMode} />
        </Card>

        <aside className="flex min-w-72 flex-1 flex-col gap-3">
          <SetupSummary
            setup={setup}
            companies={companiesOf(options)}
            missing={[]}
            isStarting={isStarting}
            error={error}
            onStart={handleStart}
            startBlocked={!options.replayable}
            showDraftSave={false}
          />
          {!options.replayable && (
            <div className="flex flex-col items-end gap-2">
              <p className="text-body-sm text-neutral-400">위 이유로 재연습을 시작할 수 없어요</p>
              <Button size="sm" to={ROUTES.SESSION_SETUP}>
                새 면접 설정하기
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
