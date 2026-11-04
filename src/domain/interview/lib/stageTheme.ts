/**
 * 면접 진행 화면 배경 테마 비교용 **임시** 스위치입니다. 결정이 나면 이 파일과 쓰는 곳의 분기를 지우고 한쪽만 남긴다
 * (`styles/tokens.css` 맨 아래 `[data-stage-theme='dark']` 블록도 같이).
 *
 * - `light`(기본) 연보라 그라디언트
 * - `dark` 어두운 그라디언트
 *
 * 실제 면접 화면에서는 주소 뒤에 `?stage=dark` 를 붙여 본다. 프리뷰 화면(`/dev/interview-preview`)에는 전환 버튼이 있다.
 */
export type StageTheme = 'light' | 'dark'

export function readStageTheme(): StageTheme {
  try {
    return new URLSearchParams(window.location.search).get('stage') === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}
