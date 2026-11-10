import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { changePassword } from '../api/userApi'
import { CURRENT_PASSWORD_WRONG } from '../lib/credentials'

/**
 * `changed` 바꿨음 · `failed` 실패(`error` 에 문구). 실패하면 원인인 칸(`field`)도 알려 줍니다 — 현재 비밀번호가 틀렸으면
 * `current`, 새 비밀번호 규칙 위반이면 `next`, 그 밖에는 `current` (이메일 변경 창과 같은 방식, PR #207 리뷰)
 */
export type ChangePasswordResult = { kind: 'changed' } | { kind: 'failed'; field: 'current' | 'next' }

export type UseChangePasswordResult = {
  submit: (currentPassword: string, newPassword: string) => Promise<ChangePasswordResult>
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

  const submit = useCallback(async (currentPassword: string, newPassword: string): Promise<ChangePasswordResult> => {
    setSaving(true)
    setError(null)

    try {
      await changePassword(currentPassword, newPassword)
      return { kind: 'changed' }
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      console.error('비밀번호 변경 실패 code=%s', code)
      setError(code === 'INVALID_CREDENTIALS' ? CURRENT_PASSWORD_WRONG : toUserMessage(code))
      // 새 비밀번호 규칙은 화면이 먼저 막지만, 서버가 다르게 보면 새 비밀번호 칸으로 돌려보냅니다
      return { kind: 'failed', field: code === 'INVALID_PASSWORD_FORMAT' ? 'next' : 'current' }
    } finally {
      setSaving(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { submit, saving, error, clearError }
}
