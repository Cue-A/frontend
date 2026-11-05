import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { createBusinessCard, getBusinessCard, updateBusinessCard } from '../api/userApi'
import type { BusinessCard, BusinessCardInput } from '../types/user'

export type UseBusinessCardResult =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | {
      status: 'ready'
      card: BusinessCard | null
      saving: boolean
      saveError: string | null
      save: (input: BusinessCardInput) => Promise<boolean>
    }

/** B-03 마이페이지/디지털 명함. 없으면 생성(POST), 있으면 수정(PATCH)을 부릅니다. */
export function useBusinessCard(): UseBusinessCardResult {
  const [card, setCard] = useState<BusinessCard | null | 'loading' | 'error'>('loading')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getBusinessCard()
      .then((result) => {
        if (!cancelled) setCard(result)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        console.error('명함 조회 실패 code=%s', code)
        setCard('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const save = useCallback(
    async (input: BusinessCardInput) => {
      setSaving(true)
      setSaveError(null)

      try {
        const result = card && card !== 'loading' && card !== 'error' ? await updateBusinessCard(input) : await createBusinessCard(input)
        setCard(result)
        return true
      } catch (cause) {
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        console.error('명함 저장 실패 code=%s', code)
        setSaveError(toUserMessage(code))
        return false
      } finally {
        setSaving(false)
      }
    },
    [card],
  )

  if (card === 'loading') return { status: 'loading' }
  if (card === 'error') return { status: 'error', error: '명함을 불러오지 못했어요.' }
  return { status: 'ready', card, saving, saveError, save }
}
