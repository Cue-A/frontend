import { IconX } from '@tabler/icons-react'
import { useEffect, useRef } from 'react'

import { ROUTES } from '@/app/routes'
import { useResumeChoices } from '@/domain/document/hooks/useResumeChoices'
import { toUserMessage } from '@/shared/api/errorMessage'
import Button from '@/shared/ui/Button'

import type { SelectedResume } from '../types/sessionSetup'

type Props = {
  /** 지금 골라둔 문서. 목록에서 표시해줍니다 */
  selectedId: string | null
  onSelect: (resume: SelectedResume) => void
  onClose: () => void
}

/**
 * 보관함의 자기소개서 · 포트폴리오 중 하나를 고릅니다. (A-05, 이슈 #54 1-1)
 *
 * 열릴 때마다 목록을 새로 받습니다 — 보관함에서 방금 올린 문서가 바로 보여야 합니다.
 * 면접에 쓸 수 없는 문서는 목록에 두되 이유를 적고 못 고르게 합니다.
 *
 * 브라우저 기본 `<dialog>` 를 씁니다. 포커스 가두기 · Esc 닫기를 브라우저가 해줍니다.
 */
export default function ResumePickerDialog({ selectedId, onSelect, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const resumes = useResumeChoices()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="resume-picker-title"
      className="m-auto w-full max-w-xl rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <div className="flex max-h-[80vh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
          <div>
            <p id="resume-picker-title" className="text-h2 text-neutral-900">
              자기소개서 불러오기
            </p>
            <p className="mt-1 break-keep text-body-sm text-neutral-500">보관함에 등록한 자기소개서 · 포트폴리오 중 하나를 골라주세요.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <IconX size={20} stroke={2} aria-hidden />
            <span className="sr-only">닫기</span>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {resumes.status === 'loading' && <p className="py-8 text-center text-body-md text-neutral-500">보관함을 불러오는 중이에요…</p>}

          {resumes.status === 'error' && (
            <div className="py-8 text-center">
              <p className="text-body-md text-neutral-900">보관함을 불러오지 못했어요.</p>
              <p className="mt-1 text-body-sm text-neutral-500">{toUserMessage(resumes.error.code)}</p>
              <Button size="sm" onClick={resumes.reload} className="mt-4">
                다시 시도
              </Button>
            </div>
          )}

          {resumes.status === 'ready' && resumes.choices.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-body-md text-neutral-900">보관함에 등록한 문서가 없어요.</p>
              <p className="mt-1 break-keep text-body-sm text-neutral-500">
                내 보관함에서 자기소개서나 포트폴리오를 먼저 등록해주세요. 보관함으로 가면 지금 고른 옵션은 저장되지 않아요.
              </p>
              <Button variant="primary" size="sm" to={ROUTES.LIBRARY_DOCUMENTS} className="mt-4">
                내 보관함으로 가기
              </Button>
            </div>
          )}

          {resumes.status === 'ready' && resumes.choices.length > 0 && (
            <ul className="flex flex-col gap-2">
              {resumes.choices.map(({ selection, formatLabel, meta, blockReason }) => {
                const selected = selection.documentId === selectedId

                return (
                  <li key={selection.documentId}>
                    <button
                      type="button"
                      disabled={blockReason !== null}
                      aria-pressed={selected}
                      onClick={() => onSelect(selection)}
                      className={`flex w-full items-center gap-3 rounded-sm border p-3 text-left transition-colors disabled:cursor-not-allowed ${
                        selected
                          ? 'border-primary-500 bg-primary-100'
                          : 'border-neutral-200 enabled:hover:border-primary-200 enabled:hover:bg-neutral-50'
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-micro font-bold ${
                          blockReason ? 'bg-neutral-50 text-neutral-400' : 'bg-primary-100 text-primary-600'
                        }`}
                      >
                        {formatLabel}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className={`truncate text-body-md font-semibold ${blockReason ? 'text-neutral-400' : 'text-neutral-900'}`}>
                          {selection.title}
                        </span>
                        <span className="truncate text-body-sm text-neutral-500">{meta}</span>
                        {/* 못 고르는 이유는 글로 적습니다 (docs/01-conventions.md "비활성 버튼의 이유는 글로") */}
                        {blockReason && <span className="break-keep text-body-sm text-badge-warning-text">{blockReason}</span>}
                      </span>
                      {selected && <span className="shrink-0 text-body-sm font-semibold text-primary-700">선택됨</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  )
}
