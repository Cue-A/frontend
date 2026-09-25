import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { toUserMessage } from '@/shared/api/errorMessage'
import Card from '@/shared/ui/Card'

import LoginForm from './LoginForm'
import SignupForm from './SignupForm'

type Tab = 'login' | 'signup'

/**
 * 탭은 칩도 버튼도 아니고 "둘 중 하나만 켜져 있는 띠"입니다. shared/ui 에
 * 같은 모양이 아직 없어서 여기서 그립니다. 같은 모양이 다른 화면에도 생기면
 * 그때 shared/ui 로 올립니다.
 */
const TAB_BASE = 'flex-1 rounded-full py-2 text-body-md transition-colors'
const TAB_ON = 'bg-neutral-0 font-semibold text-neutral-900 shadow-card'
const TAB_OFF = 'text-neutral-500'

/**
 * 로그인 · 회원가입을 한 카드 안에서 탭으로 전환합니다. (A-02 시안 auth-card)
 * 어느 탭이 열려 있는지는 이 카드만의 화면 상태라 여기 useState 로 둡니다.
 */
export default function AuthCard() {
  const [tab, setTab] = useState<Tab>('login')
  const [searchParams] = useSearchParams()

  // 세션이 강제로 끊겨 로그인 화면으로 돌아온 경우입니다 (apiClient 의
  // forceLogout). 전체 새로고침이라 그때의 에러 상태를 못 들고 오니, 이유를
  // 쿼리로 실어 받아 다시 보여줍니다. (PR #60 리뷰)
  const reason = searchParams.get('reason')

  return (
    <Card padding="lg" className="w-full max-w-md">
      <p className="text-center text-h1 font-bold text-primary-600">Cue&amp;A</p>

      {reason && (
        <p className="mt-4 rounded-sm bg-badge-warning-bg p-3 text-center text-body-sm text-badge-warning-text">
          {toUserMessage(reason)}
        </p>
      )}

      <div className="mt-8 flex gap-1 rounded-full bg-neutral-50 p-1">
        <button
          type="button"
          onClick={() => setTab('login')}
          className={`${TAB_BASE} ${tab === 'login' ? TAB_ON : TAB_OFF}`}
        >
          로그인
        </button>

        <button
          type="button"
          onClick={() => setTab('signup')}
          className={`${TAB_BASE} ${tab === 'signup' ? TAB_ON : TAB_OFF}`}
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
    </Card>
  )
}
