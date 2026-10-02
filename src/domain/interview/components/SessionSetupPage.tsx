import { useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { toDeviceCheck } from '@/app/routes'
import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { createSession, getCompanies } from '../api/sessionApi'
import { useSessionSetup } from '../hooks/useSessionSetup'
import { estimateDurationMinutes } from '../lib/estimateDuration'
import { SESSION_START_MESSAGES } from '../lib/sessionStartErrorMessage'
import {
  ANSWER_SECONDS_CHOICES,
  DEFAULT_ANSWER_SECONDS,
  DEFAULT_QUESTION_COUNT,
  DELIVERY_MODES,
  INTERVIEWER_STYLES,
  MAX_JOB_ROLE_LENGTH,
  NO_TIME_LIMIT,
  QUESTION_COUNT_CHOICES,
  REQUIRED_LABELS,
  type Company,
} from '../types/sessionSetup'

import Badge from '@/shared/ui/Badge'
import Card from '@/shared/ui/Card'

import ChipGroup from './ChipGroup'
import CompanyQuestionSection from './CompanyQuestionSection'
import FieldHelp from './FieldHelp'
import ResumeField from './ResumeField'
import SetupSummary from './SetupSummary'
import StepIndicator from './StepIndicator'

/** 셀렉트 모양은 기업 맞춤 질문 쪽과 같습니다. */
const FIELD_CLASS =
  'rounded-sm border border-neutral-200 bg-neutral-0 px-4 py-3 text-body-md text-neutral-900'

/** 칸 위의 항목 이름. 칩 묶음(ChipGroup)의 이름과 같은 글자입니다 */
const FIELD_LABEL_CLASS = 'flex items-center gap-2 text-body-lg font-semibold text-neutral-900'

/** 기본값(6문항 · 질문당 90초)으로 하면 대략 몇 분인지. 도움말에 적습니다 */
const DEFAULT_MINUTES = estimateDurationMinutes(DEFAULT_QUESTION_COUNT, DEFAULT_ANSWER_SECONDS)

/**
 * 면접 옵션 설정 화면입니다. (A-05)
 *
 * 위에 단계 표시, 아래에 두 칸. 왼쪽 흰 카드에서 조건을 고르고 오른쪽 요약에서
 * 확인한 뒤 장치 테스트로 넘어갑니다. 좁은 화면에서는 요약이 아래로 내려갑니다.
 */
export default function SessionSetupPage() {
  const navigate = useNavigate()
  const { setup, patch, missing, canStart } = useSessionSetup()
  const jobRoleId = useId()
  const answerSecondsId = useId()
  const questionCountId = useId()

  const [companies, setCompanies] = useState<Company[]>([])
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    getCompanies()
      .then((list) => {
        if (alive) setCompanies(list)
      })
      .catch(() => {
        // 기업 목록을 못 받아도 면접은 시작할 수 있습니다. 맞춤 질문만 못 씁니다.
        if (alive) setCompanies([])
      })

    return () => {
      alive = false
    }
  }, [])

  const handleStart = () => {
    if (!canStart || isStarting) return

    setIsStarting(true)
    setError(null)

    createSession(setup)
      .then((session) => {
        navigate(toDeviceCheck(session.sessionId))
      })
      .catch((cause: unknown) => {
        setIsStarting(false)
        setError(
          cause instanceof ApiError ? toUserMessage(cause.code, SESSION_START_MESSAGES) : '잠시 후 다시 시도해 주세요.',
        )
      })
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <StepIndicator current={1} />

      <div className="flex flex-wrap items-start gap-6">
        <Card padding="lg" className="flex min-w-80 flex-[3] flex-col gap-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-h1 text-neutral-900">면접 옵션 설정</h1>
            <p className="text-body-md text-neutral-500">면접할 조건을 선택해주세요</p>
          </div>

          {/* 직무는 고르지 않고 직접 적습니다 (types/sessionSetup.ts MAX_JOB_ROLE_LENGTH 주석) */}
          <div className="flex flex-col gap-3">
            <label htmlFor={jobRoleId} className={FIELD_LABEL_CLASS}>
              {REQUIRED_LABELS.jobRole}
              <Badge tone="danger">필수</Badge>
            </label>
            <input
              id={jobRoleId}
              type="text"
              value={setup.jobRole}
              onChange={(event) => patch({ jobRole: event.target.value })}
              maxLength={MAX_JOB_ROLE_LENGTH}
              placeholder="예) 프론트엔드 개발자"
              autoComplete="off"
              className={`${FIELD_CLASS} placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none`}
            />
          </div>

          <ResumeField resume={setup.resume} onChange={(resume) => patch({ resume })} />

          <CompanyQuestionSection
            enabled={setup.useCompanyQuestion}
            companies={companies}
            companyId={setup.companyId}
            customCulture={setup.customCulture}
            onToggle={(useCompanyQuestion) => patch({ useCompanyQuestion })}
            onSelectCompany={(companyId) => patch({ companyId })}
            onChangeCulture={(customCulture) => patch({ customCulture })}
          />

          <div className="flex flex-wrap gap-6">
            {/* 이름 옆 ? 버튼이 label 안에 있으면 누를 때 셀렉트가 같이 반응할 수 있어서 label 을 이름에만 씌웁니다 */}
            <div className="flex min-w-52 flex-1 flex-col gap-3">
              <span className={FIELD_LABEL_CLASS}>
                <label htmlFor={answerSecondsId}>시간</label>
                <FieldHelp topic="시간">
                  <span>질문 하나에 답할 수 있는 시간이에요. 기본값은 질문당 {DEFAULT_ANSWER_SECONDS}초예요.</span>
                  <span>시간이 다 되면 그때까지 한 답변이 자동으로 제출돼요. 제한 없음을 고르면 시간을 재지 않아요.</span>
                </FieldHelp>
              </span>
              <select
                id={answerSecondsId}
                value={setup.answerSeconds === null ? NO_TIME_LIMIT : String(setup.answerSeconds)}
                onChange={(event) =>
                  patch({
                    answerSeconds:
                      event.target.value === NO_TIME_LIMIT ? null : Number(event.target.value),
                  })
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

            <div className="flex min-w-52 flex-1 flex-col gap-3">
              <span className={FIELD_LABEL_CLASS}>
                <label htmlFor={questionCountId}>질문수</label>
                <FieldHelp topic="질문수">
                  <span>면접관이 하는 질문 수예요. 기본값은 {DEFAULT_QUESTION_COUNT}문항이에요.</span>
                  <span>
                    답변을 듣고 이어서 묻는 꼬리질문도 한 문항으로 세고, 답변을 다시 해달라는 되묻기는 세지 않아요.
                  </span>
                  <span>
                    기본값(질문당 {DEFAULT_ANSWER_SECONDS}초 · {DEFAULT_QUESTION_COUNT}문항)이면 약 {DEFAULT_MINUTES}분 걸려요.
                  </span>
                </FieldHelp>
              </span>
              <select
                id={questionCountId}
                value={String(setup.questionCount)}
                onChange={(event) => patch({ questionCount: Number(event.target.value) })}
                className={FIELD_CLASS}
              >
                {QUESTION_COUNT_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ChipGroup
            label={REQUIRED_LABELS.interviewerStyle}
            required
            choices={INTERVIEWER_STYLES}
            value={setup.interviewerStyle}
            onChange={(interviewerStyle) => patch({ interviewerStyle })}
          />

          <ChipGroup
            label="진행 방식"
            choices={DELIVERY_MODES}
            value={setup.deliveryMode}
            onChange={(deliveryMode) => patch({ deliveryMode })}
          />
        </Card>

        <aside className="min-w-72 flex-1">
          <SetupSummary
            setup={setup}
            companies={companies}
            missing={missing}
            isStarting={isStarting}
            error={error}
            onStart={handleStart}
          />
        </aside>
      </div>
    </div>
  )
}
