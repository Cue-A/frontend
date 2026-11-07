import { useEffect, useId, useRef } from 'react'

import Button from '@/shared/ui/Button'

import { useRemoveCommonQuestion } from '../hooks/useRemoveCommonQuestion'
import type { CommonQuestion } from '../types/question'

type Props = {
  question: CommonQuestion
  /** 지웠을 때 */
  onRemoved: (question: CommonQuestion) => void
  /** 이미 없는 질문이었을 때(다른 탭에서 지운 경우 등). 목록에서만 뺍니다 */
  onGone: (question: CommonQuestion) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/**
 * 내가 추가한 질문을 지우기 전에 한 번 묻습니다. 지우면 되돌릴 수 없고 메모 · 즐겨찾기도 함께 사라집니다.
 * 동작은 BookmarkRemoveDialog 와 같습니다(포커스는 "취소", 지우는 동안은 닫을 수 없고, 실패하면 창을 열어 둡니다).
 */
export default function CommonQuestionRemoveDialog({ question, onRemoved, onGone, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const { remove, removing, error } = useRemoveCommonQuestion()

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
    const result = await remove(question)
    if (result === 'failed') return

    if (result === 'removed') onRemoved(question)
    else onGone(question)
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
          내 질문을 삭제할까요?
        </p>
        <p className="break-keep text-body-md text-neutral-500">
          ‘<span className="font-semibold text-neutral-900">{question.text}</span>’
        </p>
        <p className="break-keep text-body-md text-neutral-500">삭제하면 되돌릴 수 없고 메모와 즐겨찾기도 함께 지워져요.</p>

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
          {removing ? '삭제하는 중…' : '삭제'}
        </Button>
      </div>
    </dialog>
  )
}
