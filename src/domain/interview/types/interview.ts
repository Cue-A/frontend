/**
 * 면접 진행 화면(B파트) 공통 타입입니다.
 * WS 메시지 실제 필드명 기준이며, 백엔드(Cue-A/backend, dev)와 합의된 값이라
 * 임의로 이름·구조를 바꾸지 않습니다.
 */
export type QuestionType = 'QUESTION' | 'FOLLOWUP' | 'REASK'

export type Question = {
  questionId: string
  questionType: QuestionType
  text: string
  audioUrl: string | null
  audioAvailable: boolean
  category: string | null
  difficulty: 'L1' | 'L2' | 'L3' | null
  /** REASK 에서는 서버가 이전 값을 그대로 보낸다(값이 올라가지 않는다). */
  questionNumber: number | null
  /** 세션 내내 고정값 (3 | 6 | 9) */
  questionTotal: number
}

export type InterviewOptions = {
  jobRole: string
  resumeDocId: string | null
  companyTalentProfile: string | null
  questionCountLabel: 3 | 6 | 9
  /** 세션 전체가 아니라 질문 1개당 제한 */
  answerTimeLimitSec: number | null
  interviewerStyle: 'friendly' | 'pressure'
  hideQuestionText: boolean
  /** MVP 1 고정 */
  interviewerCount: number
}

export type InterviewerStyle = InterviewOptions['interviewerStyle']

export type SessionPhase = 'presenting' | 'answering' | 'submitting' | 'waitingNextQuestion' | 'finished'

/** DeviceStatusChip 전용 상태. 장치 테스트(B파트 진입 전) 화면의 3단계(DeviceCheckState)와는 별개다. */
export type DeviceStatus = 'ok' | 'warning'

/**
 * WS push 페이로드입니다. 공통 봉투는 `{ type, payload }` 이고 `type` 은
 * 'question' | 'progress' | 'error' | 'session_end' 다 (docs/90-open-questions.md Q6a).
 * 문서엔 'session-end'로 적혀 있지만 백엔드 코드 기준으로는 'session_end'가 맞다 — 문서 오타.
 * 봉투 자체의 파싱은 api/sessionSocket.ts 안에만 두고 여기서는 payload 모양만 정의한다.
 */
export type ProgressPush = {
  stage: 'TRANSCRIBING' | 'GENERATING' | 'SYNTHESIZING'
}

export type ErrorPush = {
  errorCode: string
  message: string
  retryable: boolean
  needsRerecord: boolean
}

export type SessionEndPush = {
  sessionId: string
  totalQuestions: number
}

/**
 * 답변 제출 요청 바디입니다. (이슈 #54, `feat/24-interview-answer-flow` 확인 기준으로
 * `audioObjectKey`/`videoObjectKey`/`isTimeout` 로 확정됨 — 녹화 업로드(useAnswerRecording)가
 * 끝난 뒤 받은 objectKey 를 그대로 담는다. `submissionReason`(manual/timeout)은
 * `isTimeout` 으로 대체됐다.
 */
export type AnswerSubmission = {
  questionId: string
  audioObjectKey: string
  videoObjectKey: string | null
  isTimeout: boolean
  /**
   * TODO(#54 확인 필요): 백엔드 요청 타입에 이 두 필드를 받을 자리가 없다. AI가 STT를
   * 다시 돌리기 때문에 안 보내도 되는 것인지 이슈 #54 "확인이 필요한 것" 3번으로 아직
   * 열려 있다 — 결정 전까지 `sessionApi.submitAnswer` 는 실제 요청 바디에 이 필드들을
   * 넣지 않는다. 화면 쪽(재답변 판단 등)에서 계속 들고 있어야 해서 타입에서는 지우지
   * 않는다.
   */
  durationSec: number
  transcript: string
}
