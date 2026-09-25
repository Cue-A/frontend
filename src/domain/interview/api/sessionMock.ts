import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import type { Company } from '../types/sessionSetup'

import { advanceMockSession } from './sessionSocketMock'

/**
 * 기업 목록 목업입니다. 시안에 "약 30개 기업의 인재상 데이터가 등록되어 있어요"
 * 라고 되어 있는데, 실제 목록은 백엔드가 가지고 있습니다. 여기서는 드롭다운이
 * 그려지는지 확인할 만큼만 넣어둡니다.
 */
const COMPANIES: Company[] = [
  { companyId: 'naver', name: '네이버' },
  { companyId: 'kakao', name: '카카오' },
  { companyId: 'line', name: '라인' },
  { companyId: 'coupang', name: '쿠팡' },
  { companyId: 'baemin', name: '우아한형제들' },
  { companyId: 'toss', name: '토스' },
  { companyId: 'danggeun', name: '당근' },
]

registerMock('GET', '/api/companies', () => COMPANIES)

/**
 * 면접 세션 생성 목업입니다. 검사 순서와 에러 코드는 백엔드 `InterviewStartService` 를 따랐습니다.
 *
 * 문서가 실제로 준비된 파일 문서인지는 **보지 않습니다.** 그건 문서 목업(domain/document)이 들고
 * 있는데, 다른 도메인의 api 를 가져다 쓰지 않는 규칙이라서입니다. A-05 가 못 쓰는 문서를 고르지
 * 못하게 막고 있어서 화면에서는 이 경로로 올 일이 없습니다.
 *
 * sessionId 는 면접 진행 목업(sessionSocketMock)이 `s1` 시나리오를 돌려서 고정 값입니다.
 */
registerMock('POST', '/api/interviews', (_params, body) => {
  const request = (body ?? {}) as Partial<Record<string, unknown>>

  if (typeof request.documentPublicId !== 'string' || !request.documentPublicId.trim()) {
    throw new ApiError('INVALID_REQUEST', 'documentPublicId 가 필요합니다')
  }
  if (typeof request.jobRole !== 'string' || !request.jobRole.trim() || request.jobRole.length > 100) {
    throw new ApiError('INVALID_REQUEST', 'jobRole 은 1~100자여야 합니다')
  }
  if (request.persona !== 'FRIENDLY' && request.persona !== 'PRESSURE') {
    throw new ApiError('INVALID_REQUEST', `persona 가 올바르지 않습니다 (${String(request.persona)})`)
  }
  if (request.companyId !== null && request.companyId !== undefined && typeof request.companyId !== 'number') {
    // 서버는 Long 이라 문자열 id 는 요청 해석 단계에서 거절됩니다.
    throw new ApiError('INVALID_REQUEST', `companyId 는 숫자여야 합니다 (${String(request.companyId)})`)
  }

  const questionCount = request.questionCount ?? 6
  if (questionCount !== 3 && questionCount !== 6 && questionCount !== 9) {
    throw new ApiError('INVALID_QUESTION_COUNT', '질문 수는 3, 6, 9 중 하나여야 합니다')
  }

  return { sessionId: 's1', questionTotal: questionCount }
})

/**
 * 면접 진행 화면(B-01-2)이 쓰는 세션 옵션 목업입니다. 고정값만 돌려준다 — 이유는
 * sessionApi.getInterviewOptions 주석 참고 (interviewerStyle 대소문자/값 범위 불일치).
 */
registerMock('GET', '/api/interviews/:sessionId', () => ({
  interviewerStyle: 'friendly',
  hideQuestionText: false,
  answerTimeLimitSec: 90,
}))

/**
 * 답변 제출 목업입니다. 실제 WS 시나리오(sessionSocketMock)의 다음 턴(progress →
 * 다음 질문 또는 session_end)을 이 제출이 트리거한다.
 */
registerMock('POST', '/api/interviews/:sessionId/answers', ({ sessionId }) => {
  advanceMockSession(sessionId)
})
