import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import { ApiError } from '@/shared/api/apiError'
import { setAccessToken } from '@/shared/api/accessToken'
import { toUserMessage } from '@/shared/api/errorMessage'

import { loginWithKakao } from '../api/authApi'

type Status = 'loading' | 'error'

type UseKakaoCallbackResult = {
  status: Status
  /** status 가 'error' 일 때만 값이 있습니다 */
  message: string | null
}

/**
 * 카카오 콜백(`/auth/kakao/callback`)에서 code 를 백엔드로 넘기는 훅입니다. (AUTH-2)
 *
 * 여기서 갈리는 두 가지 실패는 출처가 다릅니다.
 *
 * - 카카오가 직접 돌려준 `error` — 사용자가 동의를 취소한 경우입니다.
 *   우리 백엔드를 부르지도 않으므로 렌더 중에 바로 판정합니다.
 * - `loginWithKakao` 가 던지는 `ApiError` — code 는 받았지만 백엔드가 카카오
 *   토큰 교환에 실패한 경우(`OAUTH_FAILED`)입니다. 비동기 호출이라 effect 로
 *   보내고, setState 는 그 응답 콜백 안에서만 합니다.
 *
 * **카카오 code 는 1회용이라 요청 자체를 한 번만 보내야 합니다.** StrictMode
 * 에서는 effect 가 두 번 돌아서, cleanup 의 `cancelled` 플래그만으로는 두 번째
 * 요청이 나가는 걸 막지 못합니다 — 첫 요청은 성공해도 같은 code 로 나간 두
 * 번째 요청이 반드시 실패해서 화면엔 실패만 보입니다. 목업은 항상 성공을
 * 돌려줘서 이 문제가 안 보였습니다 (PR #56 리뷰).
 *
 * 그래서 "이미 보냈는가"는 `useRef` 로 막습니다. 언마운트 후에도 무시할
 * 필요가 없습니다 — 이 화면은 code 하나를 처리하고 바로 나가는 자리라
 * 언마운트 뒤 setState 가 문제되지 않습니다 (React 18 부터 경고도 없습니다).
 */
export function useKakaoCallback(): UseKakaoCallbackResult {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [asyncResult, setAsyncResult] = useState<UseKakaoCallbackResult>({
    status: 'loading',
    message: null,
  })
  const exchanged = useRef(false)

  const code = searchParams.get('code')
  const kakaoError = searchParams.get('error')

  useEffect(() => {
    // 취소(error)·잘못된 접근(code 없음)은 아래에서 렌더 중에 바로 처리합니다.
    // 여기서는 요청을 보낼 필요가 있을 때만, 그것도 한 번만 돕니다.
    if (kakaoError || !code || exchanged.current) return
    exchanged.current = true

    loginWithKakao(code)
      .then((result) => {
        setAccessToken(result.accessToken)
        navigate(ROUTES.LANDING, { replace: true })
      })
      .catch((cause: unknown) => {
        const userMessage =
          cause instanceof ApiError ? toUserMessage(cause.code) : '잠시 후 다시 시도해 주세요.'
        setAsyncResult({ status: 'error', message: userMessage })
      })
  }, [code, kakaoError, navigate])

  // 카카오 동의 화면에서 취소하면 code 대신 error 가 붙어 돌아옵니다.
  if (kakaoError) {
    return { status: 'error', message: '카카오 로그인을 취소했어요.' }
  }

  if (!code) {
    return { status: 'error', message: '잘못된 접근이에요.' }
  }

  return asyncResult
}
