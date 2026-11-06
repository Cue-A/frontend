/**
 * 마이페이지 화면의 제목 — "마이페이지 · 프로필". (마이페이지 시안)
 *
 * 앞부분은 글자만 둡니다. 전에는 메뉴 목록 화면으로 가는 링크였는데, 하위 항목이 사이드바에도 있어서 메뉴 목록 화면을
 * 지웠습니다 (이슈 #185).
 */
export default function MyPageTitle({ current }: { current: string }) {
  return <>마이페이지 · {current}</>
}
