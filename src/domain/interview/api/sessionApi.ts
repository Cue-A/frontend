import { api } from '@/shared/api/apiClient'

import type { AnswerSubmission, InterviewOptions } from '../types/interview'
import { CUSTOM_COMPANY, JOB_ROLES, type Company, type InterviewerStyle, type SessionSetup } from '../types/sessionSetup'

import './sessionMock'

export function getCompanies() {
  return api.get<Company[]>('/api/companies')
}

/**
 * 세션 시작 요청 본문. (Cue-A/backend `InterviewStartRequest`, dev 머지됨 · #54 1-6)
 *
 * 화면의 설정 중 **서버가 받지 않는 값은 싣지 않습니다.** 받을 자리가 없어서 보내도 버려집니다.
 * - `answerSeconds` · `deliveryMode` — 서버 요청에 없습니다 (#54 확인 필요 1 · 2번)
 * - `customCulture`(목록에 없는 기업의 인재상 직접 입력) — 서버 요청에 없습니다. 서버는 등록된
 *   기업 id 만 받고, 인재상은 그 기업 정보로 서버가 만듭니다
 */
type InterviewStartRequest = {
  /** 보관함에서 고른 문서의 UUID. 필수 */
  documentPublicId: string
  /** 등록된 기업의 숫자 id. 없으면 연습 모드 */
  companyId: number | null
  /** 자유 문자열(100자). 서버가 AI 에 그대로 넘기므로 화면에 보이는 이름을 보냅니다 */
  jobRole: string
  /** 이름만 다르고 값은 같습니다 (`FRIENDLY` · `PRESSURE`) */
  persona: InterviewerStyle
  /** 3 · 6 · 9 */
  questionCount: number
}

/**
 * 기업 id 를 서버 모양(숫자)으로 바꿉니다. 바꿀 수 없으면 null — 연습 모드로 시작합니다.
 *
 * ⚠️ 지금 기업 목록(`GET /api/companies`)은 **백엔드에 없고 목업뿐**이라 id 가 `'naver'` 같은
 * 문자열입니다. 서버는 `verified` 인 기업의 숫자 id 만 받고, 모르는 id 는 `INVALID_REQUEST` 로
 * 거절합니다. 문자열 id 를 그대로 보내면 면접 시작이 통째로 실패하므로, 숫자가 아니면 빼고
 * 보냅니다. 기업 목록 API 가 생기면 id 가 숫자로 와서 이 함수는 그대로 동작합니다.
 * (#54 확인 필요 11번 — 프론트 · 백엔드 · AI 의 companyId 모양이 서로 다름)
 */
function toCompanyId(setup: SessionSetup): number | null {
  if (!setup.useCompanyQuestion || !setup.companyId || setup.companyId === CUSTOM_COMPANY) return null

  const id = Number(setup.companyId)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

/**
 * 화면의 설정을 요청 본문으로 바꿉니다. 서버 필드가 바뀌면 **이 함수만** 고칩니다.
 *
 * 필수 항목(문서 · 직무 · 면접관)이 비어 있으면 부르지 않는 게 맞습니다 — 화면이
 * `canStart` 로 버튼을 잠급니다. 그래도 불렸다면 서버에 빈 값을 보내지 않고 여기서 멈춥니다.
 */
function toCreateBody(setup: SessionSetup): InterviewStartRequest {
  if (!setup.resume || !setup.jobRole || !setup.interviewerStyle) {
    throw new Error('필수 항목(문서 · 직무 · 면접관)이 비어 있는 채로 세션 생성을 불렀습니다')
  }

  return {
    documentPublicId: setup.resume.documentId,
    companyId: toCompanyId(setup),
    jobRole: JOB_ROLES.find((role) => role.value === setup.jobRole)?.label ?? setup.jobRole,
    persona: setup.interviewerStyle,
    questionCount: setup.questionCount,
  }
}

export type CreatedSession = {
  /** AI 가 발급한 세션 id. 이후 모든 면접 API 와 소켓 주소에 씁니다 */
  sessionId: string
  /** 고른 문항 수 (되묻기 제외). 진행률 "N / 전체" 의 전체입니다 */
  questionTotal: number
}

/**
 * 면접 세션 시작. `POST /api/interviews` → **202 Accepted**
 *
 * 첫 질문은 이 응답에 없고 WebSocket(`/ws/interviews/{sessionId}`)으로 따로 옵니다.
 * 서버는 응답을 돌려준 **뒤** 백그라운드에서 첫 질문을 만들어 소켓으로 밀어 넣습니다.
 *
 * 걸리는 제한 — 서버가 다시 봅니다.
 * - 문서: 본인 것 · 준비 완료(`COMPLETED`) · 파일 문서만. 아니면 `DOCUMENT_NOT_FOUND` ·
 *   `UPLOAD_NOT_COMPLETED` · `UNSUPPORTED_FILE_FORMAT` (A-05 는 못 쓰는 문서를 고르지 못하게 막습니다)
 * - 문항 수: 3 · 6 · 9. 아니면 `INVALID_QUESTION_COUNT`
 * - 분당 10회 (`RATE_LIMIT_EXCEEDED`)
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
 * 답변 제출 REST 엔드포인트입니다. 경로와 `questionId`/`audioObjectKey`/
 * `videoObjectKey`/`isTimeout` 필드는 이슈 #54(`feat/24-interview-answer-flow`)로
 * 확인됐다. `durationSec`/`transcript` 는 `AnswerSubmission` 타입엔 남아있지만
 * 백엔드 요청 타입에 자리가 없어(#54 "확인이 필요한 것" 3번, 아직 미확정) 실제
 * 요청 바디에는 넣지 않는다 — TODO 는 `types/interview.ts` 의 `AnswerSubmission` 참고.
 */
export function submitAnswer(sessionId: string, submission: AnswerSubmission) {
  const { questionId, audioObjectKey, videoObjectKey, isTimeout } = submission
  return api.post<void>(`/api/interviews/${sessionId}/answers`, { questionId, audioObjectKey, videoObjectKey, isTimeout })
}
