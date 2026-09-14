import { useState } from 'react'

import LoginForm from './LoginForm'
import SignupForm from './SignupForm'

type Tab = 'login' | 'signup'

/**
 * 로그인 · 회원가입을 한 카드 안에서 탭으로 전환합니다. (A-02 시안 auth-card)
 * 어느 탭이 열려 있는지는 이 카드만의 화면 상태라 여기 useState 로 둡니다.
 */
export default function AuthCard() {
  const [tab, setTab] = useState<Tab>('login')

  return (
    <div className="w-full max-w-md rounded-lg bg-neutral-0 p-10 shadow-card">
      <p className="text-center text-h1 font-bold text-primary-600">Cue&amp;A</p>

      <div className="mt-8 flex gap-1 rounded-full bg-neutral-50 p-1">
        <button
          type="button"
          onClick={() => setTab('login')}
          className={
            tab === 'login'
              ? 'flex-1 rounded-full bg-neutral-0 py-2 text-body-md font-semibold text-neutral-900 shadow-card'
              : 'flex-1 rounded-full py-2 text-body-md text-neutral-500'
          }
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => setTab('signup')}
          className={
            tab === 'signup'
              ? 'flex-1 rounded-full bg-neutral-0 py-2 text-body-md font-semibold text-neutral-900 shadow-card'
              : 'flex-1 rounded-full py-2 text-body-md text-neutral-500'
          }
        >
          회원가입
        </button>
      </div>

      <div className="mt-6">
        {tab === 'login' ? (
          <LoginForm onSwitchToSignup={() => setTab('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setTab('login')} />
        )}
      </div>
    </div>
  )
}
