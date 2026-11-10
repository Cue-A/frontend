import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { changeEmail } from '../api/userApi'
import { CURRENT_PASSWORD_WRONG } from '../lib/credentials'

export type UseChangeEmailResult = {
  /** 바뀐 이메일, 실패하면 null(`error` 에 문구) */
  submit: (newEmail: string, currentPassword: string) => Promise<string | null>
  saving: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  /** 실패 문구를 지웁니다. 칸을 다시 고치기 시작하면 부릅니다 */
  clearError: () => void
}

/**
 * 이메일을 바꿉니다. `PATCH /api/users/me/email` (이슈 #201)
 *
 * 현재 비밀번호가 틀리면 서버는 401 `INVALID_CREDENTIALS` 를 줍니다. 강제 로그아웃 코드(`AUTH_FAILURE_CODES`)가 아니라
 * 로그인 화면으로 가지 않고, 여기서 "현재 비밀번호가 올바르지 않아요" 로 바꿔 보여줍니다.
 */
export function useChangeEmail(): UseChangeEmailResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (newEmail: string, currentPassword: string) => {
    setSaving(true)
    setError(null)

    try {
      return await changeEmail(newEmail, currentPassword)
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      // 이메일 · 비밀번호는 남기지 않습니다. 코드만 남깁니다.
      console.error('이메일 변경 실패 code=%s', code)
      setError(code === 'INVALID_CREDENTIALS' ? CURRENT_PASSWORD_WRONG : toUserMessage(code))
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { submit, saving, error, clearError }
}
