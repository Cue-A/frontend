import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import { setAccessToken } from '@/shared/api/accessToken'

import { login } from '../api/authApi'
import { useAuthSubmit } from '../hooks/useAuthSubmit'

const FIELD_CLASS =
  'rounded-sm border border-neutral-300 px-4 py-3 text-body-md text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-500'

type Props = {
  onSwitchToSignup: () => void
}

/** AUTH-3 로그인. 성공하면 토큰을 저장하고 랜딩으로 돌아갑니다. */
export default function LoginForm({ onSwitchToSignup }: Props) {
  const navigate = useNavigate()
  const { isSubmitting, error, submit } = useAuthSubmit()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const result = await submit(() => login({ email, password }))
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

      {/* 비밀번호 재설정은 기능명세서(AUTH-1~6)에 아직 없는 기능입니다. 시안엔 있어서 자리만 잡아둡니다. */}
      <button
        type="button"
        className="self-end text-body-sm text-neutral-500 hover:text-neutral-700"
      >
        비밀번호 찾기
      </button>

      {error && <p className="text-body-sm text-semantic-danger">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-sm bg-primary-500 py-3 text-body-lg font-semibold text-neutral-0 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50"
      >
        {isSubmitting ? '로그인 중…' : '로그인'}
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-body-sm text-neutral-400">또는</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      {/* AUTH-1(회원가입) 규칙에 구글 로그인은 없지만 시안에 있어 자리만 잡아둡니다. */}
      <button
        type="button"
        className="rounded-sm border border-neutral-300 py-3 text-body-md text-neutral-700 hover:bg-neutral-50"
      >
        Google로 계속하기
      </button>
      {/* AUTH-2 카카오 로그인. 실제 OAuth 연동은 백엔드 계약 확정 후 별도 이슈로 진행합니다. */}
      <button
        type="button"
        className="rounded-sm border border-neutral-300 py-3 text-body-md text-neutral-700 hover:bg-neutral-50"
      >
        카카오로 계속하기
      </button>

      <p className="text-center text-body-sm text-neutral-500">
        계정이 없으신가요?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-semibold text-primary-500 hover:underline"
        >
          회원가입
        </button>
      </p>
    </form>
  )
}
