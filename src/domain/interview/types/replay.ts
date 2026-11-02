import type { InterviewerStyle } from './sessionSetup'

/** 재연습을 지금 시작할 수 없는 이유 한 건입니다 */
export type ReplayBlockReason = {
  /** `DOCUMENT_DELETED` · `COMPANY_UNVERIFIED`. 모르는 코드가 와도 그대로 둡니다 */
  code: string
  /** 사용자에게 보여줄 문구. 아는 코드면 프론트 문구, 모르는 코드면 백엔드 문구입니다 */
  message: string
}

/**
 * 재연습 화면이 쓰는 최초(1회차) 면접의 조건입니다. (이슈 #152)
 *
 * 재연습은 **최초 면접과 같은 조건으로만** 시작할 수 있습니다. 자기소개서 · 기업 · 직무 · 질문 수 · 면접관 다섯 개는
 * 바꿀 수 없고, 답변 시간과 진행 방식(질문 글 숨김)만 고릅니다. 2 · 3회차에서 들어와도 늘 1회차 값입니다.
 */
export type ReplayOptions = {
  /** 최초(1회차) 세션 id */
  rootSessionId: string

  documentId: string
  documentTitle: string
  /** 기업을 고르지 않은 연습 모드면 null */
  companyId: number | null
  companyName: string | null
  jobRole: string
  questionCount: number
  interviewerStyle: InterviewerStyle

  /** 지금 이 조건으로 시작할 수 있는지. 최종 판정은 세션 시작 API 가 합니다 */
  replayable: boolean
  /** 시작할 수 없는 이유. 시작할 수 있으면 빈 배열입니다 */
  blockReasons: ReplayBlockReason[]
}
