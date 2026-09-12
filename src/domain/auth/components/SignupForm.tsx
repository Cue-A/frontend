import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import { setAccessToken } from '@/shared/api/accessToken'

import { signup } from '../api/authApi'
import { useAuthSubmit } from '../hooks/useAuthSubmit'

const FIELD_CLASS =
  'rounded-sm border border-neutral-300 px-4 py-3 text-body-md text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-500'

type Props = {
  onSwitchToLogin: () => void
}

/**
 * AUTH-1 회원가입. 비밀번호 확인은 서버에 보내지 않고 화면에서만 검증합니다.
 * 가입에 성공하면 바로 로그인된 것으로 보고 랜딩으로 보냅니다.
 */
export default function SignupForm({ onSwitchToLogin }: Props) {
  const navigate = useNavigate()
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

    setAccessToken(result.accessToken)
    navigate(ROUTES.LANDING)
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-sm bg-primary-500 py-3 text-body-lg font-semibold text-neutral-0 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50"
      >
        {isSubmitting ? '가입 중…' : '회원가입'}
      </button>

      <p className="text-center text-body-sm text-neutral-500">
        이미 계정이 있으신가요?{' '}
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
