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
