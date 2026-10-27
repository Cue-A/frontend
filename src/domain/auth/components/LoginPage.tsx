import AuthCard from './AuthCard'

/**
 * 로그인 · 회원가입 화면입니다. (A-02 시안)
 * 로그인 전 화면이라 사이드바 없이 카드 하나만 화면 위쪽 같은 자리에 띄웁니다.
 * 리포트 화면과 같은 이유로 AppLayout 밖에 있습니다 (router.tsx 참고).
 *
 * 세로로 가운데 정렬(`items-center`)하지 않습니다 — 로그인(600px)과 회원가입(643px)
 * 카드 높이가 달라서, 가운데 두면 탭을 바꿀 때마다 로고 · 탭까지 같이 위아래로
 * 움직입니다. 위에서 같은 거리에 고정해 두면 아래쪽만 늘었다 줄었다 합니다. (PR #110 리뷰)
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-primary-100 p-6 pt-24">
      <AuthCard />
    </div>
  )
}
