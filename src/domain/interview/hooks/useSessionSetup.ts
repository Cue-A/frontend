import { useEffect, useState } from 'react'

import { loadDraft, removeDraft, saveDraft } from '@/shared/lib/draftStorage'

import { parseSavedSessionSetup } from '../lib/savedSessionSetup'
import {
  CUSTOM_COMPANY,
  DEFAULT_ANSWER_SECONDS,
  DEFAULT_QUESTION_COUNT,
  type SessionSetup,
} from '../types/sessionSetup'

const INITIAL_SETUP: SessionSetup = {
  jobRole: '',
  resume: null,

  useCompanyQuestion: false,
  companyId: null,
  customCulture: '',

  answerSeconds: DEFAULT_ANSWER_SECONDS,
  questionCount: DEFAULT_QUESTION_COUNT,
  interviewerStyle: null,
  deliveryMode: 'TEXT_VOICE',
}

/** 이 탭에 남겨 두는 이름 (shared/lib/draftStorage) */
const DRAFT_NAME = 'sessionSetup'

/** 남겨 둔 값이 있으면 그걸로, 없거나 모양이 맞지 않으면 처음 값으로 시작합니다 */
function restoreSetup(): SessionSetup {
  return parseSavedSessionSetup(loadDraft(DRAFT_NAME)) ?? INITIAL_SETUP
}

/**
 * 남겨 둔 옵션을 지웁니다. 면접을 실제로 시작하면 부릅니다(장치 테스트의 "면접 시작하기").
 *
 * 그 뒤에 다시 옵션 설정에 오면 처음 값으로 시작합니다. 리포트의 "다시 연습하기" 안내가 "이번 회차 설정을
 * 불러오는 기능은 아직 없어서 옵션은 다시 골라주세요" 라서, 남겨 두면 그 안내와 어긋납니다. (ReportActions.tsx)
 */
export function clearSavedSessionSetup() {
  removeDraft(DRAFT_NAME)
}

export type UseSessionSetupResult = {
  setup: SessionSetup
  /** 한 항목만 바꿉니다. patch({ jobRole: '프론트엔드 개발자' }) */
  patch: (changes: Partial<SessionSetup>) => void
  /** 아직 안 고른 필수 항목 이름들. 비어 있으면 시작할 수 있습니다 */
  missing: string[]
  canStart: boolean
}

/**
 * 옵션 설정 폼 상태입니다.
 * 화면은 이 훅이 주는 값만 그리고, 무엇이 비었는지 판단도 여기서 합니다.
 *
 * **고른 값은 이 탭에 남겨 둡니다.** 장치 테스트로 넘어갔다가 "← 옵션" 이나 뒤로가기로 돌아오면 화면이 새로
 * 그려지면서 `useState` 가 처음 값으로 돌아갔습니다. 바뀔 때마다 저장하고, 다시 들어오면 그 값으로 시작합니다.
 * 면접을 실제로 시작하면 지웁니다(`clearSavedSessionSetup`). 로그아웃하면 토큰과 같이 지워집니다.
 */
export function useSessionSetup(): UseSessionSetupResult {
  const [setup, setSetup] = useState<SessionSetup>(restoreSetup)

  useEffect(() => {
    saveDraft(DRAFT_NAME, setup)
  }, [setup])

  const patch = (changes: Partial<SessionSetup>) => {
    setSetup((previous) => ({ ...previous, ...changes }))
  }

  const missing: string[] = []

  // 띄어쓰기만 적은 건 적지 않은 것으로 봅니다. 서버도 `@NotBlank` 로 거절합니다.
  if (!setup.jobRole.trim()) missing.push('직무 입력')
  if (!setup.resume) missing.push('자기소개서 불러오기')
  if (!setup.interviewerStyle) missing.push('면접관 스타일')

  // 기업 맞춤 질문을 켰으면 어느 기업인지까지 골라야 합니다.
  // "직접 입력"을 골랐으면 인재상도 받아야 합니다. companyId 만 보면
  // CUSTOM 이 truthy 라 통과해서, 인재상이 빈 채로 서버에 갑니다. (PR #13 리뷰)
  if (setup.useCompanyQuestion) {
    if (!setup.companyId) {
      missing.push('기업 선택')
    } else if (setup.companyId === CUSTOM_COMPANY && !setup.customCulture.trim()) {
      missing.push('인재상 입력')
    }
  }

  return {
    setup,
    patch,
    missing,
    canStart: missing.length === 0,
  }
}
