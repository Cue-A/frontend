import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import Button from '@/shared/ui/Button'

import { useSaveFolder } from '../hooks/useSaveFolder'
import { MAX_FOLDER_NAME_LENGTH } from '../lib/practiceDisplay'
import type { PracticeFolder } from '../types/practice'

type Props = {
  /** 이름을 바꿀 폴더. 없으면 새 폴더를 만듭니다 (이슈 #205) */
  editing?: PracticeFolder
  /** 지금 있는 폴더 이름들. 같은 이름을 막는 데 씁니다. 이름을 바꿀 때는 그 폴더의 지금 이름을 빼고 넘깁니다 */
  existingNames: string[]
  /** 만들었거나 바꿨을 때. 서버가 저장한 폴더가 옵니다 */
  onSaved: (folder: PracticeFolder) => void
  /** 이름을 바꾸려던 폴더가 이미 없을 때(다른 탭에서 지운 경우 등). 폴더를 새로 불러야 합니다 */
  onGone: () => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/**
 * 연습 기록 폴더를 만들거나 이름을 바꿉니다. 시안에 창이 없어서 문서 제목 수정 창(DocumentRenameDialog)과 같은 크기 ·
 * 같은 버튼 자리 · 같은 동작으로 그렸습니다 — Enter 로 저장, 한글 조합 중 Enter 무시, 저장하는 동안 닫기 · 입력 잠금,
 * 실패하면 창을 두고 이유를 보여주기.
 *
 * 같은 이름의 폴더는 만들지 않습니다. 카드 줄에 "삼성전자" 가 둘 있으면 어느 쪽에 무엇을 넣었는지 구분할 수 없습니다.
 * 대소문자 · 앞뒤 공백은 가리지 않고 같은 이름으로 봅니다.
 *
 * 이름 바꾸기는 만들기와 같은 창을 씁니다(이슈 #205). 지금 이름을 채워 열고, 바뀐 게 없으면 서버에 보내지 않고 닫습니다.
 */
export default function FolderNameDialog({ editing, existingNames, onSaved, onGone, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const headingId = useId()
  const hintId = useId()
  const [name, setName] = useState(editing?.name ?? '')
  const { save, saving, error, clearError } = useSaveFolder(editing)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    // 이름을 바꿀 때는 지금 이름을 통째로 골라 둡니다. 새 이름을 바로 칠 수 있습니다
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    if (!saving) return

    const blockEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault()
    }
    window.addEventListener('keydown', blockEscape, true)
    return () => window.removeEventListener('keydown', blockEscape, true)
  }, [saving])

  const close = () => {
    if (!saving) dialogRef.current?.close()
  }

  const trimmedName = name.trim()
  const duplicated = existingNames.some((existing) => existing.trim().toLowerCase() === trimmedName.toLowerCase())

  // 처음 연 빈 칸은 틀린 게 아니라서 빨간 글씨로 쓰지 않습니다.
  const blockReason = !trimmedName
    ? { text: editing ? '새 이름을 적어 주세요.' : '폴더 이름을 적으면 만들 수 있어요.', tone: 'text-neutral-500' }
    : duplicated
      ? { text: '같은 이름의 폴더가 이미 있어요.', tone: 'text-semantic-danger' }
      : null
  const canSubmit = blockReason === null && !saving

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    if (editing && trimmedName === editing.name) {
      dialogRef.current?.close()
      return
    }

    const result = await save(trimmedName)
    if (result.kind === 'failed') {
      inputRef.current?.focus()
      return
    }

    if (result.kind === 'saved') onSaved(result.folder)
    else onGone()
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
      className="m-auto w-full max-w-md rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <form onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex flex-col gap-4 px-6 py-5">
          <p id={headingId} className="text-h2 text-neutral-900">
            {editing ? '폴더 이름 바꾸기' : '새 폴더'}
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
              readOnly={saving}
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
          <Button size="sm" onClick={close} disabled={saving}>
            취소
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!canSubmit}>
            {saving ? (editing ? '바꾸는 중…' : '만드는 중…') : editing ? '바꾸기' : '만들기'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
