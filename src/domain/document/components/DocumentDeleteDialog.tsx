import { useEffect, useId, useRef } from 'react'

import Button from '@/shared/ui/Button'

import { useDeleteDocument } from '../hooks/useDeleteDocument'
import type { DocumentSummary } from '../types/document'

type Props = {
  document: DocumentSummary
  /** 지웠을 때 */
  onDeleted: (document: DocumentSummary) => void
  /** 이미 없는 문서였을 때(다른 탭에서 지운 경우 등). 목록을 새로 불러야 합니다 */
  onGone: (message: string) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/**
 * 보관함 문서를 지우기 전에 한 번 묻습니다. (C-02, Cue-A/backend#40)
 *
 * 올린 파일까지 지워져서 되돌릴 수 없습니다. 대신 **이 문서로 본 지난 면접 기록과 리포트는 남는다**는 것도
 * 같이 적습니다 — 그걸 모르면 기록이 사라질까 봐 못 지웁니다.
 *
 * - 창을 열면 포커스가 "취소" 에 있습니다. 되돌릴 수 없는 동작이라 Enter 한 번으로 지워지지 않게 합니다
 * - 지우는 동안은 닫을 수 없습니다. 요청을 끊을 방법이 없어서, 닫혀도 서버에서는 지워집니다
 *   (Esc 를 연달아 누르는 경우까지 막는 이유는 DocumentUploadDialog 와 같습니다)
 * - 실패하면 창을 닫지 않고 이유를 보여줍니다. 다시 누를 수 있습니다
 */
export default function DocumentDeleteDialog({ document, onDeleted, onGone, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const { remove, deleting, error } = useDeleteDocument()

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
    const result = await remove(document.documentId)
    if (result === 'failed') return

    if (result === 'deleted') onDeleted(document)
    else onGone('이미 지워진 문서예요. 목록을 새로 불러왔어요.')
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
          문서를 지울까요?
        </p>
        <p className="break-keep text-body-md text-neutral-700">
          ‘<span className="font-semibold text-neutral-900">{document.title}</span>’ 문서를 보관함에서 지워요. 지운
          문서는 되돌릴 수 없어요.
        </p>
        <p className="break-keep text-body-sm text-neutral-500">이 문서로 본 지난 면접 기록과 리포트는 그대로 남아요.</p>

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
          {deleting ? '지우는 중…' : '지우기'}
        </Button>
      </div>
    </dialog>
  )
}
