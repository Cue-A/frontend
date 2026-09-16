import { IconClock } from '@tabler/icons-react'

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
  if (!setup.useCompanyQuestion) return '미사용'
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
 * 오른쪽 설정 요약 패널입니다. (A-05)
 *
 * 고른 값을 그대로 다시 보여줍니다. 스크롤이 길어서 아래까지 내려가면 위에서
 * 뭘 골랐는지 안 보이기 때문입니다.
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
    { label: '자기소개서', value: setup.resume ? '1개 연결됨' : '미연결' },
    { label: '기업 맞춤 질문', value: companyLabel(setup, companies) },
    { label: '질문 수', value: `${setup.questionCount}문항` },
    {
      label: '답변 시간',
      value: setup.answerSeconds === null ? '제한 없음' : `질문당 ${setup.answerSeconds}초`,
    },
    { label: '면접관', value: labelOf(INTERVIEWER_STYLES, setup.interviewerStyle) },
    { label: '진행 방식', value: labelOf(DELIVERY_MODES, setup.deliveryMode) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Card label="설정 요약" padding="md" className="flex flex-col gap-4">
        <h2 className="text-body-lg font-semibold text-neutral-900">설정 요약</h2>

        <dl className="flex flex-col">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex justify-between gap-4 border-b border-neutral-200 py-2.5 last:border-b-0"
            >
              <dt className="text-body-sm text-neutral-500">{row.label}</dt>
              <dd className="text-body-sm font-semibold text-neutral-900">{row.value}</dd>
            </div>
          ))}
        </dl>

        {/*
          어림값이라 "약"을 붙입니다. 질문 간 대기가 5~15초로 들쭉날쭉하고
          답변 길이도 사람마다 달라서 정확한 값처럼 보이면 안 됩니다. (PR #13 리뷰)
        */}
        <p className="flex items-center justify-center gap-2 rounded-sm bg-primary-100 p-3 text-body-sm font-semibold text-primary-700 tabular-nums">
          <IconClock size={16} stroke={2} aria-hidden />
          {minutes === null ? '답변 시간에 따라 달라져요' : `총 예상 소요 약 ${minutes}분`}
        </p>
      </Card>

      <section aria-label="다음 단계" className="rounded-sm bg-primary-100 p-4">
        <h2 className="text-body-md font-semibold text-primary-700">다음 단계: 장치 테스트</h2>
        <p className="mt-1 text-body-sm text-primary-700">
          마이크와 카메라를 미리 확인하면 면접 중 끊김을 막을 수 있어요.
        </p>
      </section>

      {missing.length > 0 && (
        <p role="status" className="text-body-sm text-neutral-500">
          아직 안 고른 항목: {missing.join(' · ')}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-sm bg-badge-danger-bg p-4 text-body-sm text-badge-danger-text"
        >
          {error}
        </p>
      )}

      {/* 못 누르는 이유는 툴팁이 아니라 글로 적습니다 (이슈 #32). */}
      <p className="text-right text-body-sm text-neutral-400">임시저장은 아직 준비 중이에요</p>

      <div className="flex flex-wrap justify-end gap-3">
        <Button size="sm" disabled>
          임시저장
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onStart}
          disabled={missing.length > 0 || isStarting}
        >
          {isStarting ? '준비하는 중…' : '장치 테스트하러 가기'}
        </Button>
      </div>
    </div>
  )
}
