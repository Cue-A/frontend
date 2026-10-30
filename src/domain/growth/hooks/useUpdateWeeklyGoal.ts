import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { updateWeeklyGoal } from '../api/growthApi'
import type { WeeklyGoal } from '../types/growth'

export type UseUpdateWeeklyGoalResult = {
  /** 바뀐 목표, 실패하면 null(`error` 에 문구) */
  save: (target: number) => Promise<WeeklyGoal | null>
  saving: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  /** 실패 문구를 지웁니다. 횟수를 다시 고르면 부릅니다 */
  clearError: () => void
}

/** 이번 주 목표 횟수를 바꿉니다. (`PATCH /api/growth/weekly-goal` — 백엔드에 없어 목업이 답합니다) */
export function useUpdateWeeklyGoal(): UseUpdateWeeklyGoalResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(async (target: number) => {
    setSaving(true)
    setError(null)

    try {
      return await updateWeeklyGoal(target)
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      console.error('이번 주 목표 저장 실패 target=%d code=%s', target, code)
      setError(toUserMessage(code))
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { save, saving, error, clearError }
}
