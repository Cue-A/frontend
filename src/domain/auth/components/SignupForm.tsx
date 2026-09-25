import { type FormEvent, useState } from 'react'

import { storeTokens } from '@/shared/api/tokenStorage'
import Button from '@/shared/ui/Button'

import { signup } from '../api/authApi'
import { useAuthSubmit } from '../hooks/useAuthSubmit'
import { useLoginRedirect } from '../hooks/useLoginRedirect'

const FIELD_CLASS =
  'rounded-sm border border-neutral-300 px-4 py-3 text-body-md text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-500'

type Props = {
  onSwitchToLogin: () => void
}

/**
 * AUTH-1 회원가입. 비밀번호 확인은 서버에 보내지 않고 화면에서만 검증합니다.
 * 가입에 성공하면 바로 로그인된 것으로 보고, 보호 라우트에서 튕겨 왔으면 그
 * 경로로, 아니면 랜딩으로 보냅니다 (`useLoginRedirect`).
 */
export default function SignupForm({ onSwitchToLogin }: Props) {
  const redirectAfterLogin = useLoginRedirect()
  const { isSubmitting, error, submit } = useAuthSubmit()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [mismatch, setMismatch] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (password !== passwordConfirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)

    const result = await submit(() => signup({ email, password }))
    if (!result) return

    storeTokens(result.accessToken, result.refreshToken)
    redirectAfterLogin()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-neutral-700">이메일</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className={FIELD_CLASS}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-neutral-700">비밀번호</span>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="your password"
          className={FIELD_CLASS}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-neutral-700">비밀번호 확인</span>
        <input
          type="password"
          required
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          placeholder="your password"
          className={FIELD_CLASS}
        />
      </label>

      {mismatch && <p className="text-body-sm text-semantic-danger">비밀번호가 서로 달라요.</p>}
      {error && <p className="text-body-sm text-semantic-danger">{error}</p>}

      <Button type="submit" variant="primary" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? '가입 중…' : '회원가입'}
      </Button>

      <p className="text-center text-body-sm text-neutral-500">
        이미 계정이 있으신가요?{' '}
        {/* 문장 속 전환 버튼입니다. shared/ui/Button 은 네모난 CTA 모양이라 쓰지 않습니다. */}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-primary-500 hover:underline"
        >
          로그인
        </button>
      </p>
    </form>
  )
}
