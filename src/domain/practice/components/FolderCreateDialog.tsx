import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import Button from '@/shared/ui/Button'

import { useCreateFolder } from '../hooks/useCreateFolder'
import { MAX_FOLDER_NAME_LENGTH } from '../lib/practiceDisplay'
import type { PracticeFolder } from '../types/practice'

type Props = {
  /** 지금 있는 폴더 이름들. 같은 이름을 막는 데 씁니다 */
  existingNames: string[]
  onCreated: (folder: PracticeFolder) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/**
 * 연습 기록 폴더를 만듭니다. 시안에 창이 없어서 문서 제목 수정 창(DocumentRenameDialog)과 같은 크기 · 같은 버튼
 * 자리 · 같은 동작으로 그렸습니다 — Enter 로 만들기, 한글 조합 중 Enter 무시, 만드는 동안 닫기 · 입력 잠금, 실패하면
 * 창을 두고 이유를 보여주기.
 *
 * 같은 이름의 폴더는 만들지 않습니다. 카드 줄에 "삼성전자" 가 둘 있으면 어느 쪽에 무엇을 넣었는지 구분할 수 없습니다.
 * 대소문자 · 앞뒤 공백은 가리지 않고 같은 이름으로 봅니다.
 */
export default function FolderCreateDialog({ existingNames, onCreated, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const headingId = useId()
  const hintId = useId()
  const [name, setName] = useState('')
  const { create, creating, error, clearError } = useCreateFolder()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!creating) return

    const blockEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault()
    }
    window.addEventListener('keydown', blockEscape, true)
    return () => window.removeEventListener('keydown', blockEscape, true)
  }, [creating])

  const close = () => {
    if (!creating) dialogRef.current?.close()
  }

  const trimmedName = name.trim()
  const duplicated = existingNames.some((existing) => existing.trim().toLowerCase() === trimmedName.toLowerCase())

  // 처음 연 빈 칸은 틀린 게 아니라서 빨간 글씨로 쓰지 않습니다.
  const blockReason = !trimmedName
    ? { text: '폴더 이름을 적으면 만들 수 있어요.', tone: 'text-neutral-500' }
    : duplicated
      ? { text: '같은 이름의 폴더가 이미 있어요.', tone: 'text-semantic-danger' }
      : null
  const canSubmit = blockReason === null && !creating

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    const folder = await create(trimmedName)
    if (!folder) {
      inputRef.current?.focus()
      return
    }

    onCreated(folder)
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (creating) event.preventDefault()
      }}
      aria-labelledby={headingId}
      className="m-auto w-full max-w-md rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <form onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex flex-col gap-4 px-6 py-5">
          <p id={headingId} className="text-h2 text-neutral-900">
            새 폴더
          </p>

          <label className="flex flex-col gap-2">
            <span className="flex items-center justify-between text-body-md font-semibold text-neutral-900">
              폴더 이름
              <span className="text-body-sm font-normal text-neutral-400">
                {trimmedName.length}/{MAX_FOLDER_NAME_LENGTH}
              </span>
            </span>
            <input
              ref={inputRef}
              type="text"
              value={name}
              placeholder="예) 네이버 하반기"
              onChange={(event) => {
                clearError()
                setName(event.target.value)
              }}
              onKeyDown={(event) => {
                // 조합 표시를 단 채로 온 Enter 는 폼 제출로 넘기지 않습니다 (DocumentRenameDialog 주석 참고).
                if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)) {
                  event.preventDefault()
                }
              }}
              maxLength={MAX_FOLDER_NAME_LENGTH}
              readOnly={creating}
              aria-describedby={hintId}
              aria-invalid={duplicated || undefined}
              className="rounded-sm border border-neutral-200 bg-neutral-0 px-3 py-2 text-body-md text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none read-only:bg-neutral-50"
            />
          </label>

          {/* 줄 수가 바뀌어도 창 높이가 흔들리지 않게 자리를 늘 잡아둡니다. */}
          <p id={hintId} className={`min-h-5 break-keep text-body-sm ${blockReason?.tone ?? 'text-neutral-500'}`}>
            {blockReason?.text ?? '기업이나 지원 시기별로 연습 기록을 묶어둘 수 있어요.'}
          </p>

          {error && (
            <p role="alert" className="break-keep text-body-sm text-semantic-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
          <Button size="sm" onClick={close} disabled={creating}>
            취소
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!canSubmit}>
            {creating ? '만드는 중…' : '만들기'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
