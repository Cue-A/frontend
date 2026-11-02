import { useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { getReplayOptions } from '../api/replayApi'
import { REPLAY_NOT_FOUND_MESSAGE, REPLAY_OPTIONS_MESSAGES } from '../lib/replayMessages'
import type { ReplayOptions } from '../types/replay'

export type ReplayOptionsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; options: ReplayOptions }

/** 응답이 도착한 결과. 어떤 세션의 결과인지 같이 들고 있습니다 */
type Settled = { sessionId: string } & ({ status: 'error'; message: string } | { status: 'ready'; options: ReplayOptions })

/**
 * 재연습 조건(최초 면접의 옵션)을 불러옵니다. (이슈 #152)
 *
 * 로딩 여부는 "이 세션의 결과가 아직 없다"로 계산합니다. effect 안에서 곧바로 setState 하면 렌더가 한 번 더 돌아서
 * eslint(react-hooks) 가 막습니다 (`useReport` 와 같은 방식).
 */
export function useReplayOptions(sessionId: string | undefined): ReplayOptionsState {
  const [settled, setSettled] = useState<Settled | null>(null)

  useEffect(() => {
    if (!sessionId) return

    let alive = true

    getReplayOptions(sessionId)
      .then((options) => {
        if (alive) setSettled({ sessionId, status: 'ready', options })
      })
      .catch((cause: unknown) => {
        if (!alive) return
        const message =
          cause instanceof ApiError ? toUserMessage(cause.code, REPLAY_OPTIONS_MESSAGES) : '잠시 후 다시 시도해 주세요.'
        setSettled({ sessionId, status: 'error', message })
      })

    return () => {
      alive = false
    }
  }, [sessionId])

  if (!sessionId) return { status: 'error', message: REPLAY_NOT_FOUND_MESSAGE }
  if (!settled || settled.sessionId !== sessionId) return { status: 'loading' }
  return settled.status === 'ready'
    ? { status: 'ready', options: settled.options }
    : { status: 'error', message: settled.message }
}
