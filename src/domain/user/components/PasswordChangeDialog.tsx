import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import Button from '@/shared/ui/Button'

import { useChangePassword } from '../hooks/useChangePassword'
import { isValidPassword, PASSWORD_RULE_TEXT } from '../lib/credentials'

/** 테두리 색은 칸마다 정합니다. 규칙을 어기면 빨간 테두리입니다 */
const FIELD_CLASS =
  'w-full rounded-sm border px-4 py-2.5 text-body-md text-neutral-900 outline-none placeholder:text-neutral-400 read-only:bg-neutral-50'

function fieldClass(invalid: boolean) {
  return `${FIELD_CLASS} ${invalid ? 'border-semantic-danger' : 'border-neutral-300 focus:border-primary-500'}`
}

const LABEL_CLASS = 'text-body-sm font-medium text-neutral-700'

type Props = {
  /** 바꿨을 때 */
  onChanged: () => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/**
 * 비밀번호 변경 창. `PATCH /api/users/me/password` (이슈 #201)
 *
 * 시안이 없어서 이메일 변경 창과 같은 모양으로 그렸습니다. 현재 비밀번호 · 새 비밀번호 · 새 비밀번호 확인을 받고, 확인 칸은
 * 서버에 보내지 않고 화면에서만 견줍니다(회원가입과 같음).
 *
 * - 새 비밀번호 규칙(영문 · 숫자 포함 8~64자)은 회원가입과 같은 안내를 칸 아래에 늘 적어 두고, 다 쓴 뒤 어기면 빨간 글씨로 바꿉니다
 * - 규칙을 어기거나 확인 칸이 다르면 바꾸기 버튼이 잠깁니다. 서버도 같은 규칙으로 다시 봅니다(`INVALID_PASSWORD_FORMAT`)
 * - 바꿔도 이 기기 · 다른 기기의 로그인은 그대로입니다. 서버가 토큰을 끊지 않아서 따로 안내하지 않습니다
 * - 저장하는 동안은 닫을 수 없고, 실패하면 창을 두고 이유를 보여주며 원인인 칸으로 포커스를 돌립니다
 */
export default function PasswordChangeDialog({ onChanged, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const currentRef = useRef<HTMLInputElement | null>(null)
  const nextRef = useRef<HTMLInputElement | null>(null)
  const headingId = useId()
  const currentId = useId()
  const nextId = useId()
  const nextHintId = useId()
  const confirmId = useId()
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { submit, saving, error, clearError } = useChangePassword()

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

  const ruleBroken = nextPassword !== '' && !isValidPassword(nextPassword)
  const mismatch = confirmPassword !== '' && confirmPassword !== nextPassword
  const canSubmit =
    currentPassword !== '' && isValidPassword(nextPassword) && confirmPassword === nextPassword && !saving

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    const result = await submit(currentPassword, nextPassword)
    if (result.kind === 'failed') {
      // 원인인 칸으로 돌아갑니다. 현재 비밀번호가 틀렸으면 현재 비밀번호 칸, 새 비밀번호 규칙 위반이면 새 비밀번호 칸
      const causeField = result.field === 'next' ? nextRef : currentRef
      causeField.current?.focus()
      return
    }

    onChanged()
    dialogRef.current?.close()
  }

  const changeField = (setter: (value: string) => void) => (value: string) => {
    clearError()
    setter(value)
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
            비밀번호 변경
          </p>

          <div className="flex flex-col gap-2">
            <label htmlFor={currentId} className={LABEL_CLASS}>
              현재 비밀번호
            </label>
            <input
              ref={currentRef}
              id={currentId}
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              value={currentPassword}
              readOnly={saving}
              onChange={(event) => changeField(setCurrentPassword)(event.target.value)}
              className={fieldClass(false)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={nextId} className={LABEL_CLASS}>
              새 비밀번호
            </label>
            <input
              ref={nextRef}
              id={nextId}
              type="password"
              required
              autoComplete="new-password"
              value={nextPassword}
              readOnly={saving}
              aria-invalid={ruleBroken || undefined}
              aria-describedby={nextHintId}
              onChange={(event) => changeField(setNextPassword)(event.target.value)}
              className={fieldClass(ruleBroken)}
            />
            <p id={nextHintId} className={`text-body-sm ${ruleBroken ? 'text-semantic-danger' : 'text-neutral-500'}`}>
              {PASSWORD_RULE_TEXT}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={confirmId} className={LABEL_CLASS}>
              새 비밀번호 확인
            </label>
            <input
              id={confirmId}
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              readOnly={saving}
              aria-invalid={mismatch || undefined}
              onChange={(event) => changeField(setConfirmPassword)(event.target.value)}
              className={fieldClass(mismatch)}
            />
            {mismatch && <p className="text-body-sm text-semantic-danger">새 비밀번호가 서로 달라요.</p>}
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
