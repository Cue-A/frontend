/**
 * 리포트 화면에서 무엇을 보여줄지. (C-01 "표시 옵션")
 * 서버에 저장하지 않습니다. 지금 이 화면에서 뭘 볼지의 문제라
 * 새로고침하면 기본값으로 돌아가는 게 맞다고 봤습니다.
 */
export type DisplayOptions = {
  showTimeline: boolean
  showImprovedAnswer: boolean
  showVision: boolean
}

export const DEFAULT_DISPLAY_OPTIONS: DisplayOptions = {
  showTimeline: true,
  showImprovedAnswer: true,
  showVision: true,
}
