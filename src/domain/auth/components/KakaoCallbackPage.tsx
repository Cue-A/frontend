import { ROUTES } from '@/app/routes'
import Button from '@/shared/ui/Button'

import { useKakaoCallback } from '../hooks/useKakaoCallback'

/**
 * 카카오 인가 콜백입니다. (AUTH-2) 시안에 없는, 화면 없는 라우트입니다 —
 * 정상 흐름이면 code 를 넘기고 바로 랜딩으로 이동해 사용자 눈에 거의
 * 보이지 않습니다. 실패했을 때만 잠깐 문구를 보여줍니다.
 */
export default function KakaoCallbackPage() {
  const { status, message } = useKakaoCallback()

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-primary-100 p-6">
        <p className="text-body-md text-neutral-700">{message}</p>
        <Button to={ROUTES.LOGIN} variant="primary">
          로그인으로 돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-100 p-6">
      <p className="text-body-md text-neutral-500">로그인 처리 중이에요…</p>
    </div>
  )
}
