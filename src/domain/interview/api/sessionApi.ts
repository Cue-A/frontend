import { api } from '@/shared/api/apiClient'

import type { AnswerSubmission, InterviewOptions } from '../types/interview'
import {
  CUSTOM_COMPANY,
  type Company,
  type CompanyResponse,
  type InterviewerStyle,
  type SessionSetup,
} from '../types/sessionSetup'

import {
  recallSessionOptions,
  rememberSessionOptions,
  rememberSessionSummary,
  toSessionOptions,
} from './sessionOptionsDraft'
import './sessionMock'

/**
 * 화면에서는 id 를 **문자열로 바꿔** 씁니다. (이슈 #149)
 *
 * 기업 드롭다운(`<select>`)의 값은 브라우저가 늘 문자열로 돌려줍니다. id 를 숫자 그대로 두면 고른 값(`"1"`)과 목록의
 * id(`1`)가 `===` 로 맞지 않아서, 설정 요약에 기업명 대신 "선택 안 함" 이 나옵니다. 그래서 응답을 받는 이 자리에서만
 * 바꾸고, 화면(드롭다운 · 설정 요약 · 이 탭에 남기는 설정값)은 문자열 하나로 씁니다. 서버로 보낼 때는 `toCompanyId` 가
 * 다시 숫자로 바꿉니다.
 */
function toCompany(response: CompanyResponse): Company {
  return { companyId: String(response.companyId), name: response.name }
}

/** 기업 목록입니다. 백엔드는 `verified` 인 기업만 이름순으로 주고, 등록된 기업이 없으면 빈 배열입니다 */
export async function getCompanies(): Promise<Company[]> {
  const list = await api.get<CompanyResponse[]>('/api/companies')
  return list.map(toCompany)
}

/**
 * 세션 시작 요청 본문. (Cue-A/backend `InterviewStartRequest`, dev 머지됨 · #54 1-6)
 *
 * 문서 필드 이름은 `documentId` 입니다. 처음엔 `documentPublicId` 였는데 문서 API 와 맞춰 바뀌었습니다
 * (Cue-A/backend#46). 값은 그대로 문서의 UUID 입니다.
 *
 * 화면의 설정 중 **서버가 받지 않는 값은 싣지 않습니다.** 받을 자리가 없어서 보내도 버려집니다.
 * - `customCulture`(목록에 없는 기업의 인재상 직접 입력) — 서버 요청에 없습니다. 서버는 등록된
 *   기업 id 만 받고, 인재상은 그 기업 정보로 서버가 만듭니다
 */
type InterviewStartRequest = {
  /** 보관함에서 고른 문서의 UUID. 필수 */
  documentId: string
  /** 등록된 기업의 숫자 id. 없으면 연습 모드 */
  companyId: number | null
  /** 자유 문자열(100자). 서버가 AI 에 그대로 넘깁니다. 사용자가 적은 직무를 앞뒤 공백만 잘라 보냅니다 */
  jobRole: string
  /** 이름만 다르고 값은 같습니다 (`FRIENDLY` · `PRESSURE`) */
  persona: InterviewerStyle
  /** 3 · 6 · 9 */
  questionCount: number
  /**
   * 질문 글을 숨기고 음성만 들려줄지. 옵션 설정의 진행 방식 "음성만 듣기"(`VOICE_ONLY`)면 true 입니다
   * (Cue-A/backend#70). 서버는 생략하면 false 로 봅니다
   */
  hideQuestionText: boolean
  /**
   * 질문 하나의 답변 제한 시간(초). 60 · 90 · 120, "제한 없음"이면 null 입니다. (Cue-A/backend#100 · 이슈 #161)
   *
   * **늘 싣습니다.** 서버는 이 필드가 없으면 기본값 90초로 저장하고, null 이 와야 "제한 없음"으로 저장합니다.
   * 빼먹으면 "제한 없음"을 골라도 90초가 되어서 생략할 수 있는 칸으로 두지 않습니다. 그 밖의 값은 `INVALID_REQUEST` 입니다.
   * 이 필드를 모르는 서버(backend#100 전)는 그냥 버립니다
   */
  answerTimeLimitSec: number | null
  /**
   * 재연습이면 원래 면접의 세션 id (몇 회차든 상관없음). 없으면 새 면접입니다. (Cue-A/backend#78 · 이슈 #152)
   * 재연습이면 위 고정 옵션 다섯 개(`documentId` · `companyId` · `jobRole` · `questionCount` · `persona`)가
   * 최초 면접과 같아야 합니다. 다르면 `INVALID_REQUEST` 입니다
   */
  sourceSessionId?: string
}

/**
 * 기업 id 를 서버 모양(숫자)으로 되돌립니다. 바꿀 수 없으면 null — 연습 모드로 시작합니다.
 *
 * 화면은 기업 id 를 문자열로 들고 있습니다(`toCompany` 참고). 서버는 `verified` 인 기업의 숫자 id 만 받고, 모르는
 * id 는 `INVALID_REQUEST` 로 거절합니다. 숫자로 못 바꾸는 값(예: 예전 목업 id `'naver'` 가 이 탭에 남은 경우)을
 * 그대로 보내면 면접 시작이 통째로 실패하므로 빼고 보냅니다.
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
  const jobRole = setup.jobRole.trim()

  if (!setup.resume || !jobRole || !setup.interviewerStyle) {
    throw new Error('필수 항목(문서 · 직무 · 면접관)이 비어 있는 채로 세션 생성을 불렀습니다')
  }

  return {
    documentId: setup.resume.documentId,
    companyId: toCompanyId(setup),
    jobRole,
    persona: setup.interviewerStyle,
    questionCount: setup.questionCount,
    hideQuestionText: setup.deliveryMode === 'VOICE_ONLY',
    answerTimeLimitSec: setup.answerSeconds,
  }
}

export type CreatedSession = {
  /** AI 가 발급한 세션 id. 이후 모든 면접 API 와 소켓 주소에 씁니다 */
  sessionId: string
  /** 고른 문항 수 (되묻기 제외). 진행률 "N / 전체" 의 전체입니다 */
  questionTotal: number
  /** 재연습이 실제로 적용됐는지. 새 면접이면 false 입니다 (Cue-A/backend#78) */
  replayApplied?: boolean
  /**
   * 서버에 실제로 저장된 세션 옵션입니다. 요청값이 아니라 저장값이라 서버와 어긋나지 않습니다. (Cue-A/backend#100)
   * 면접관 스타일은 요청(`FRIENDLY`)과 달리 소문자(`friendly`)로 옵니다. 답변 시간은 "제한 없음"이면 null 입니다.
   *
   * backend#100 전 서버면 이 셋이 없습니다. 그때는 요청값을 대신 씁니다 (`savedOptionsOf`)
   */
  hideQuestionText?: boolean
  interviewerStyle?: InterviewOptions['interviewerStyle']
  answerTimeLimitSec?: number | null
}

/**
 * 시작 응답에 실린 저장된 옵션입니다. 셋 중 하나라도 없거나 모양이 다르면 null 입니다 — 응답에 옵션을 싣지 않는
 * 서버라서, 부르는 쪽이 요청값(`toSessionOptions`)을 대신 씁니다.
 */
function savedOptionsOf(session: CreatedSession): InterviewSessionOptions | null {
  const { hideQuestionText, interviewerStyle, answerTimeLimitSec } = session

  if (typeof hideQuestionText !== 'boolean') return null
  if (interviewerStyle !== 'friendly' && interviewerStyle !== 'pressure') return null
  if (answerTimeLimitSec !== null && typeof answerTimeLimitSec !== 'number') return null

  return { hideQuestionText, interviewerStyle, answerTimeLimitSec }
}

/**
 * 면접 세션 시작. `POST /api/interviews` → **202 Accepted**
 *
 * 첫 질문은 이 응답에 없고 WebSocket(`/ws/interviews/{sessionId}`)으로 따로 옵니다.
 * 서버는 응답을 돌려준 **뒤** 백그라운드에서 첫 질문을 만들어 소켓으로 밀어 넣습니다.
 *
 * 걸리는 제한 — 서버가 다시 봅니다.
 * - 문서: 본인 것 · 준비된 것 · 저장된 파일이 있는 것(직접 작성 문서도 파일로 저장됩니다 — Cue-A/backend#39).
 *   아니면 `DOCUMENT_NOT_FOUND` · `UPLOAD_NOT_COMPLETED` · `UNSUPPORTED_FILE_FORMAT`
 * - 문항 수: 3 · 6 · 9. 아니면 `INVALID_QUESTION_COUNT`
 * - 분당 10회 (`RATE_LIMIT_EXCEEDED`)
 *
 * 재연습은 `sourceSessionId` 를 같이 넘깁니다. 고정 옵션은 재연습 조건 조회(`getReplayOptions`) 값 그대로여야 합니다.
 */
export async function createSession(
  setup: SessionSetup,
  { sourceSessionId, companies = [] }: { sourceSessionId?: string; companies?: Company[] } = {},
) {
  const body: InterviewStartRequest = sourceSessionId ? { ...toCreateBody(setup), sourceSessionId } : toCreateBody(setup)
  const session = await api.post<CreatedSession>('/api/interviews', body)
  // 면접 화면이 쓸 옵션을 세션별로 남겨 둡니다. 서버가 저장한 값이 응답에 있으면 그 값을, 없으면 요청값을 남깁니다
  // (`getInterviewOptions` · sessionOptionsDraft.ts)
  rememberSessionOptions(session.sessionId, savedOptionsOf(session) ?? toSessionOptions(setup))
  // 직무 · 기업명 · 질문 수는 조회 API 에 없어서 만들 때의 값을 남깁니다. 장치 테스트의 면접 요약(이슈 #132)과 면접 화면
  // 상단 "기업 · 직무" 표시가 같이 읽는다. 기업명은 요청한 기업 id 로 목록에서 찾는다.
  const companyId = toCompanyId(setup)
  const companyName = companyId === null ? null : (companies.find((company) => company.companyId === String(companyId))?.name ?? null)
  rememberSessionSummary(session.sessionId, {
    jobRole: body.jobRole,
    companyName,
    questionCount: session.questionTotal ?? body.questionCount,
  })
  return session
}

/**
 * 면접 진행 화면(B-01-2)이 필요로 하는 세션 옵션만 담는다. `InterviewOptions` 전체가
 * 아니라 이 셋만 쓰는 이유: jobRole · resumeDocId · companyTalentProfile ·
 * questionCountLabel · interviewerCount 는 지금까지 만들어진 B-01/B-01-2 UI 어디에서도
 * 쓰이지 않는다.
 *
 * **세션을 만들 때 이 탭에 남겨 둔 값을 먼저 쓴다** (`createSession` · sessionOptionsDraft.ts). 남긴 값은 시작 응답의
 * 저장값이라 서버와 같아서, 같은 탭에서는 조회 API 를 부르지 않는다. 남긴 값이 없을 때만(새로 연 탭 · 다른 기기)
 * `GET /api/interviews/{sessionId}` 로 서버에 저장된 값을 읽고, 이 탭에 남겨 둔다. (Cue-A/backend#100 · 이슈 #161)
 *
 * 응답의 면접관 스타일은 소문자(friendly · pressure), 답변 시간은 "제한 없음"이면 null 이다. 답변 시간을 저장하기
 * 전에 만든 과거 세션도 null 로 온다 — 실제 설정값을 알 수 없어서 서버가 "제한 없음"으로 본다.
 */
export type InterviewSessionOptions = Pick<InterviewOptions, 'interviewerStyle' | 'hideQuestionText' | 'answerTimeLimitSec'>

/** `GET /api/interviews/{sessionId}` 응답입니다. 화면은 `sessionId` 를 빼고 씁니다 */
type InterviewSessionOptionsResponse = InterviewSessionOptions & { sessionId: string }

export async function getInterviewOptions(sessionId: string): Promise<InterviewSessionOptions> {
  const remembered = recallSessionOptions(sessionId)
  if (remembered) return remembered

  const { hideQuestionText, interviewerStyle, answerTimeLimitSec } = await api.get<InterviewSessionOptionsResponse>(
    `/api/interviews/${sessionId}`,
  )
  const options = { hideQuestionText, interviewerStyle, answerTimeLimitSec }
  rememberSessionOptions(sessionId, options)
  return options
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

/**
 * 면접 중도 이탈. `POST /api/interviews/{sessionId}/abort` — 백엔드 `InterviewController.abort`
 * 로 실제로 있다(Cue-A/backend#25, PR#43 로 머지됨). 경로 · 메서드 · 바디 없음까지 여기 모양과
 * 그대로 맞는다.
 *
 * 그래도 여전히 mock 으로만 동작한다 — `interviews` 도메인 전체(세션 시작 · WS · 답변 제출 ·
 * abort)가 `VITE_REAL_APIS` 로 한 번에 켜지는 구조라서(`shared/api/mock.ts`), abort 하나만 골라
 * real 로 못 돌린다. 도메인 전체를 켤 준비(이슈 #54 섹션 2 나머지, 특히 WS 인증 미확정인
 * 2-4)가 끝나야 의미 있게 켤 수 있다.
 */
export function abortSession(sessionId: string) {
  return api.post<void>(`/api/interviews/${sessionId}/abort`)
}

/**
 * 면접 중 질문 북마크. `PUT /api/interviews/{sessionId}/questions/{questionId}/bookmark`
 *
 * 버튼은 누를 때마다 바뀌는 토글이지만 서버에는 **바뀔 상태**를 보냅니다. 이미 그 상태면 아무것도 바꾸지 않고 성공입니다.
 * `false` 로 빼면 그 질문에 쓴 메모도 함께 지워집니다. 되묻기(`REASK`) 질문도 담을 수 있습니다.
 * 끝난 세션은 `SESSION_ENDED` · 중단된 세션은 `SESSION_ABORTED`(409) 입니다.
 *
 * **백엔드에 아직 배포되지 않았습니다.** 구현은 Cue-A/backend#118(`feat/117-question-bookmark`, dev 로 리뷰 중)이고 경로 · 본문 ·
 * 응답 · 에러 코드가 이 함수와 같습니다. 머지 · 배포되면 `sessionMock.ts` 의 `missingInBackend` 를 지웁니다. 그 전까지는 목업이 답합니다.
 * 질문 push 에 북마크 여부가 없어서 면접 중 새로고침하면 아이콘이 비어 보이는 건 서버도 같은 한계로 알고 있습니다(backend#118).
 */
export function setQuestionBookmark(sessionId: string, questionId: string, bookmarked: boolean) {
  return api.put<{ bookmarked: boolean }>(
    `/api/interviews/${encodeURIComponent(sessionId)}/questions/${encodeURIComponent(questionId)}/bookmark`,
    { bookmarked },
  )
}
