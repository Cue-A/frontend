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

export type AnswerSubmission = {
  questionId: string
  durationSec: number
  transcript: string
  /**
   * 프론트가 판단해 추가한 필드로, 백엔드 계약엔 아직 없다 (INT-8 관련 결정, 2026-09-16).
   * 타임아웃으로 끊긴 답변이 되묻기(REASK) 오작동으로 이어지지 않게 구분하고, 자동
   * 제출된 답변을 최종 평가에서 제외하기 위해 필요하다 — 백엔드와 계약 협의가 필요하다.
   */
  submissionReason: 'manual' | 'timeout'
}
