/**
 * 면접 옵션 설정 화면(A-05)이 쓰는 타입입니다.
 *
 * 서버 응답 타입이 아니라 **화면용 타입**입니다. 백엔드 계약이 확정되면
 * `domain/interview/api/` 에서 이 모양을 요청 본문으로 변환합니다.
 * (docs/01-conventions.md "타입" 절)
 */

/** 칩·드롭다운처럼 값 하나를 고르는 목록의 한 칸입니다. */
export type Choice<T extends string = string> = {
  value: T
  label: string
}

export type JobRole = 'FRONTEND' | 'BACKEND' | 'DATA' | 'PM' | 'DESIGNER'

export const JOB_ROLES: Choice<JobRole>[] = [
  { value: 'FRONTEND', label: '프론트엔드 개발자' },
  { value: 'BACKEND', label: '백엔드 개발자' },
  { value: 'DATA', label: '데이터 분석가' },
  { value: 'PM', label: '기획/PM' },
  { value: 'DESIGNER', label: '디자이너' },
]

export type InterviewerStyle = 'FRIENDLY' | 'NEUTRAL' | 'PRESSURE'

export const INTERVIEWER_STYLES: Choice<InterviewerStyle>[] = [
  { value: 'FRIENDLY', label: '친절한 면접관' },
  { value: 'NEUTRAL', label: '중립적 면접관' },
  { value: 'PRESSURE', label: '압박 면접관' },
]

export type DeliveryMode = 'TEXT_VOICE' | 'VOICE_ONLY'

export const DELIVERY_MODES: Choice<DeliveryMode>[] = [
  { value: 'TEXT_VOICE', label: '텍스트 + 음성' },
  { value: 'VOICE_ONLY', label: '음성만 듣기' },
]

/** 답변 시간(초). 시안의 "질문당 90초" 가 기본값입니다. */
export const ANSWER_SECONDS_CHOICES: Choice<string>[] = [
  { value: '60', label: '질문당 60초' },
  { value: '90', label: '질문당 90초' },
  { value: '120', label: '질문당 120초' },
]

export const QUESTION_COUNT_CHOICES: Choice<string>[] = [
  { value: '5', label: '5문항' },
  { value: '7', label: '7문항' },
  { value: '9', label: '9문항' },
]

/** 목록에 없는 기업을 고를 때 쓰는 값입니다. 이때 인재상을 직접 받습니다. */
export const CUSTOM_COMPANY = 'CUSTOM'

export type Company = {
  companyId: string
  name: string
}

/** 사용자가 고른 자기소개서. 업로드 계약이 없어서 아직 파일만 들고 있습니다. */
export type ResumeFile = {
  name: string
  /** 바이트 */
  size: number
}

export type SessionSetup = {
  jobRole: JobRole | null
  resume: ResumeFile | null

  useCompanyQuestion: boolean
  /** 기업 id. 목록에 없는 기업이면 CUSTOM */
  companyId: string | null
  /** companyId 가 CUSTOM 일 때만 씁니다 */
  customCulture: string

  answerSeconds: number
  questionCount: number
  interviewerStyle: InterviewerStyle | null
  deliveryMode: DeliveryMode
}

/** 면접을 시작하려면 다 채워야 하는 값들입니다. 시안의 "필수" 배지와 같습니다. */
export const REQUIRED_LABELS = ['직무 선택', '자기소개서 불러오기', '면접관 스타일'] as const
