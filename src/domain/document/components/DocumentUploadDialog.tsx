import { IconFileUpload, IconX } from '@tabler/icons-react'
import { useEffect, useId, useRef, useState, type DragEvent } from 'react'

import { formatFileSize } from '@/shared/lib/formatFileSize'
import Button from '@/shared/ui/Button'
import Chip from '@/shared/ui/Chip'

import { useUploadDocument } from '../hooks/useUploadDocument'
import { DOCUMENT_TYPE_LABEL } from '../lib/documentDisplay'
import { ALLOWED_DOCUMENT_EXTENSIONS, DOCUMENT_FILE_ACCEPT, MAX_DOCUMENT_FILE_BYTES, validateDocumentFile } from '../lib/validateDocumentFile'
import type { DocumentSummary, DocumentType } from '../types/document'

/** 백엔드 `DocumentRegisterService.MAX_TITLE_LENGTH` 와 같습니다 */
const MAX_TITLE_LENGTH = 100

const DOCUMENT_TYPES: DocumentType[] = ['RESUME', 'PORTFOLIO']

type Props = {
  /** 처음 골라둘 문서 종류. 포트폴리오 탭에서 열었으면 포트폴리오입니다 */
  defaultType: DocumentType
  onUploaded: (document: DocumentSummary) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도(X · 취소 · Esc · 올리기 성공) 여기로 한 번 옵니다 */
  onClose: () => void
}

/** `자소서_최종.pdf` → `자소서_최종`. 보관함 목록에서 문서를 구분하는 이름이라 확장자는 뺍니다 */
function titleFromFileName(name: string) {
  return name.replace(/\.[^.]+$/, '').trim().slice(0, MAX_TITLE_LENGTH)
}

function extensionLabel(name: string) {
  const dot = name.lastIndexOf('.')
  return dot < 0 ? 'FILE' : name.slice(dot + 1).toUpperCase()
}

/**
 * 보관함에 문서를 올립니다. (C-02, 이슈 #54 1-4)
 *
 * **임시 시안입니다.** 업로드 화면 시안이 없어서 보관함 · A-05 의 다른 창과 같은 모양으로 만들었습니다.
 * 디자이너 시안이 오면 모양만 바꾸고 흐름(고르기 → 확인 → 올리기)은 그대로 둡니다.
 *
 * - 파일은 끌어다 놓거나 눌러서 고릅니다. 고르자마자 형식 · 크기를 확인해서, 올리기를 누른 뒤에야
 *   서버에서 거절당하지 않게 합니다 (DOC-5). 서버도 같은 규칙으로 다시 봅니다
 * - 제목은 필수입니다. 파일명에서 확장자를 뺀 값을 넣어두고 고칠 수 있게 둡니다 (#54 1-4)
 * - 문서 종류는 **나중에 못 바꿉니다**(수정 API 없음). 그래서 기본값에 맡기지 않고 눈에 보이게 고르게 합니다
 * - 올리는 동안은 창을 닫을 수 없습니다. 요청을 중간에 끊을 방법이 없어서, 닫혀도 서버에는 올라갑니다
 */
export default function DocumentUploadDialog({ defaultType, onUploaded, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const titleId = useId()
  const hintId = useId()

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState<DocumentType>(defaultType)
  const [dragging, setDragging] = useState(false)
  const { upload, uploading, error, clearError } = useUploadDocument()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const close = () => {
    if (!uploading) dialogRef.current?.close()
  }

  const pick = (picked: File | undefined) => {
    if (!picked) return
    clearError()

    const message = validateDocumentFile(picked)
    setFileError(message)
    if (message) {
      setFile(null)
      return
    }

    setFile(picked)
    setTitle(titleFromFileName(picked.name))
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    if (!uploading) pick(event.dataTransfer.files[0])
  }

  const trimmedTitle = title.trim()
  const titleError = file && !trimmedTitle ? '제목을 적어주세요.' : null
  const canSubmit = file !== null && trimmedTitle.length > 0 && trimmedTitle.length <= MAX_TITLE_LENGTH && !uploading

  const handleSubmit = async () => {
    if (!file || !canSubmit) return

    const uploaded = await upload({ file, title: trimmedTitle, documentType })
    if (uploaded) {
      onUploaded(uploaded)
      dialogRef.current?.close()
    }
  }

  const limitMb = Math.round(MAX_DOCUMENT_FILE_BYTES / (1024 * 1024))

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // 올리는 중에는 Esc 로도 닫히지 않게 막습니다.
      onCancel={(event) => {
        if (uploading) event.preventDefault()
      }}
      aria-labelledby={titleId}
      className="m-auto w-full max-w-lg rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
        <div>
          <p id={titleId} className="text-h2 text-neutral-900">
            문서 올리기
          </p>
          <p className="mt-1 break-keep text-body-sm text-neutral-500">자기소개서나 포트폴리오를 보관함에 등록해요.</p>
        </div>
        <button
          type="button"
          onClick={close}
          disabled={uploading}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconX size={20} stroke={2} aria-hidden />
          <span className="sr-only">닫기</span>
        </button>
      </div>

      <div className="flex flex-col gap-5 px-6 py-5">
        {/* 파일 고르기 — 누르거나 끌어다 놓습니다. 파일을 고른 뒤에도 다시 눌러 바꿀 수 있습니다. */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              if (!uploading) setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            disabled={uploading}
            aria-describedby={file ? undefined : hintId}
            className={`flex w-full items-center gap-3 rounded-sm border border-dashed p-4 text-left transition-colors disabled:cursor-not-allowed ${
              dragging ? 'border-primary-500 bg-primary-100' : 'border-neutral-300 hover:border-primary-200 hover:bg-neutral-50'
            }`}
          >
            {file ? (
              <>
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary-100 text-micro font-bold text-primary-600"
                >
                  {extensionLabel(file.name)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body-md font-semibold text-neutral-900">{file.name}</span>
                  <span className="text-body-sm text-neutral-500">{formatFileSize(file.size)}</span>
                </span>
                <span className="shrink-0 text-body-sm font-semibold text-primary-600">바꾸기</span>
              </>
            ) : (
              <>
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-neutral-50 text-neutral-500"
                >
                  <IconFileUpload size={20} stroke={2} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-body-md font-semibold text-neutral-900">파일을 끌어다 놓거나 눌러서 고르세요</span>
                  <span id={hintId} className="text-body-sm text-neutral-500">
                    {ALLOWED_DOCUMENT_EXTENSIONS.join(' · ')} · {limitMb}MB 이하
                  </span>
                </span>
              </>
            )}
          </button>

          {fileError && (
            <p role="alert" className="break-keep text-body-sm text-semantic-danger">
              {fileError}
            </p>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={DOCUMENT_FILE_ACCEPT}
            hidden
            onChange={(event) => {
              pick(event.target.files?.[0])
              // 같은 파일을 다시 골라도 change 가 뜨도록 비워둡니다.
              event.target.value = ''
            }}
          />
        </div>

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
            onChange={(event) => setTitle(event.target.value)}
            maxLength={MAX_TITLE_LENGTH}
            disabled={!file || uploading}
            placeholder="파일을 고르면 파일명이 들어가요"
            className="rounded-sm border border-neutral-200 bg-neutral-0 px-3 py-2 text-body-md text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none disabled:bg-neutral-50"
          />
          {titleError && <span className="text-body-sm text-semantic-danger">{titleError}</span>}
        </label>

        <fieldset className="flex flex-col gap-2" disabled={uploading}>
          <legend className="text-body-md font-semibold text-neutral-900">문서 종류</legend>
          <div className="flex gap-2">
            {DOCUMENT_TYPES.map((type) => (
              <label key={type} className="cursor-pointer">
                <input
                  type="radio"
                  name="document-type"
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
          <span className="break-keep text-body-sm text-neutral-500">올린 뒤에는 바꿀 수 없어요.</span>
        </fieldset>

        {error && (
          <p role="alert" className="break-keep text-body-sm text-semantic-danger">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
        <Button size="sm" onClick={close} disabled={uploading}>
          취소
        </Button>
        <Button variant="primary" size="sm" onClick={() => void handleSubmit()} disabled={!canSubmit}>
          {uploading ? '올리는 중…' : '올리기'}
        </Button>
      </div>
    </dialog>
  )
}
