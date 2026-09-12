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
  QUESTION_COUNT_CHOICES,
  type Company,
} from '../types/sessionSetup'

import ChipGroup from './ChipGroup'
import CompanyQuestionSection from './CompanyQuestionSection'
import ResumeField from './ResumeField'
import SetupSummary from './SetupSummary'
import StepIndicator from './StepIndicator'

/**
 * 면접 옵션 설정 화면입니다. (A-05)
 *
 * 왼쪽에서 조건을 고르고 오른쪽 요약에서 확인한 뒤 장치 테스트로 넘어갑니다.
 * 좁은 화면에서는 요약이 아래로 내려갑니다.
 *
 * 색 · 타이포는 토큰이 dev 에 들어온 뒤에 한 번에 입힙니다.
 * 지금 임의 클래스를 쓰면 나중에 전부 되돌려야 해서 구조만 먼저 잡았습니다.
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
    <div className="flex flex-col gap-6">
      <StepIndicator current={1} />

      <div className="flex flex-wrap items-start gap-6">
        <section className="flex min-w-80 flex-[2] flex-col gap-8 border p-6">
          <div className="flex flex-col gap-1">
            <h1>면접 옵션 설정</h1>
            <p>면접할 조건을 선택해주세요</p>
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
            <label className="flex min-w-60 flex-1 flex-col gap-2">
              <span>시간</span>
              <select
                value={String(setup.answerSeconds)}
                onChange={(event) => patch({ answerSeconds: Number(event.target.value) })}
                className="border px-3 py-2"
              >
                {ANSWER_SECONDS_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-60 flex-1 flex-col gap-2">
              <span>질문수</span>
              <select
                value={String(setup.questionCount)}
                onChange={(event) => patch({ questionCount: Number(event.target.value) })}
                className="border px-3 py-2"
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
            label="진행 방식"
            choices={DELIVERY_MODES}
            value={setup.deliveryMode}
            onChange={(deliveryMode) => patch({ deliveryMode })}
          />
        </section>

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
