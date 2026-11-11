import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { moveSessionsToFolder } from '../api/practiceApi'
import type { PracticeMoveResult } from '../types/practice'

/**
 * - `moved` 옮겼음. 같은 면접의 다른 회차까지 센 수가 같이 옵니다
 * - `session-gone` 옮기려던 세션이 목록에 없음 (`SESSION_NOT_FOUND` — 다른 탭에서 중단했거나 지운 경우)
 * - `folder-gone` 고른 폴더가 이미 없음 (`FOLDER_NOT_FOUND` — 다른 탭에서 지운 경우)
 * - `failed` 그 밖의 실패(`error` 에 문구)
 *
 * 앞의 둘은 화면이 들고 있는 목록이 낡았다는 뜻이라, 창에 오류를 띄우지 않고 닫은 뒤 목록 · 폴더를 새로 부릅니다.
 */
export type MoveToFolderResult =
  | { kind: 'moved'; result: PracticeMoveResult }
  | { kind: 'session-gone' }
  | { kind: 'folder-gone' }
  | { kind: 'failed' }

export type UseMoveToFolderResult = {
  /** `folderId` 가 null 이면 폴더에서 뺍니다 */
  move: (sessionId: string, folderId: string | null) => Promise<MoveToFolderResult>
  moving: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
}

/**
 * 연습 기록 세션을 폴더로 옮기거나 폴더에서 뺍니다. `PATCH /api/practice-records/folder` (이슈 #205)
 *
 * 서버는 면접 단위로 옮겨서, 한 회차를 옮기면 같은 면접의 1회차와 재면접이 다 같이 옮겨집니다 (practiceApi.ts).
 * 화면은 지금 한 행씩만 옮겨서 세션 하나를 받습니다. 여러 개를 고르게 되면 `sessionIds` 를 그대로 넘기면 됩니다.
 */
export function useMoveToFolder(): UseMoveToFolderResult {
  const [moving, setMoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const move = useCallback(async (sessionId: string, folderId: string | null): Promise<MoveToFolderResult> => {
    setMoving(true)
    setError(null)

    try {
      const result = await moveSessionsToFolder([sessionId], folderId)
      return { kind: 'moved', result }
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      if (code === 'SESSION_NOT_FOUND') return { kind: 'session-gone' }
      if (code === 'FOLDER_NOT_FOUND') return { kind: 'folder-gone' }

      console.error('폴더 이동 실패 code=%s', code)
      setError(toUserMessage(code))
      return { kind: 'failed' }
    } finally {
      setMoving(false)
    }
  }, [])

  return { move, moving, error }
}
