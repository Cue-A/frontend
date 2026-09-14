import { useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import type { AuthResult } from '../types/auth'

type UseAuthSubmitResult = {
  isSubmitting: boolean
  /** 사용자에게 보여줄 문구. 없으면 null */
  error: string | null
  /** 성공하면 결과를, 실패하면 null 을 돌려줍니다. 에러는 이미 error 상태에 담겨 있습니다. */
  submit: (run: () => Promise<AuthResult>) => Promise<AuthResult | null>
}

/**
 * 로그인 · 회원가입 제출의 로딩 · 에러 상태만 담당합니다.
 * 이메일 · 비밀번호 같은 입력값은 폼 상태라 각 폼 컴포넌트가 직접 들고 있습니다.
 */
export function useAuthSubmit(): UseAuthSubmitResult {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(run: () => Promise<AuthResult>) {
    setIsSubmitting(true)
    setError(null)

    try {
      return await run()
    } catch (cause) {
      const message = cause instanceof ApiError ? toUserMessage(cause.code) : '잠시 후 다시 시도해 주세요.'
      setError(message)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return { isSubmitting, error, submit }
}
