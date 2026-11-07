import { useEffect, useId, useRef, useState } from 'react'

import Button from '@/shared/ui/Button'
import Select from '@/shared/ui/Select'

import { useSaveCommonQuestion } from '../hooks/useSaveCommonQuestion'
import { MAX_QUESTION_LENGTH, QUESTION_CATEGORIES } from '../lib/questionDisplay'
import type { CommonQuestion } from '../types/question'

type Props = {
  /** 고칠 질문. 없으면 새로 추가합니다 */
  editing: CommonQuestion | null
  /** 저장된 질문(서버가 돌려준 값). 추가인지 수정인지는 부른 쪽이 `editing` 으로 압니다 */
  onSaved: (question: CommonQuestion) => void
  /** 고치려던 질문이 이미 없을 때(다른 탭에서 지운 경우 등). 목록에서만 뺍니다 */
  onGone: (question: CommonQuestion) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

const CATEGORY_OPTIONS = QUESTION_CATEGORIES.map((category) => ({ value: category, label: category }))

/**
 * 내 질문을 추가하거나 고치는 창입니다. (질문 은행 > 공통 질문 탭의 "질문 추가", 내 질문 카드의 "수정")
 *
 * - 질문 문구는 필수이고 공백만이면 저장할 수 없습니다. 최대 {MAX_QUESTION_LENGTH}자입니다
 * - 저장하는 동안은 닫을 수 없습니다. 요청을 끊을 방법이 없어서, 닫혀도 서버에는 저장됩니다
 * - 실패하면 창을 닫지 않고 입력을 그대로 둔 채 이유를 보여줍니다. 다시 누를 수 있습니다
 * - 고치려던 질문이 이미 지워졌으면 목록에서 빼고 창을 닫습니다 (삭제 창의 `gone` 과 같은 처리)
 * - 고칠 때 바뀐 게 없으면 서버에 보내지 않고 닫습니다
 */
export default function CommonQuestionFormDialog({ editing, onSaved, onGone, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const textId = useId()

  const [text, setText] = useState(editing?.text ?? '')
  const [category, setCategory] = useState<string>(editing?.category ?? QUESTION_CATEGORIES[0])
  const { save, saving, error, clearError } = useSaveCommonQuestion(editing)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    if (!saving) return

    const blockEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault()
    }
    window.addEventListener('keydown', blockEscape, true)
    return () => window.removeEventListener('keydown', blockEscape, true)
  }, [saving])

  const trimmed = text.trim()
  const canSave = trimmed !== '' && !saving

  const close = () => {
    if (!saving) dialogRef.current?.close()
  }

  const handleSave = async () => {
    if (!canSave) return

    if (editing && trimmed === editing.text && category === editing.category) {
      dialogRef.current?.close()
      return
    }

    const saved = await save({ text: trimmed, category })
    if (!saved) return

    if (saved === 'gone') {
      if (editing) onGone(editing)
      dialogRef.current?.close()
      return
    }

    onSaved(saved)
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (saving) event.preventDefault()
      }}
      aria-labelledby={headingId}
      className="m-auto w-full max-w-lg rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleSave()
        }}
      >
        <div className="flex flex-col gap-4 px-6 py-5">
          <p id={headingId} className="text-h2 text-neutral-900">
            {editing ? '내 질문 수정' : '질문 추가'}
          </p>

          <div className="flex flex-col gap-2">
            <label htmlFor={textId} className="text-body-sm font-semibold text-neutral-900">
              질문
            </label>
            <textarea
              id={textId}
              value={text}
              maxLength={MAX_QUESTION_LENGTH}
              rows={3}
              autoFocus
              disabled={saving}
              onChange={(event) => {
                setText(event.target.value)
                clearError()
              }}
              placeholder="연습하고 싶은 질문을 적어 주세요"
              className="block w-full resize-y rounded-sm border border-neutral-300 bg-neutral-0 px-4 py-3 text-body-md text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none disabled:opacity-50"
            />
            <p className="text-right text-body-sm text-neutral-500">
              {text.length} / {MAX_QUESTION_LENGTH}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-body-sm font-semibold text-neutral-900">분류</p>
            <Select
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={setCategory}
              placeholder="분류"
              ariaLabel="분류"
              disabled={saving}
              className="w-full"
            />
          </div>

          {error && (
            <p role="alert" className="break-keep text-body-sm text-semantic-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
          <Button size="sm" onClick={close} disabled={saving}>
            취소
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!canSave}>
            {saving ? '저장 중…' : editing ? '수정' : '추가'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
