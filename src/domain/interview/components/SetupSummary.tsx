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
    { label: '자기소개서', value: setup.resume ? '1개 연결됨' : NOT_SELECTED },
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
      <section aria-label="설정 요약" className="flex flex-col gap-4 border p-5">
        <h2>설정 요약</h2>

        <dl className="flex flex-col">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 border-b py-2">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>

        {/*
          어림값이라 "약"을 붙입니다. 질문 간 대기가 5~15초로 들쭉날쭉하고
          답변 길이도 사람마다 달라서 정확한 값처럼 보이면 안 됩니다. (PR #13 리뷰)
        */}
        <p className="border p-3 text-center tabular-nums">
          {minutes === null ? '답변 시간에 따라 달라져요' : `총 예상 소요 약 ${minutes}분`}
        </p>
      </section>

      <section aria-label="다음 단계" className="flex flex-col gap-1 border p-4">
        <h2>다음 단계: 장치 테스트</h2>
        <p>마이크와 카메라를 미리 확인하면 면접 중 끊김을 막을 수 있어요.</p>
      </section>

      {missing.length > 0 && <p role="status">아직 안 고른 항목: {missing.join(' · ')}</p>}

      {error && <p role="alert">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled
          title="임시저장은 준비 중이에요"
          className="flex-1 border px-4 py-3"
        >
          임시저장
        </button>

        <button
          type="button"
          onClick={onStart}
          disabled={missing.length > 0 || isStarting}
          className="flex-1 border px-4 py-3"
        >
          {isStarting ? '준비하는 중…' : '장치 테스트하러 가기'}
        </button>
      </div>
    </div>
  )
}
