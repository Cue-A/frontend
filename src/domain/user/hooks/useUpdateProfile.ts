import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { updateProfile } from '../api/userApi'
import type { Profile, ProfileUpdateInput } from '../types/user'

export type UseUpdateProfileResult = {
  /** 저장합니다. 끝났으면 고친 뒤의 프로필을, 실패했으면 null(`error` 에 문구) */
  submit: (input: ProfileUpdateInput) => Promise<Profile | null>
  saving: boolean
  error: string | null
}

/** 마이페이지 > 프로필 저장. `PATCH /api/users/me/profile` — 바꾼 칸만 보냅니다 (백엔드 시작 전, 목업 · Q16) */
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
