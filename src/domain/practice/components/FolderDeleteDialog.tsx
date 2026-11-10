import { useEffect, useId, useRef } from 'react'

import Button from '@/shared/ui/Button'

import { useDeleteFolder } from '../hooks/useDeleteFolder'
import type { PracticeFolder } from '../types/practice'

type Props = {
  folder: PracticeFolder
  /** 지웠을 때 */
  onDeleted: (folder: PracticeFolder) => void
  /** 이미 없는 폴더였을 때(다른 탭에서 지운 경우 등). 폴더를 새로 불러야 합니다 */
  onGone: (folder: PracticeFolder) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/**
 * 연습 기록 폴더를 지우기 전에 한 번 묻습니다. `DELETE /api/folders/{folderId}` (이슈 #205)
 *
 * 폴더만 지워지고 **안의 연습 기록은 그대로 남는다**는 것을 같이 적습니다 — 그걸 모르면 기록이 사라질까 봐 못 지웁니다.
 * 모양 · 동작은 문서 삭제 창(DocumentDeleteDialog)과 같습니다.
 *
 * - 창을 열면 포커스가 "취소" 에 있습니다. Enter 한 번으로 지워지지 않게 합니다
 * - 지우는 동안은 닫을 수 없습니다. 요청을 끊을 방법이 없어서, 닫혀도 서버에서는 지워집니다
 *   (Esc 를 연달아 누르는 경우까지 막는 이유는 ReportUnshareDialog 와 같습니다)
 * - 실패하면 창을 닫지 않고 이유를 보여줍니다. 다시 누를 수 있습니다
 */
export default function FolderDeleteDialog({ folder, onDeleted, onGone, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const { remove, deleting, error } = useDeleteFolder()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    if (!deleting) return

    const blockEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault()
    }
    window.addEventListener('keydown', blockEscape, true)
    return () => window.removeEventListener('keydown', blockEscape, true)
  }, [deleting])

  const close = () => {
    if (!deleting) dialogRef.current?.close()
  }

  const handleDelete = async () => {
    const result = await remove(folder.folderId)
    if (result === 'failed') return

    if (result === 'deleted') onDeleted(folder)
    else onGone(folder)
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (deleting) event.preventDefault()
      }}
      aria-labelledby={headingId}
      className="m-auto w-full max-w-md rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <div className="flex flex-col gap-3 px-6 py-5">
        <p id={headingId} className="text-h2 text-neutral-900">
          폴더를 지울까요?
        </p>
        <p className="break-keep text-body-md text-neutral-700">
          ‘<span className="font-semibold text-neutral-900">{folder.name}</span>’ 폴더를 지워요.
        </p>
        <p className="break-keep text-body-sm text-neutral-500">
          {folder.sessionCount > 0
            ? `안에 있던 연습 기록 ${folder.sessionCount}개는 지워지지 않고 폴더에서만 빠져요. ‘전체’ 에서 그대로 볼 수 있어요.`
            : '비어 있는 폴더예요.'}
        </p>

        {error && (
          <p role="alert" className="break-keep text-body-sm text-semantic-danger">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
        <Button size="sm" onClick={close} disabled={deleting}>
          취소
        </Button>
        <Button variant="primary" size="sm" onClick={() => void handleDelete()} disabled={deleting}>
          {deleting ? '지우는 중…' : '폴더 지우기'}
        </Button>
      </div>
    </dialog>
  )
}
