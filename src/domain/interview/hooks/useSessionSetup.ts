import { useState } from 'react'

import type { SessionSetup } from '../types/sessionSetup'

const INITIAL_SETUP: SessionSetup = {
  jobRole: null,
  resume: null,

  useCompanyQuestion: false,
  companyId: null,
  customCulture: '',

  answerSeconds: 90,
  questionCount: 9,
  interviewerStyle: null,
  deliveryMode: 'TEXT_VOICE',
}

export type UseSessionSetupResult = {
  setup: SessionSetup
  /** 한 항목만 바꿉니다. patch({ jobRole: 'FRONTEND' }) */
  patch: (changes: Partial<SessionSetup>) => void
  /** 아직 안 고른 필수 항목 이름들. 비어 있으면 시작할 수 있습니다 */
  missing: string[]
  canStart: boolean
}

/**
 * 옵션 설정 폼 상태입니다.
 * 화면은 이 훅이 주는 값만 그리고, 무엇이 비었는지 판단도 여기서 합니다.
 */
export function useSessionSetup(): UseSessionSetupResult {
  const [setup, setSetup] = useState<SessionSetup>(INITIAL_SETUP)

  const patch = (changes: Partial<SessionSetup>) => {
    setSetup((previous) => ({ ...previous, ...changes }))
  }

  const missing: string[] = []

  if (!setup.jobRole) missing.push('직무 선택')
  if (!setup.resume) missing.push('자기소개서 불러오기')
  if (!setup.interviewerStyle) missing.push('면접관 스타일')

  // 기업 맞춤 질문을 켰으면 어느 기업인지까지 골라야 합니다.
  if (setup.useCompanyQuestion && !setup.companyId) {
    missing.push('기업 선택')
  }

  return {
    setup,
    patch,
    missing,
    canStart: missing.length === 0,
  }
}
