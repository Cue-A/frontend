import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { estimateDurationMinutes } from '../lib/estimateDuration'
import {
  CUSTOM_COMPANY,
  INTERVIEWER_STYLES,
  JOB_ROLES,
  DELIVERY_MODES,
  type Company,
  type SessionSetup,
} from '../types/sessionSetup'

const NOT_SELECTED = '미선택'

function labelOf(choices: { value: string; label: string }[], value: string | null) {
  if (!value) return NOT_SELECTED
  return choices.find((choice) => choice.value === value)?.label ?? NOT_SELECTED
}

function companyLabel(setup: SessionSetup, companies: Company[]) {
  if (!setup.useCompanyQuestion) return '사용 안 함'
  if (setup.companyId === CUSTOM_COMPANY) return '직접 입력'
  if (!setup.companyId) return NOT_SELECTED

  return companies.find((company) => company.companyId === setup.companyId)?.name ?? NOT_SELECTED
}

type Props = {
  setup: SessionSetup
  companies: Company[]
  missing: string[]
  isStarting: boolean
  error: string | null
  onStart: () => void
}

/**
 * 고른 값을 다시 보여주고 다음 단계로 넘깁니다. (A-05 하단)
 *
 * 시안에는 요약이 없지만, 폼이 길어서 아래까지 내려가면 위에서 뭘 골랐는지
 * 안 보입니다. 시안의 1단 레이아웃을 따르되 요약은 폼 아래에 남깁니다.
 *
 * "임시저장"은 저장 API 가 없어서 비활성입니다. 눌러도 아무 일이 없는 것보다
 * 왜 못 누르는지 보이는 편이 낫습니다.
 */
export default function SetupSummary({
  setup,
  companies,
  missing,
  isStarting,
  error,
  onStart,
}: Props) {
  const minutes = estimateDurationMinutes(setup.questionCount, setup.answerSeconds)

  const rows = [
    { label: '직무', value: labelOf(JOB_ROLES, setup.jobRole) },
    { label: '자기소개서', value: setup.resume ? '1개 연결됨' : NOT_SELECTED },
    { label: '기업 맞춤 질문', value: companyLabel(setup, companies) },
    { label: '질문 수', value: `${setup.questionCount}문항` },
    {
      label: '답변 시간',
      value: setup.answerSeconds === null ? '제한 없음' : `질문당 ${setup.answerSeconds}초`,
    },
    { label: '면접관', value: labelOf(INTERVIEWER_STYLES, setup.interviewerStyle) },
    { label: '텍스트/음성', value: labelOf(DELIVERY_MODES, setup.deliveryMode) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Card label="설정 요약" padding="lg" className="flex flex-col gap-4">
        <h2 className="text-h2 text-neutral-900">설정 요약</h2>

        <dl className="flex flex-col">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex justify-between gap-4 border-b border-neutral-200 py-3"
            >
              <dt className="text-body-md text-neutral-500">{row.label}</dt>
              <dd className="text-body-md font-semibold text-neutral-900">{row.value}</dd>
            </div>
          ))}
        </dl>

        {/*
          어림값이라 "약"을 붙입니다. 질문 간 대기가 5~15초로 들쭉날쭉하고
          답변 길이도 사람마다 달라서 정확한 값처럼 보이면 안 됩니다. (PR #13 리뷰)
        */}
        <p className="rounded-sm bg-primary-100 p-3 text-center text-body-md font-semibold text-primary-700 tabular-nums">
          {minutes === null ? '답변 시간에 따라 달라져요' : `총 예상 소요 약 ${minutes}분`}
        </p>
      </Card>

      {missing.length > 0 && (
        <p role="status" className="text-body-md text-neutral-500">
          아직 안 고른 항목: {missing.join(' · ')}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-sm bg-badge-danger-bg p-4 text-body-md text-badge-danger-text"
        >
          {error}
        </p>
      )}

      <hr className="border-neutral-200" />

      <div className="flex flex-col gap-3">
        <p className="text-body-sm text-neutral-400">
          마이크와 카메라를 미리 확인하면 면접 중 끊김을 막을 수 있어요.
        </p>

        <div className="flex flex-wrap justify-end gap-3">
          <Button disabled title="임시저장은 준비 중이에요">
            임시저장
          </Button>

          <Button variant="primary" onClick={onStart} disabled={missing.length > 0 || isStarting}>
            {isStarting ? '준비하는 중…' : '장치 테스트하러 가기'}
          </Button>
        </div>
      </div>
    </div>
  )
}
