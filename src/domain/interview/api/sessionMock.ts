import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import type { CompanyResponse } from '../types/sessionSetup'

import { mockReplayOptionsOf } from './replayMock'
import { advanceMockSession } from './sessionSocketMock'

/**
 * 기업 목록 목업입니다. 시안에 "약 30개 기업의 인재상 데이터가 등록되어 있어요"
 * 라고 되어 있는데, 실제 목록은 백엔드가 가지고 있습니다. 여기서는 드롭다운이
 * 그려지는지 확인할 만큼만 넣어둡니다.
 *
 * **백엔드 응답 모양 그대로** 숫자 id 입니다(Cue-A/backend#86). 전에는 `'naver'` 같은 문자열이라 화면 비교는
 * 맞았지만, 세션 시작 때 숫자로 못 바꿔서 기업 맞춤 질문이 목업에서 한 번도 실리지 않았습니다. (이슈 #149)
 * 순서도 백엔드처럼 이름 오름차순입니다.
 */
const COMPANIES: CompanyResponse[] = [
  { companyId: 1, name: '네이버' },
  { companyId: 2, name: '당근' },
  { companyId: 3, name: '라인' },
  { companyId: 4, name: '우아한형제들' },
  { companyId: 5, name: '카카오' },
  { companyId: 6, name: '쿠팡' },
  { companyId: 7, name: '토스' },
]

registerMock('GET', '/api/companies', () => COMPANIES, {
  missingInBackend: '기업 API 없음 (명세서 v0.2 `/v1/companies` 시작 전)',
})

/**
 * 면접 세션 생성 목업입니다. 검사 순서와 에러 코드는 백엔드 `InterviewStartService` 를 따랐습니다.
 *
 * 문서가 실제로 준비된 파일 문서인지는 **보지 않습니다.** 그건 문서 목업(domain/document)이 들고
 * 있는데, 다른 도메인의 api 를 가져다 쓰지 않는 규칙이라서입니다. A-05 가 못 쓰는 문서를 고르지
 * 못하게 막고 있어서 화면에서는 이 경로로 올 일이 없습니다.
 *
 * sessionId 는 면접 진행 목업(sessionSocketMock)이 `s1` 시나리오를 돌려서 고정 값입니다.
 *
 * 진행 옵션(질문 글 숨김 · 면접관 스타일 · 답변 시간)은 백엔드처럼 세션에 저장해 두고, 시작 응답과 아래 세션 옵션 조회
 * 목업이 같은 값을 돌려줍니다. (Cue-A/backend#100 · 이슈 #161) 목업 세션은 `s1` 하나라 마지막으로 만든 세션의 값만
 * 둡니다. 면접 화면에서 새로고침해도 남도록 sessionStorage 에 둡니다(막혀 있으면 메모리만).
 */
type MockSessionOptions = {
  hideQuestionText: boolean
  interviewerStyle: 'friendly' | 'pressure'
  answerTimeLimitSec: number | null
}

const MOCK_OPTIONS_KEY = 'cue-a:mock:sessionOptions'
let lastOptions: MockSessionOptions = { hideQuestionText: false, interviewerStyle: 'friendly', answerTimeLimitSec: 90 }

function rememberMockOptions(options: MockSessionOptions) {
  lastOptions = options
  try {
    sessionStorage.setItem(MOCK_OPTIONS_KEY, JSON.stringify(options))
  } catch {
    // 저장소가 막힌 브라우저는 메모리 값만 씁니다.
  }
}

function recallMockOptions(): MockSessionOptions {
  try {
    const saved = sessionStorage.getItem(MOCK_OPTIONS_KEY)
    if (saved !== null) {
      const options = JSON.parse(saved) as Partial<MockSessionOptions>
      const validStyle = options.interviewerStyle === 'friendly' || options.interviewerStyle === 'pressure'
      const validTime = options.answerTimeLimitSec === null || typeof options.answerTimeLimitSec === 'number'
      if (typeof options.hideQuestionText === 'boolean' && validStyle && validTime) return options as MockSessionOptions
    }
  } catch {
    // 위와 같습니다. 모양이 깨진 값도 버리고 메모리 값을 씁니다.
  }
  return lastOptions
}

/** 서버가 받는 답변 시간(초). "제한 없음"은 null 입니다 */
const ANSWER_TIME_LIMITS = [60, 90, 120]

/** 필드가 없을 때 서버가 저장하는 답변 시간입니다. 옵션 설정의 기본 선택값과 같습니다 */
const DEFAULT_ANSWER_TIME_LIMIT = 90

/**
 * 답변 시간을 백엔드 `AnswerTimeLimit` 처럼 읽습니다. **필드가 없는 것과 null 을 다르게 봅니다.**
 * - 필드 없음 → 기본값 90초
 * - null → 제한 없음
 * - 60 · 90 · 120 → 그 값, 그 밖의 값 → `INVALID_REQUEST`
 */
function answerTimeLimitOf(request: Partial<Record<string, unknown>>): number | null {
  const value = request.answerTimeLimitSec
  if (value === undefined) return DEFAULT_ANSWER_TIME_LIMIT
  if (value === null) return null
  if (typeof value === 'number' && ANSWER_TIME_LIMITS.includes(value)) return value
  throw new ApiError('INVALID_REQUEST', `answerTimeLimitSec 는 60, 90, 120, null 중 하나여야 합니다 (${String(value)})`)
}

/**
 * 재연습 요청을 백엔드 `InterviewStartService.resolveReplayPlan` 처럼 거릅니다. (이슈 #152)
 * - 끝나지 않은 원래 면접 — `SESSION_NOT_COMPLETED`
 * - 지워진 자기소개서 — `DOCUMENT_NOT_FOUND`, 쓸 수 없게 된 기업 — `INVALID_REQUEST`
 * - 고정 옵션 다섯 개 중 하나라도 최초 면접과 다름 — `INVALID_REQUEST`
 */
function checkMockReplay(sourceSessionId: string, request: Partial<Record<string, unknown>>) {
  const root = mockReplayOptionsOf(sourceSessionId)
  const blocked = root.replayBlockReasons.map((reason) => reason.code)

  if (blocked.includes('DOCUMENT_DELETED')) throw new ApiError('DOCUMENT_NOT_FOUND', '문서를 찾을 수 없습니다')
  if (blocked.includes('COMPANY_UNVERIFIED')) throw new ApiError('INVALID_REQUEST', '사용할 수 없는 기업입니다')

  const same =
    request.documentId === root.documentId &&
    (request.companyId ?? null) === root.companyId &&
    request.jobRole === root.jobRole &&
    request.questionCount === root.questionCount &&
    request.persona === root.persona

  if (!same) {
    throw new ApiError('INVALID_REQUEST', '재연습은 최초 면접과 같은 조건으로만 시작할 수 있습니다')
  }
}

registerMock('POST', '/api/interviews', (_params, body) => {
  const request = (body ?? {}) as Partial<Record<string, unknown>>

  if (typeof request.documentId !== 'string' || !request.documentId.trim()) {
    throw new ApiError('INVALID_REQUEST', 'documentId 가 필요합니다')
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
  if (typeof request.companyId === 'number' && !COMPANIES.some((company) => company.companyId === request.companyId)) {
    // 서버는 등록된(verified) 기업만 받습니다. 목록에 없는 id 는 INVALID_REQUEST 입니다.
    throw new ApiError('INVALID_REQUEST', `등록되지 않은 기업입니다 (${request.companyId})`)
  }

  const questionCount = request.questionCount ?? 6
  if (questionCount !== 3 && questionCount !== 6 && questionCount !== 9) {
    throw new ApiError('INVALID_QUESTION_COUNT', '질문 수는 3, 6, 9 중 하나여야 합니다')
  }
  if (request.hideQuestionText !== undefined && request.hideQuestionText !== null && typeof request.hideQuestionText !== 'boolean') {
    // 서버는 Boolean 이라 다른 값은 요청 해석 단계에서 거절됩니다. 생략하면 false 입니다.
    throw new ApiError('INVALID_REQUEST', `hideQuestionText 는 true/false 여야 합니다 (${String(request.hideQuestionText)})`)
  }
  const answerTimeLimitSec = answerTimeLimitOf(request)

  const replayApplied = typeof request.sourceSessionId === 'string' && request.sourceSessionId.trim() !== ''
  if (replayApplied) checkMockReplay(request.sourceSessionId as string, { ...request, questionCount })

  const options: MockSessionOptions = {
    hideQuestionText: request.hideQuestionText === true,
    // 요청은 대문자(FRIENDLY)지만 응답은 소문자(friendly)입니다
    interviewerStyle: request.persona === 'PRESSURE' ? 'pressure' : 'friendly',
    answerTimeLimitSec,
  }
  rememberMockOptions(options)
  return { sessionId: 's1', questionTotal: questionCount, replayApplied, ...options }
})

/**
 * 면접 진행 화면(B-01-2)이 쓰는 세션 옵션 목업입니다.
 *
 * 보통은 여기까지 오지 않습니다. 세션을 만들 때 시작 응답의 옵션을 이 탭에 남겨 두고 면접 화면이 그걸 먼저 읽기
 * 때문입니다 (sessionApi.getInterviewOptions · sessionOptionsDraft.ts). 남긴 값이 없을 때만(다른 탭에서 연 면접) 이
 * 목업이 답하고, 위 세션 생성 목업이 저장한 값을 돌려줍니다.
 *
 * 백엔드 dev 에는 있지만(Cue-A/backend#100) 배포 서버에는 아직 없어서 `missingInBackend` 를 둡니다. 재배포를
 * 확인하면 지웁니다.
 */
registerMock('GET', '/api/interviews/:sessionId', ({ sessionId }) => ({ sessionId, ...recallMockOptions() }), {
  missingInBackend: '면접 옵션 조회 API 가 배포 서버에 없음 (backend#100 dev 머지, 재배포 전)',
})

/**
 * 답변 제출 목업입니다. 실제 WS 시나리오(sessionSocketMock)의 다음 턴(progress →
 * 다음 질문 또는 session_end)을 이 제출이 트리거한다.
 */
registerMock('POST', '/api/interviews/:sessionId/answers', ({ sessionId }) => {
  advanceMockSession(sessionId)
})

/**
 * 면접 중도 이탈 목업입니다. 성공만 흉내낸다 — 실패 경로 확인은 수동으로 이 핸들러를
 * 잠깐 throw 하도록 바꿔서 검증한다. 백엔드엔 실제 엔드포인트가 있지만(Cue-A/backend#25,
 * PR#43) `interviews` 도메인 전체가 아직 mock 이라 이 목업이 계속 쓰인다 —
 * sessionApi.abortSession 주석 참고.
 */
registerMock('POST', '/api/interviews/:sessionId/abort', () => {})
