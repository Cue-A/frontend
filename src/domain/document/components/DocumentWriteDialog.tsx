import { IconX } from '@tabler/icons-react'
import { useEffect, useId, useRef, useState } from 'react'

import Button from '@/shared/ui/Button'
import Chip from '@/shared/ui/Chip'

import { useWriteDocument } from '../hooks/useWriteDocument'
import { DOCUMENT_TYPE_LABEL } from '../lib/documentDisplay'
import type { DocumentSummary, DocumentType } from '../types/document'

/** 백엔드 `DocumentRegisterService.MAX_TITLE_LENGTH` 와 같습니다 */
const MAX_TITLE_LENGTH = 100

/** 백엔드 `DocumentRegisterService.MAX_MARKDOWN_LENGTH` 와 같습니다. 글자 수(자바 `String.length`) 기준입니다 */
const MAX_CONTENT_LENGTH = 20_000

const DOCUMENT_TYPES: DocumentType[] = ['RESUME', 'PORTFOLIO']

type Props = {
  /** 처음 골라둘 문서 종류. 포트폴리오 탭에서 열었으면 포트폴리오입니다 */
  defaultType: DocumentType
  onSaved: (document: DocumentSummary) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도(X · 취소 · Esc · 저장 성공) 여기로 한 번 옵니다 */
  onClose: () => void
}

/**
 * 보관함에 문서를 직접 적어서 저장합니다. (C-02 "직접 작성")
 *
 * **임시 시안입니다.** 시안의 직접 작성은 문항 단위인데, 백엔드는 본문을 한 덩어리(최대 20,000자)로
 * 받습니다. 그래서 문항을 나누지 않고 제목 · 종류 · 본문 세 칸으로 만들었습니다. 업로드 창과 같은
 * 모양이고, 시안이 백엔드에 맞춰 오면 모양만 바꿉니다.
 *
 * - 본문은 자르지 않습니다. `maxLength` 를 걸면 붙여넣은 글이 **말없이 잘립니다.** 넘치면 몇 자 넘었는지
 *   보여주고 저장 버튼을 잠급니다
 * - 적던 내용이 있으면 Esc · X · 취소로 바로 닫지 않고 한 번 묻습니다. 저장 전이라 닫으면 사라집니다
 * - 저장하는 동안은 닫을 수 없습니다. 요청을 끊을 방법이 없어서, 닫혀도 서버에는 저장됩니다
 */
export default function DocumentWriteDialog({ defaultType, onSaved, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const footerRef = useRef<HTMLDivElement | null>(null)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const headingId = useId()
  const counterId = useId()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [documentType, setDocumentType] = useState<DocumentType>(defaultType)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const { save, saving, error, clearError } = useWriteDocument()

  const dirty = title.length > 0 || content.length > 0

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    // showModal 은 창의 첫 버튼(닫기)에 포커스를 둡니다. 바로 적을 수 있게 제목 칸으로 옮깁니다.
    titleInputRef.current?.focus()
  }, [])

  // Esc 로 닫히면 안 되는 동안(저장 중 · 적던 내용 있음)은 Esc 입력 자체를 먼저 막습니다. cancel 만 막으면
  // 크롬이 Esc 를 연달아 누를 때 두 번째부터 cancel 을 건너뛰고 창을 닫습니다. 저장 중에는 버튼이 잠겨
  // 포커스가 창 밖으로 빠질 수 있어 창이 아니라 window 에서 받습니다. (DocumentUploadDialog 와 같은 이유)
  useEffect(() => {
    if (!saving && !dirty) return

    const blockEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (!saving) setConfirmingClose(true)
    }
    window.addEventListener('keydown', blockEscape, true)
    return () => window.removeEventListener('keydown', blockEscape, true)
  }, [saving, dirty])

  // 묻는 줄이 뜨면 누르던 취소 버튼이 사라져 포커스가 창 밖으로 빠집니다. 안전한 쪽(계속 쓰기 — 묻는 줄의
  // 첫 버튼)으로 옮깁니다. 공용 Button 이 ref 를 받지 않아서 감싼 줄에서 찾습니다.
  useEffect(() => {
    if (confirmingClose) footerRef.current?.querySelector('button')?.focus()
  }, [confirmingClose])

  const forceClose = () => dialogRef.current?.close()

  const requestClose = () => {
    if (saving) return
    if (dirty) {
      setConfirmingClose(true)
      return
    }
    forceClose()
  }

  const trimmedTitle = title.trim()
  const overBy = content.length - MAX_CONTENT_LENGTH

  // 비활성 버튼의 이유는 글로 적습니다 (docs/01-conventions.md). 먼저 걸리는 하나만 보여줍니다.
  const blockReason = !trimmedTitle
    ? '제목을 적어주세요.'
    : !content.trim()
      ? '본문을 적어주세요.'
      : overBy > 0
        ? `본문이 ${MAX_CONTENT_LENGTH.toLocaleString()}자를 ${overBy.toLocaleString()}자 넘었어요.`
        : null
  const canSubmit = blockReason === null && !saving

  const handleSubmit = async () => {
    if (!canSubmit) return

    const saved = await save({ title: trimmedTitle, content, documentType })
    if (saved) {
      onSaved(saved)
      forceClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (saving || dirty) event.preventDefault()
      }}
      aria-labelledby={headingId}
      className="m-auto w-full max-w-2xl rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
        <div>
          <p id={headingId} className="text-h2 text-neutral-900">
            직접 작성하기
          </p>
          <p className="mt-1 break-keep text-body-sm text-neutral-500">
            자기소개서나 포트폴리오 내용을 적거나 붙여넣어 보관함에 저장해요.
          </p>
        </div>
        <button
          type="button"
          onClick={requestClose}
          disabled={saving}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconX size={20} stroke={2} aria-hidden />
          <span className="sr-only">닫기</span>
        </button>
      </div>

      <div className="flex flex-col gap-5 px-6 py-5">
        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between text-body-md font-semibold text-neutral-900">
            제목
            <span className="text-body-sm font-normal text-neutral-400">
              {trimmedTitle.length}/{MAX_TITLE_LENGTH}
            </span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(event) => {
              clearError()
              setTitle(event.target.value)
            }}
            maxLength={MAX_TITLE_LENGTH}
            ref={titleInputRef}
            disabled={saving}
            placeholder="예) 카카오 프론트엔드 자기소개서"
            className="rounded-sm border border-neutral-200 bg-neutral-0 px-3 py-2 text-body-md text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none disabled:bg-neutral-50"
          />
        </label>

        <fieldset className="flex flex-col gap-2" disabled={saving}>
          <legend className="text-body-md font-semibold text-neutral-900">문서 종류</legend>
          <div className="flex gap-2">
            {DOCUMENT_TYPES.map((type) => (
              <label key={type} className="cursor-pointer">
                <input
                  type="radio"
                  name="write-document-type"
                  value={type}
                  checked={documentType === type}
                  onChange={() => setDocumentType(type)}
                  className="peer sr-only"
                />
                <span className="inline-flex rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-500">
                  <Chip selected={documentType === type}>{DOCUMENT_TYPE_LABEL[type]}</Chip>
                </span>
              </label>
            ))}
          </div>
          <span className="break-keep text-body-sm text-neutral-500">저장한 뒤에는 바꿀 수 없어요.</span>
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between text-body-md font-semibold text-neutral-900">
            본문
            <span
              id={counterId}
              className={`text-body-sm font-normal tabular-nums ${overBy > 0 ? 'text-semantic-danger' : 'text-neutral-400'}`}
            >
              {content.length.toLocaleString()}/{MAX_CONTENT_LENGTH.toLocaleString()}
            </span>
          </span>
          <textarea
            value={content}
            onChange={(event) => {
              clearError()
              setContent(event.target.value)
            }}
            disabled={saving}
            rows={12}
            aria-describedby={counterId}
            placeholder="지원 동기, 경험, 강점처럼 면접 질문을 만들 내용을 적거나 붙여넣어 주세요."
            className="min-h-48 resize-y rounded-sm border border-neutral-200 bg-neutral-0 px-3 py-2 text-body-md text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none disabled:bg-neutral-50"
          />
        </label>

        {error && (
          <p role="alert" className="break-keep text-body-sm text-semantic-danger">
            {error}
          </p>
        )}
      </div>

      <div ref={footerRef} className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 px-6 py-4">
        {confirmingClose ? (
          <>
            <p role="alert" className="mr-auto break-keep text-body-sm text-neutral-700">
              적던 내용은 저장되지 않아요. 닫을까요?
            </p>
            <Button size="sm" onClick={() => setConfirmingClose(false)}>
              계속 쓰기
            </Button>
            <Button variant="primary" size="sm" onClick={forceClose}>
              닫기
            </Button>
          </>
        ) : (
          <>
            {blockReason && (
              <p className="mr-auto break-keep text-body-sm text-neutral-500">{blockReason}</p>
            )}
            <Button size="sm" onClick={requestClose} disabled={saving}>
              취소
            </Button>
            <Button variant="primary" size="sm" onClick={() => void handleSubmit()} disabled={!canSubmit}>
              {saving ? '저장하는 중…' : '저장하기'}
            </Button>
          </>
        )}
      </div>
    </dialog>
  )
}
