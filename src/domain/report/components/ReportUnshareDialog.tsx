import { useEffect, useId, useRef, useState } from 'react'

import Button from '@/shared/ui/Button'

type Props = {
  /** 공유를 해제합니다. 실패하면 보여줄 문구를, 성공하면 null 을 돌려줍니다 (`useReportShare`) */
  onUnshare: () => Promise<string | null>
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/**
 * 공유를 해제하기 전에 한 번 묻습니다 (이슈 #199 — 확인 창을 띄우기로 정함).
 *
 * 공유 창(`ReportShareDialog`) 위에 뜹니다. 해제하면 이미 보낸 링크가 바로 막히고, 다시 만들어도 예전 링크는 살아나지
 * 않아서 일정 삭제 · 로그아웃과 같은 모양의 확인 창으로 묻습니다 (`EventDeleteDialog` · `LogoutConfirmDialog`).
 *
 * - 창을 열면 포커스가 "취소" 에 있습니다. Enter 한 번으로 해제되지 않게 합니다
 * - 해제하는 동안은 닫을 수 없습니다. 요청을 끊을 방법이 없어서, 닫혀도 서버에서는 해제됩니다
 * - 실패하면 창을 닫지 않고 이유를 보여줍니다. 다시 누를 수 있습니다
 */
export default function ReportUnshareDialog({ onUnshare, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // 해제하는 동안은 Esc 키 자체를 막습니다. onCancel 의 preventDefault 만으로는 부족합니다 —
  // Chrome 은 Esc 를 연달아 두 번 누르면 두 번째 cancel 을 막지 못하게 하고 창을 닫습니다(사용자 활성화 없이 반복되는
  // 닫기 막기를 무시하는 close watcher 규칙). 해제 요청 중(`removing`)에 Esc 를 두 번 빠르게 누르면 재현됩니다.
  // 일정 삭제 · 문서 올리기 창(EventDeleteDialog · DocumentUploadDialog)도 같은 이유로 둘 다 둡니다
  useEffect(() => {
    if (!removing) return

    const blockEscape = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') keyEvent.preventDefault()
    }
    window.addEventListener('keydown', blockEscape, true)
    return () => window.removeEventListener('keydown', blockEscape, true)
  }, [removing])

  const close = () => {
    if (!removing) dialogRef.current?.close()
  }

  const handleUnshare = async () => {
    setRemoving(true)
    setError(null)
    const failure = await onUnshare()
    setRemoving(false)
    if (failure) {
      setError(failure)
      return
    }
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(cancel) => {
        if (removing) cancel.preventDefault()
      }}
      aria-labelledby={headingId}
      className="m-auto w-full max-w-md rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40 print:hidden"
    >
      <div className="flex flex-col gap-3 px-6 py-5">
        <p id={headingId} className="text-h2 text-neutral-900">
          공유를 해제할까요?
        </p>
        <p className="break-keep text-body-md text-neutral-500">
          이미 보낸 링크는 바로 열리지 않아요. 다시 공유하면 새 링크가 만들어지고, 예전 링크는 계속 막혀 있어요.
        </p>

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
        <Button variant="primary" size="sm" onClick={() => void handleUnshare()} disabled={removing}>
          {removing ? '해제하는 중…' : '공유 해제'}
        </Button>
      </div>
    </dialog>
  )
}
