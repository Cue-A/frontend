import { api } from '@/shared/api/apiClient'

import type { AnswerSubmission, InterviewOptions } from '../types/interview'
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
    // "제한 없음"이면 null 입니다. 서버가 이걸 어떻게 받는지 확인이 필요합니다
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

/**
 * 면접 진행 화면(B-01-2)이 필요로 하는 세션 옵션만 담는다. `InterviewOptions` 전체가
 * 아니라 이 셋만 쓰는 이유: jobRole · resumeDocId · companyTalentProfile ·
 * questionCountLabel · interviewerCount 는 지금까지 만들어진 B-01/B-01-2 UI 어디에서도
 * 쓰이지 않는다.
 *
 * GET /api/interviews/{sessionId} 는 백엔드에 아직 없는 엔드포인트다. mock 은 실제로
 * 제출된 SessionSetup 을 반영하지 않고 고정값을 돌려준다 — SessionSetup.interviewerStyle
 * (대문자 3종: FRIENDLY/NEUTRAL/PRESSURE)과 이 InterviewOptions.interviewerStyle(소문자
 * 2종: friendly/pressure, NEUTRAL 없음) 사이의 매핑이 아직 정해지지 않았기 때문이다.
 * 계약이 정해지면 이 함수와 매핑만 고치면 된다.
 */
export type InterviewSessionOptions = Pick<InterviewOptions, 'interviewerStyle' | 'hideQuestionText' | 'answerTimeLimitSec'>

export function getInterviewOptions(sessionId: string) {
  return api.get<InterviewSessionOptions>(`/api/interviews/${sessionId}`)
}

/**
 * 답변 제출 REST 엔드포인트입니다. 백엔드에 아직 없습니다
 * (domain/interview/controller 가 .gitkeep 뿐). 경로 · 응답 형태는 추정치이고 mock 만
 * 등록되어 있다. 계약이 정해지면 이 함수만 고치면 된다.
 */
export function submitAnswer(sessionId: string, submission: AnswerSubmission) {
  return api.post<void>(`/api/interviews/${sessionId}/answers`, submission)
}
