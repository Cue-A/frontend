import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { createPracticeFolder, renamePracticeFolder } from '../api/practiceApi'
import type { PracticeFolder } from '../types/practice'

/**
 * `saved` 만들었거나 바꿨음(서버가 저장한 폴더) · `gone` 바꾸려던 폴더가 이미 없음 · `failed` 그 밖의 실패(`error` 에 문구).
 *
 * 다른 탭에서 지운 폴더의 이름을 바꾸면 `FOLDER_NOT_FOUND` 가 옵니다. 문서 제목 수정과 같게 실패가 아니라 `gone` 으로
 * 돌려주고, 화면은 폴더를 새로 부릅니다 (useRenameDocument).
 */
export type SaveFolderResult = { kind: 'saved'; folder: PracticeFolder } | { kind: 'gone' } | { kind: 'failed' }

export type UseSaveFolderResult = {
  save: (name: string) => Promise<SaveFolderResult>
  saving: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  /** 실패 문구를 지웁니다. 이름을 다시 고치기 시작하면 부릅니다 (useRenameDocument 와 같은 방식) */
  clearError: () => void
}

/**
 * 연습 기록 폴더를 만들거나(`POST /api/folders`) 이름을 바꿉니다(`PATCH /api/folders/{folderId}`, 이슈 #205).
 * `editing` 을 넘기면 그 폴더의 이름을 바꿉니다. 이름 규칙 · 오류는 둘이 같아서 한 훅으로 둡니다.
 */
export function useSaveFolder(editing?: PracticeFolder): UseSaveFolderResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editingId = editing?.folderId

  const save = useCallback(
    async (name: string): Promise<SaveFolderResult> => {
      setSaving(true)
      setError(null)

      try {
        const folder = editingId ? await renamePracticeFolder(editingId, name) : await createPracticeFolder(name)
        return { kind: 'saved', folder }
      } catch (cause) {
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        if (editingId && code === 'FOLDER_NOT_FOUND') return { kind: 'gone' }

        // 이름은 남기지 않습니다. 회사 이름이 들어갑니다. 길이와 코드만 남깁니다.
        console.error('폴더 %s 실패 length=%d code=%s', editingId ? '이름 바꾸기' : '만들기', name.length, code)
        setError(toUserMessage(code))
        return { kind: 'failed' }
      } finally {
        setSaving(false)
      }
    },
    [editingId],
  )

  const clearError = useCallback(() => setError(null), [])

  return { save, saving, error, clearError }
}
