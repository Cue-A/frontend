import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import { setAccessToken } from '@/shared/api/accessToken'
import Button from '@/shared/ui/Button'

import { login } from '../api/authApi'
import { useAuthSubmit } from '../hooks/useAuthSubmit'
import { buildKakaoAuthorizeUrl } from '../lib/kakaoAuth'

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

      {/*
        비밀번호 재설정은 기능명세서(AUTH-1~6)에 아직 없는 기능입니다. 시안엔 있어서
        자리만 잡아둡니다. 못 누르는 이유는 툴팁이 아니라 글로 적습니다 — 브라우저가
        비활성 요소에 마우스 이벤트를 안 보내서 툴팁이 아예 안 뜹니다. (이슈 #32)
      */}
      <p className="self-end text-body-sm text-neutral-400">비밀번호 찾기 (준비 중)</p>

      {error && <p className="text-body-sm text-semantic-danger">{error}</p>}

      <Button type="submit" variant="primary" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? '로그인 중…' : '로그인'}
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-body-sm text-neutral-400">또는</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      {/* Google 은 기능명세서에 없는 항목입니다 (Q12). */}
      <Button disabled className="w-full">
        Google로 계속하기
      </Button>

      {/*
        카카오 인가 페이지로 나가는 외부 링크라 shared/ui/Button 의 `to` 를 못
        씁니다. `to` 는 react-router Link 라 클라이언트 라우팅만 하고 카카오
        도메인으로는 못 나갑니다. 그래서 여기만 순수 <a> 를 씁니다. (이슈 #53)
      */}
      <a
        href={buildKakaoAuthorizeUrl()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-neutral-300 px-4 py-3 text-center text-body-md font-semibold text-neutral-900 transition-colors hover:bg-neutral-50"
      >
        카카오로 계속하기
      </a>

      <p className="text-center text-body-sm text-neutral-400">
        구글 로그인은 아직 연동 전이에요
      </p>

      <p className="text-center text-body-sm text-neutral-500">
        계정이 없으신가요?{' '}
        {/*
          글 안에 섞여 있는 전환 버튼이라 shared/ui/Button 을 쓰지 않습니다.
          Button 은 시안의 네모난 CTA 모양이고, 여기 필요한 건 문장 속 링크입니다.
        */}
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
