/**
 * 실시간 자막 배치 비교용 **임시** 스위치입니다. 결정이 나면 이 파일과 쓰는 곳(InterviewPage ·
 * InterviewSessionPage)의 분기를 지우고 한쪽만 남긴다.
 *
 * - `inline`(기본) 시안처럼 질문 카드 안 한 줄. 독의 CC 버튼이 켜고 끈다
 * - `panel` 기존처럼 내 카메라 아래 박스. 독의 CC 버튼이 켜고 끈다
 *
 * 주소 뒤에 `?caption=panel` 을 붙이면 기존 배치로 본다.
 */
export type CaptionLayout = 'inline' | 'panel'

export function readCaptionLayout(): CaptionLayout {
  try {
    return new URLSearchParams(window.location.search).get('caption') === 'panel' ? 'panel' : 'inline'
  } catch {
    return 'inline'
  }
}
