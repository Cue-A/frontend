import { useEffect, useId, useRef, useState } from 'react'

import Button from '@/shared/ui/Button'

import { useWithdraw } from '../hooks/useWithdraw'
import { WITHDRAW_DELETED_ITEMS } from '../lib/withdrawReasons'
import type { WithdrawRequest } from '../types/user'

type Props = {
  request: WithdrawRequest
  /** 탈퇴가 끝나고 창이 닫힌 뒤. 토큰은 이미 지워져 있습니다 — 첫 화면으로 보냅니다 */
  onWithdrawn: () => void
  /** 탈퇴하지 않고 창이 닫힌 뒤 */
  onClose: () => void
}

/**
 * 회원 탈퇴 최종 확인입니다. 이유를 고른 뒤 "탈퇴하기" 를 누르면 뜹니다. (WithdrawPage)
 *
 * - 무엇이 지워지는지와 되돌릴 수 없다는 것을 한 번 더 적습니다
 * - 창을 열면 포커스가 "취소" 에 있습니다. Enter 한 번으로 탈퇴되지 않게 합니다
 * - 탈퇴하는 동안은 닫을 수 없습니다. 요청을 끊을 방법이 없어서, 닫혀도 서버에서는 탈퇴됩니다
 *   (Esc 를 연달아 누르는 경우까지 막는 이유는 DocumentUploadDialog 와 같습니다)
 * - 실패하면 창을 닫지 않고 이유를 보여줍니다. 다시 누를 수 있습니다
 * - 끝나면 같은 창에서 "탈퇴가 끝났어요" 를 보여주고, 닫으면 첫 화면으로 갑니다. 말없이 첫 화면으로 보내면
 *   탈퇴가 된 건지 튕긴 건지 알 수 없습니다
 */
export default function WithdrawConfirmDialog({ request, onWithdrawn, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const { submit, withdrawing, error } = useWithdraw()
  const [done, setDone] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    if (!withdrawing) return

    const blockEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault()
    }
    window.addEventListener('keydown', blockEscape, true)
    return () => window.removeEventListener('keydown', blockEscape, true)
  }, [withdrawing])

  // 확인 단계의 버튼이 사라지면 포커스가 갈 곳을 잃습니다. 남은 버튼("첫 화면으로")으로 옮깁니다.
  useEffect(() => {
    if (done) dialogRef.current?.querySelector('button')?.focus()
  }, [done])

  const close = () => {
    if (!withdrawing) dialogRef.current?.close()
  }

  const handleWithdraw = async () => {
    if (await submit(request)) setDone(true)
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={done ? onWithdrawn : onClose}
      onCancel={(event) => {
        if (withdrawing) event.preventDefault()
      }}
      aria-labelledby={headingId}
      className="m-auto w-full max-w-md rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <div className="flex flex-col gap-2 px-6 py-5">
        <p id={headingId} className="text-h2 text-neutral-900">
          {done ? '탈퇴가 끝났어요' : '정말 탈퇴할까요?'}
        </p>
        {done ? (
          <p className="break-keep text-body-md text-neutral-700">그동안 Cue&amp;A 를 이용해 주셔서 감사해요.</p>
        ) : (
          <p className="break-keep text-body-md text-neutral-700">
            탈퇴하면 <span className="font-semibold text-neutral-900">{WITHDRAW_DELETED_ITEMS}</span>가 모두
            지워지고, 되돌릴 수 없어요.
          </p>
        )}

        {error && (
          <p role="alert" className="break-keep text-body-sm text-semantic-danger">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
        {done ? (
          <Button variant="primary" size="sm" onClick={close}>
            첫 화면으로
          </Button>
        ) : (
          <>
            <Button size="sm" onClick={close} disabled={withdrawing}>
              취소
            </Button>
            <Button variant="primary" size="sm" onClick={() => void handleWithdraw()} disabled={withdrawing}>
              {withdrawing ? '탈퇴하는 중…' : '탈퇴하기'}
            </Button>
          </>
        )}
      </div>
    </dialog>
  )
}
