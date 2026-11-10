import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import Button from '@/shared/ui/Button'

import { useChangeEmail } from '../hooks/useChangeEmail'

const FIELD_CLASS =
  'w-full rounded-sm border border-neutral-300 px-4 py-2.5 text-body-md text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-500 read-only:bg-neutral-50'

const LABEL_CLASS = 'text-body-sm font-medium text-neutral-700'

type Props = {
  /** 지금 이메일. 같은 값이면 바꾸기 버튼이 잠깁니다 */
  currentEmail: string | null
  /** 바뀐 이메일 */
  onChanged: (email: string) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/**
 * 이메일 변경 창. `PATCH /api/users/me/email` (이슈 #201)
 *
 * 시안이 없어서 다른 확인 창과 같은 크기 · 버튼 자리로 그렸습니다(이슈 #201 — 시안 없이 작업하기로 정함). 새 이메일과 본인 확인용
 * **현재 비밀번호**를 받습니다.
 *
 * - 형식은 브라우저(`type="email"`)가 먼저 보고, 서버가 다시 봅니다(400 `INVALID_REQUEST`)
 * - 지금 이메일과 같으면(대소문자 · 앞뒤 공백 무시) 바꾸기 버튼이 잠깁니다
 * - 저장하는 동안은 닫을 수 없고, 실패하면 창을 두고 이유를 보여줍니다. 비밀번호가 틀리면 비밀번호 칸, 그 밖(이미 쓰는
 *   이메일 · 형식 오류 등)은 이메일 칸으로 돌아갑니다
 */
export default function EmailChangeDialog({ currentEmail, onChanged, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)
  const headingId = useId()
  const emailId = useId()
  const passwordId = useId()
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const { submit, saving, error, clearError } = useChangeEmail()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // 저장하는 동안은 Esc 를 막습니다. onCancel 만으로는 Esc 를 연달아 누르면 닫힙니다 (ReportUnshareDialog 주석)
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

  const trimmedEmail = newEmail.trim()
  const sameAsNow = currentEmail !== null && trimmedEmail.toLowerCase() === currentEmail.toLowerCase()
  const canSubmit = trimmedEmail !== '' && currentPassword !== '' && !sameAsNow && !saving

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    const result = await submit(trimmedEmail, currentPassword)
    if (result.kind === 'failed') {
      // 원인인 칸으로 돌아갑니다. 비밀번호가 틀렸으면 비밀번호 칸, 이미 쓰는 이메일 · 형식 오류 등은 이메일 칸 (PR #207 리뷰)
      const causeField = result.field === 'password' ? passwordRef : emailRef
      causeField.current?.focus()
      return
    }

    onChanged(result.email)
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
          <div className="flex flex-col gap-1">
            <p id={headingId} className="text-h2 text-neutral-900">
              이메일 변경
            </p>
            {currentEmail && <p className="break-all text-body-sm text-neutral-500">지금 이메일 · {currentEmail}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={emailId} className={LABEL_CLASS}>
              새 이메일
            </label>
            <input
              ref={emailRef}
              id={emailId}
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={newEmail}
              readOnly={saving}
              onChange={(event) => {
                clearError()
                setNewEmail(event.target.value)
              }}
              placeholder="you@example.com"
              className={FIELD_CLASS}
            />
            {sameAsNow && <p className="text-body-sm text-neutral-500">지금 쓰는 이메일과 같아요.</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={passwordId} className={LABEL_CLASS}>
              현재 비밀번호
            </label>
            <input
              ref={passwordRef}
              id={passwordId}
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              readOnly={saving}
              onChange={(event) => {
                clearError()
                setCurrentPassword(event.target.value)
              }}
              className={FIELD_CLASS}
            />
            <p className="text-body-sm text-neutral-500">본인 확인을 위해 지금 비밀번호를 한 번 더 적어 주세요.</p>
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
          <Button variant="primary" size="sm" type="submit" disabled={!canSubmit}>
            {saving ? '바꾸는 중…' : '바꾸기'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
