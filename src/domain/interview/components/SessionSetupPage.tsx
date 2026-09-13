import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { toDeviceCheck } from '@/app/routes'
import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { createSession, getCompanies } from '../api/sessionApi'
import { useSessionSetup } from '../hooks/useSessionSetup'
import {
  ANSWER_SECONDS_CHOICES,
  DELIVERY_MODES,
  INTERVIEWER_STYLES,
  JOB_ROLES,
  NO_TIME_LIMIT,
  QUESTION_COUNT_CHOICES,
  type Company,
} from '../types/sessionSetup'

import ChipGroup from './ChipGroup'
import CompanyQuestionSection from './CompanyQuestionSection'
import ResumeField from './ResumeField'
import SetupSummary from './SetupSummary'
import StepIndicator from './StepIndicator'

/** 셀렉트 모양은 기업 맞춤 질문 쪽과 같습니다. */
const FIELD_CLASS =
  'rounded-sm border border-neutral-200 bg-neutral-0 px-4 py-3 text-body-md text-neutral-900'

/**
 * 면접 옵션 설정 화면입니다. (A-05)
 *
 * 시안대로 한 줄로 쌓습니다. 위에서부터 단계 표시 → 제목 → 직무 → 자기소개서
 * → 기업 맞춤 질문 → 시간 · 질문수 → 면접관 스타일 → 텍스트/음성 → 요약 · 다음 단계.
 *
 * 시안에는 설정 요약이 없지만, 폼이 길어서 아래까지 내려가면 위에서 뭘
 * 골랐는지 안 보입니다. 요약은 오른쪽 패널 대신 폼 아래에 남겼습니다.
 */
export default function SessionSetupPage() {
  const navigate = useNavigate()
  const { setup, patch, missing, canStart } = useSessionSetup()

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
          cause instanceof ApiError ? toUserMessage(cause.code) : '잠시 후 다시 시도해 주세요.',
        )
      })
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <StepIndicator current={1} />

      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-neutral-900">면접 옵션 설정</h1>
        <p className="text-body-md text-neutral-500">연습할 면접 조건을 선택해주세요</p>
      </div>

      <ChipGroup
        label="직무 선택"
        required
        choices={JOB_ROLES}
        value={setup.jobRole}
        onChange={(jobRole) => patch({ jobRole })}
      />

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
        <label className="flex min-w-52 flex-1 flex-col gap-2">
          <span className="text-body-lg text-neutral-900">시간</span>
          <select
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
        </label>

        <label className="flex min-w-52 flex-1 flex-col gap-2">
          <span className="text-body-lg text-neutral-900">질문수</span>
          <select
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
        </label>
      </div>

      <ChipGroup
        label="면접관 스타일"
        required
        choices={INTERVIEWER_STYLES}
        value={setup.interviewerStyle}
        onChange={(interviewerStyle) => patch({ interviewerStyle })}
      />

      <ChipGroup
        label="텍스트/음성"
        choices={DELIVERY_MODES}
        value={setup.deliveryMode}
        onChange={(deliveryMode) => patch({ deliveryMode })}
      />

      <SetupSummary
        setup={setup}
        companies={companies}
        missing={missing}
        isStarting={isStarting}
        error={error}
        onStart={handleStart}
      />
    </div>
  )
}
