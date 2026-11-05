import { useEffect, useId, useRef } from 'react'

import Button from '@/shared/ui/Button'

import { useRemoveBookmark } from '../hooks/useRemoveBookmark'
import type { BookmarkedQuestion } from '../types/question'

type Props = {
  bookmark: BookmarkedQuestion
  /** 뺐을 때 */
  onRemoved: (bookmark: BookmarkedQuestion) => void
  /** 이미 없는 질문이었을 때(다른 탭에서 뺀 경우 등). 목록에서만 뺍니다 */
  onGone: (bookmark: BookmarkedQuestion) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/**
 * 질문 은행에서 빼기 전에 한 번 묻습니다.
 *
 * 끝난 면접의 질문은 **뺀 뒤 다시 담을 수 없고** 메모도 함께 지워집니다. 그걸 모르고 누르면 되돌릴 방법이 없습니다.
 * 대신 **면접 기록과 리포트는 그대로 남는다**는 것도 같이 적습니다 (DocumentDeleteDialog 와 같은 모양).
 *
 * - 창을 열면 포커스가 "취소" 에 있습니다. 되돌릴 수 없는 동작이라 Enter 한 번으로 빠지지 않게 합니다
 * - 빼는 동안은 닫을 수 없습니다. 요청을 끊을 방법이 없어서, 닫혀도 서버에서는 빠집니다
 * - 실패하면 창을 닫지 않고 이유를 보여줍니다. 다시 누를 수 있습니다
 */
export default function BookmarkRemoveDialog({ bookmark, onRemoved, onGone, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const { remove, removing, error } = useRemoveBookmark()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    if (!removing) return

    const blockEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault()
    }
    window.addEventListener('keydown', blockEscape, true)
    return () => window.removeEventListener('keydown', blockEscape, true)
  }, [removing])

  const close = () => {
    if (!removing) dialogRef.current?.close()
  }

  const handleRemove = async () => {
    const result = await remove(bookmark)
    if (result === 'failed') return

    if (result === 'removed') onRemoved(bookmark)
    else onGone(bookmark)
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (removing) event.preventDefault()
      }}
      aria-labelledby={headingId}
      className="m-auto w-full max-w-md rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <div className="flex flex-col gap-3 px-6 py-5">
        <p id={headingId} className="text-h2 text-neutral-900">
          북마크를 해제하시겠습니까?
        </p>
        <p className="break-keep text-body-md text-neutral-500">
          ‘<span className="font-semibold text-neutral-900">{bookmark.text}</span>’
        </p>
        {/* 같은 경고의 두 줄이라 다른 칸보다 가깝게 붙입니다 */}
        <div className="flex flex-col gap-0.5">
          <p className="break-keep text-body-md text-neutral-500">
            북마크를 해제하면 다시 담을 수 없고 메모도 함께 지워져요.
          </p>
          <p className="break-keep text-body-md text-neutral-500">면접 기록과 리포트는 그대로 남아요.</p>
        </div>

        {error && (
          <p role="alert" className="break-keep text-body-sm text-semantic-danger">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
        <Button size="sm" onClick={close} disabled={removing}>
          취소
        </Button>
        <Button variant="primary" size="sm" onClick={() => void handleRemove()} disabled={removing}>
          {removing ? '해제하는 중…' : '북마크 해제'}
        </Button>
      </div>
    </dialog>
  )
}
