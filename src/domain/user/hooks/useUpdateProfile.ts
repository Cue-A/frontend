import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { updateProfile } from '../api/userApi'
import type { Me, ProfileUpdateInput } from '../types/user'

export type UseUpdateProfileResult = {
  /** 저장합니다. 끝났으면 수정된 사용자를, 실패했으면 null(`error` 에 문구) */
  submit: (input: ProfileUpdateInput) => Promise<Me | null>
  saving: boolean
  error: string | null
}

/** B-03 마이페이지/프로필. `PATCH /users/me/profile` (백엔드 시작 전, 목업). */
export function useUpdateProfile(): UseUpdateProfileResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (input: ProfileUpdateInput) => {
    setSaving(true)
    setError(null)

    try {
      return await updateProfile(input)
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      console.error('프로필 수정 실패 code=%s', code)
      setError(toUserMessage(code))
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  return { submit, saving, error }
}
