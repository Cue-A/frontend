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

/**
 * 시안에서는 "시선 지표 포함"이 꺼져 있는데 시선 줄은 그대로 보입니다.
 * 이 토글이 정확히 뭘 끄는 건지 확인이 필요해서, 일단 켜둔 상태를 기본으로 뒀습니다.
 */
export const DEFAULT_DISPLAY_OPTIONS: DisplayOptions = {
  showTimeline: true,
  showImprovedAnswer: true,
  showVision: true,
}
