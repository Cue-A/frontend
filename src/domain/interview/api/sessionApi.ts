import { api } from '@/shared/api/apiClient'

import { CUSTOM_COMPANY, type Company, type SessionSetup } from '../types/sessionSetup'

import './sessionMock'

export function getCompanies() {
  return api.get<Company[]>('/api/companies')
}

/**
 * 화면의 설정을 요청 본문으로 바꿉니다.
 *
 * 필드 이름은 아직 백엔드와 맞춘 값이 아닙니다. 계약이 확정되면
 * **이 함수만** 고치면 되고, 화면과 훅은 건드릴 필요가 없습니다.
 * (docs/90-open-questions.md — 세션 생성 요청 형식)
 */
function toCreateBody(setup: SessionSetup) {
  const useCustomCompany = setup.companyId === CUSTOM_COMPANY

  return {
    jobRole: setup.jobRole,
    questionCount: setup.questionCount,
    answerSeconds: setup.answerSeconds,
    interviewerStyle: setup.interviewerStyle,
    deliveryMode: setup.deliveryMode,
    useCompanyQuestion: setup.useCompanyQuestion,
    companyId: setup.useCompanyQuestion && !useCustomCompany ? setup.companyId : null,
    customCulture: setup.useCompanyQuestion && useCustomCompany ? setup.customCulture : null,
  }
}

export type CreatedSession = {
  sessionId: string
}

/**
 * 자기소개서 파일 자체는 아직 안 보냅니다. 업로드 방식(별도 업로드 후 id 전달인지,
 * multipart 로 한 번에 보내는지)이 정해지지 않았습니다.
 */
export function createSession(setup: SessionSetup) {
  return api.post<CreatedSession>('/api/interviews', toCreateBody(setup))
}
