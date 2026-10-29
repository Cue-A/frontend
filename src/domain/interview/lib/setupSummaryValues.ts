import { DELIVERY_MODES, INTERVIEWER_STYLES, type SessionSetup } from '../types/sessionSetup'

/** 고른 값이 없을 때 보여주는 말 */
export const NOT_SELECTED = '미선택'

/** 선택지 목록에서 값에 맞는 이름을 찾습니다. 값이 없거나 목록에 없으면 "미선택" 입니다 */
export function labelOf(choices: { value: string; label: string }[], value: string | null) {
  if (!value) return NOT_SELECTED
  return choices.find((choice) => choice.value === value)?.label ?? NOT_SELECTED
}

/**
 * 옵션 설정에서 고른 값을 화면에 보여줄 글로 바꿉니다.
 * 옵션 설정의 설정 요약(SetupSummary)과 장치 테스트의 면접 요약이 같은 문구를 쓰도록 한 곳에 둡니다.
 */
export const setupSummaryValues = {
  jobRole: (setup: SessionSetup) => setup.jobRole.trim() || '미입력',
  questionCount: (setup: SessionSetup) => `${setup.questionCount}문항`,
  answerTime: (setup: SessionSetup) =>
    setup.answerSeconds === null ? '제한 없음' : `질문당 ${setup.answerSeconds}초`,
  interviewer: (setup: SessionSetup) => labelOf(INTERVIEWER_STYLES, setup.interviewerStyle),
  deliveryMode: (setup: SessionSetup) => labelOf(DELIVERY_MODES, setup.deliveryMode),
}
