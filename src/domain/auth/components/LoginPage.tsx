import AuthCard from './AuthCard'

/**
 * 로그인 · 회원가입 화면입니다. (A-02 시안)
 * 로그인 전 화면이라 사이드바 없이 카드 하나만 화면 중앙에 띄웁니다.
 * 리포트 화면과 같은 이유로 AppLayout 밖에 있습니다 (router.tsx 참고).
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-100 p-6">
      <AuthCard />
    </div>
  )
}
