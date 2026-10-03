/**
 * 면접 흐름의 네 단계입니다. 단계 표시(StepIndicator)와 화면 머리의 경로 표시(InterviewFlowHeader)가
 * **같은 이름**을 쓰도록 한 곳에 둡니다 — 따로 적으면 "모의면접 / 장치 테스트" 와 그 아래 단계 이름이 어긋납니다.
 */
export const INTERVIEW_STEPS = [
  { title: '옵션설정', subtitle: '직무 · 조건' },
  { title: '장치 테스트', subtitle: '마이크 · 카메라' },
  { title: '면접 진행', subtitle: '실전 응답' },
  { title: '결과 확인', subtitle: '리포트 · 피드백' },
] as const
