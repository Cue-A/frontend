import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { MYPAGE_ACCOUNT_ID, ROUTES, toMyPageProfile } from '@/app/routes'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useMe } from '../hooks/useMe'
import { WITHDRAW_DELETED_ITEMS } from '../lib/withdrawal'

import MyPageHeader from './MyPageHeader'
import WithdrawConfirmDialog from './WithdrawConfirmDialog'

/** 탈퇴를 그만두면 돌아가는 곳 — 프로필의 계정 칸 */
const ACCOUNT_SECTION = toMyPageProfile(MYPAGE_ACCOUNT_ID)

/** 탈퇴 전에 알아야 할 것. 지워지는 것 · 되돌릴 수 없음 · 다른 기기 로그아웃 (Cue-A/backend#64) */
const NOTICES = [
  `${WITHDRAW_DELETED_ITEMS}가 모두 지워져요.`,
  '지운 기록은 되돌릴 수 없어요. 같은 이메일로 다시 가입해도 예전 기록은 돌아오지 않아요.',
  '로그인된 다른 기기에서도 모두 로그아웃돼요.',
]

/**
 * 회원 탈퇴 — 안내 → 최종 확인(창) → 완료. (마이페이지 > 프로필 > 계정 탈퇴하기)
 *
 * 시안이 없는 임시 흐름입니다. 무엇이 지워지는지 먼저 적고, "탈퇴하기" 를 누르면 확인 창(WithdrawConfirmDialog)에서
 * 한 번 더 묻습니다.
 *
 * 전에는 탈퇴 이유를 꼭 하나 고르게 했는데, 백엔드 탈퇴 API(`DELETE /api/users/me`)가 이유를 받지 않아서 이유 고르기를
 * 뺐습니다 (이슈 #201 — 이유를 받지 않기로 정함). 보내지도 않을 이유를 고르게 하면 사용자만 한 단계 더 거칩니다.
 */
export default function WithdrawPage() {
  const me = useMe()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  const nickname = me.status === 'ready' ? me.me.nickname : null

  // 계정 설정은 프로필에 합쳤습니다(이슈 #185). 돌아가는 곳은 프로필의 계정 칸입니다
  const title = (
    <>
      마이페이지 ·{' '}
      <Link to={ACCOUNT_SECTION} className="transition-colors hover:text-primary-600">
        프로필
      </Link>{' '}
      · 회원 탈퇴
    </>
  )

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <MyPageHeader title={title} me={me} />

      <Card padding="lg" label="회원 탈퇴" className="w-full max-w-4xl">
        <div className="flex flex-col gap-1">
          <h2 className="break-keep text-h2 text-neutral-900">
            {nickname ? `${nickname}님, ` : ''}그동안 Cue&amp;A 와 함께해 주셔서 고마워요
          </h2>
          <p className="break-keep text-body-md text-neutral-500">탈퇴하기 전에 아래 내용을 확인해 주세요.</p>
        </div>

        <hr className="my-4 border-neutral-200" />

        <ul className="flex list-disc flex-col gap-2 pl-5 text-body-md text-neutral-700">
          {NOTICES.map((notice) => (
            <li key={notice} className="break-keep">
              {notice}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button to={ACCOUNT_SECTION}>이전</Button>
          <Button variant="primary" onClick={() => setConfirming(true)}>
            탈퇴하기
          </Button>
        </div>
      </Card>

      {confirming && (
        <WithdrawConfirmDialog
          onWithdrawn={() => navigate(ROUTES.LANDING, { replace: true })}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
