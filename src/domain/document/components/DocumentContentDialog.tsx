import { IconX } from '@tabler/icons-react'
import { useEffect, useRef } from 'react'

import type { DocumentDetail } from '../types/document'

type Props = {
  /** 직접 작성한 문서. null 이면 닫힌 상태입니다. */
  document: DocumentDetail | null
  onClose: () => void
}

/**
 * 직접 작성한 문서의 본문을 읽기 전용으로 보여줍니다.
 *
 * 브라우저 기본 `<dialog>` 의 `showModal()` 을 씁니다. 포커스를 안에 가두고, Esc 로 닫히고,
 * 뒤 화면을 스크린리더에서 가리는 것까지 브라우저가 해줘서 직접 만들 필요가 없습니다.
 *
 * 본문은 마크다운이지만 렌더링하지 않고 글자 그대로 보여줍니다. 렌더러를 붙이면 HTML 을
 * 걸러내는 일까지 같이 떠안게 되는데, 읽기 전용 확인에는 원문으로 충분합니다.
 */
export default function DocumentContentDialog({ document, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (document && !dialog.open) dialog.showModal()
    if (!document && dialog.open) dialog.close()
  }, [document])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="document-content-title"
      className="m-auto w-full max-w-2xl rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      {document && (
        <div className="flex max-h-[80vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
            <div className="min-w-0">
              <p id="document-content-title" className="truncate text-h2 text-neutral-900">
                {document.title}
              </p>
              <p className="mt-1 text-body-sm text-neutral-500">직접 작성한 문서 · 읽기 전용</p>
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
          <p className="overflow-y-auto whitespace-pre-wrap px-6 py-5 text-body-md text-neutral-900">{document.content}</p>
        </div>
      )}
    </dialog>
  )
}
