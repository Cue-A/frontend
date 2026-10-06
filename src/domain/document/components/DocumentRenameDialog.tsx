import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import Button from '@/shared/ui/Button'

import { useRenameDocument } from '../hooks/useRenameDocument'
import { MAX_DOCUMENT_TITLE_LENGTH } from '../lib/documentDisplay'
import type { DocumentSummary } from '../types/document'

type Props = {
  document: DocumentSummary
  /** 바꿨을 때. 제목만 새 값으로 바뀐 문서가 옵니다 */
  onRenamed: (document: DocumentSummary) => void
  /** 이미 없는 문서였을 때(다른 탭에서 지운 경우 등). 목록을 새로 불러야 합니다 */
  onGone: (message: string) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/**
 * 보관함 문서의 제목을 바꿉니다. (C-02)
 *
 * 제목만 바꿉니다. 올린 파일의 원본 파일명 · 본문 · 종류는 그대로입니다. 시안이 없어서 지우기 확인 창
 * (DocumentDeleteDialog)과 같은 크기 · 같은 버튼 자리로 그렸습니다.
 *
 * - 창을 열면 제목 칸에 포커스가 가고 지금 제목이 전부 선택돼 있습니다. 바로 새 제목을 칠 수 있습니다
 * - Enter 로 저장합니다(폼 제출). 제목이 비었거나 그대로면 저장 버튼이 잠기고, 이유를 아래에 글로 적습니다
 *   (docs/01-conventions.md "비활성 버튼의 이유는 글로 적습니다")
 * - 저장하는 동안은 닫을 수 없습니다. Esc 를 연달아 누르는 경우까지 막는 이유는 DocumentUploadDialog 와 같습니다
 * - 실패하면 창을 닫지 않고 이유를 보여줍니다. 적던 제목이 남아 있어 다시 누를 수 있습니다
 */
export default function DocumentRenameDialog({ document, onRenamed, onGone, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const headingId = useId()
  const hintId = useId()
  const [title, setTitle] = useState(document.title)
  const { rename, renaming, error } = useRenameDocument()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    if (!renaming) return

    const blockEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault()
    }
    window.addEventListener('keydown', blockEscape, true)
    return () => window.removeEventListener('keydown', blockEscape, true)
  }, [renaming])

  const close = () => {
    if (!renaming) dialogRef.current?.close()
  }

  const trimmedTitle = title.trim()

  // 먼저 걸리는 하나만 보여줍니다. 그대로인 제목은 틀린 게 아니라서 빨간 글씨로 쓰지 않습니다.
  const blockReason = !trimmedTitle
    ? { text: '제목을 적어주세요.', tone: 'text-semantic-danger' }
    : trimmedTitle === document.title
      ? { text: '제목을 바꾸면 저장할 수 있어요.', tone: 'text-neutral-500' }
      : null
  const canSubmit = blockReason === null && !renaming

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    const result = await rename(document.documentId, trimmedTitle)
    if (result.kind === 'failed') return

    // 수정 응답은 제목만 돌려줍니다. 나머지는 열 때 받은 문서 그대로입니다 (화면은 이어서 목록을 다시 부릅니다).
    if (result.kind === 'renamed') onRenamed({ ...document, title: result.title })
    else onGone('이미 지워진 문서예요. 목록을 새로 불러왔어요.')
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (renaming) event.preventDefault()
      }}
      aria-labelledby={headingId}
      className="m-auto w-full max-w-md rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <form onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex flex-col gap-4 px-6 py-5">
          <p id={headingId} className="text-h2 text-neutral-900">
            제목 수정
          </p>

          <label className="flex flex-col gap-2">
            <span className="flex items-center justify-between text-body-md font-semibold text-neutral-900">
              제목
              <span className="text-body-sm font-normal text-neutral-400">
                {trimmedTitle.length}/{MAX_DOCUMENT_TITLE_LENGTH}
              </span>
            </span>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={MAX_DOCUMENT_TITLE_LENGTH}
              disabled={renaming}
              aria-describedby={hintId}
              className="rounded-sm border border-neutral-200 bg-neutral-0 px-3 py-2 text-body-md text-neutral-900 focus:border-primary-500 focus:outline-none disabled:bg-neutral-50"
            />
          </label>

          {/* 줄 수가 바뀌어도 창 높이가 흔들리지 않게 자리를 늘 잡아둡니다. */}
          <p id={hintId} className={`min-h-5 break-keep text-body-sm ${blockReason?.tone ?? 'text-neutral-500'}`}>
            {blockReason?.text ?? '제목만 바뀌어요. 올린 파일과 내용은 그대로예요.'}
          </p>

          {error && (
            <p role="alert" className="break-keep text-body-sm text-semantic-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
          <Button size="sm" onClick={close} disabled={renaming}>
            취소
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!canSubmit}>
            {renaming ? '저장 중…' : '저장'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
