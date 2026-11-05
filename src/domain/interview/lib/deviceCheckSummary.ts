import type { InterviewSessionOptions } from '../api/sessionApi'
import type { SessionSummary } from '../api/sessionOptionsDraft'
import { INTERVIEWER_STYLES, type SessionSetup } from '../types/sessionSetup'

import { answerTimeText, labelOf, setupSummaryValues } from './setupSummaryValues'

/** 장치 테스트 "면접 요약" 한 줄입니다. value 가 null 이면 화면이 빈 표시("-")를 둡니다 */
export type DeviceCheckSummaryRow = { label: string; value: string | null }

/** 재연습처럼 화면 이동 값으로 받은 옵션 설정에서 만듭니다 */
export function summaryRowsOfSetup(setup: SessionSetup): DeviceCheckSummaryRow[] {
  return [
    { label: '직무', value: setupSummaryValues.jobRole(setup) },
    { label: '질문 수', value: setupSummaryValues.questionCount(setup) },
    { label: '답변 시간', value: setupSummaryValues.answerTime(setup) },
    { label: '면접관', value: setupSummaryValues.interviewer(setup) },
  ]
}

/**
 * 서버에 저장된 세션 옵션(조회 API · 시작 응답)과 세션을 만들 때 남긴 직무 · 질문 수에서 만듭니다.
 * 값을 아직 모르면(불러오는 중 · 실패 · 새로 연 탭의 직무 · 질문 수) 그 줄은 null 입니다.
 */
export function summaryRowsOfSession(
  options: InterviewSessionOptions | null,
  summary: SessionSummary | null,
): DeviceCheckSummaryRow[] {
  return [
    { label: '직무', value: summary ? summary.jobRole : null },
    { label: '질문 수', value: summary ? `${summary.questionCount}문항` : null },
    { label: '답변 시간', value: options ? answerTimeText(options.answerTimeLimitSec) : null },
    // 서버는 소문자(friendly · pressure), 화면 선택지는 대문자입니다
    { label: '면접관', value: options ? labelOf(INTERVIEWER_STYLES, options.interviewerStyle.toUpperCase()) : null },
  ]
}
