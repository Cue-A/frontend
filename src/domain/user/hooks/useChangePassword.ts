import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { changePassword } from '../api/userApi'
import { CURRENT_PASSWORD_WRONG } from '../lib/credentials'

export type UseChangePasswordResult = {
  /** 바꿨으면 true, 실패하면 false(`error` 에 문구) */
  submit: (currentPassword: string, newPassword: string) => Promise<boolean>
  saving: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  /** 실패 문구를 지웁니다. 칸을 다시 고치기 시작하면 부릅니다 */
  clearError: () => void
}

/**
 * 비밀번호를 바꿉니다. `PATCH /api/users/me/password` (이슈 #201)
 *
 * 현재 비밀번호가 틀린 401 `INVALID_CREDENTIALS` 는 이메일 변경과 같게 "현재 비밀번호가 올바르지 않아요" 로 보여줍니다.
 * 바꿔도 이 기기와 다른 기기의 로그인은 그대로입니다(서버가 토큰을 끊지 않습니다).
 */
export function useChangePassword(): UseChangePasswordResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (currentPassword: string, newPassword: string) => {
    setSaving(true)
    setError(null)

    try {
      await changePassword(currentPassword, newPassword)
      return true
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      console.error('비밀번호 변경 실패 code=%s', code)
      setError(code === 'INVALID_CREDENTIALS' ? CURRENT_PASSWORD_WRONG : toUserMessage(code))
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { submit, saving, error, clearError }
}
