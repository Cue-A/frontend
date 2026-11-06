import { useState } from 'react'
import { Link } from 'react-router-dom'

import { MYPAGE_ACCOUNT_ID, ROUTES } from '@/app/routes'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useAccount } from '../hooks/useAccount'
import type { UseMeResult } from '../hooks/useMe'
import type { LoginProvider } from '../types/user'

import LogoutConfirmDialog from './LogoutConfirmDialog'

const PROVIDER_LABEL: Record<LoginProvider, string> = {
  LOCAL: '이메일',
  KAKAO: '카카오',
}

/** '2026-09-01T10:00:00' → '2026.09.01' */
function toDateLabel(iso: string) {
  return iso.slice(0, 10).replace(/-/g, '.')
}

type Props = {
  /** 화면이 이미 부른 `useMe()` 결과. 계정 정보를 못 불러오면 여기의 로그인 방식으로 대신합니다 */
  me: UseMeResult
}

/**
 * 프로필 화면의 계정 칸 — 로그인 방식 · 가입일, 로그아웃, 계정 탈퇴하기. (기능명세서 P0)
 *
 * 전에는 마이페이지 > 계정 설정 화면이었는데, 프로필과 둘 다 짧은 화면이라 프로필 아래로 합쳤습니다 (이슈 #185).
 * 옛 주소(`/mypage/account`)와 홈의 톱니바퀴는 이 칸(`#account`)으로 바로 내려옵니다.
 *
 * - 이메일은 바로 위 프로필 칸에 있어서 여기서는 다시 적지 않습니다
 * - 로그인 방식 · 가입일은 계정 정보(`GET /api/users/me/account`)에서 읽습니다. 백엔드에 아직 없어 목업이 답하고(Q16),
 *   못 불러오면 화면 머리와 같은 사용자 정보(`GET /api/users/me`)의 로그인 방식만 보여줍니다
 * - 로그아웃은 한 번 묻고(LogoutConfirmDialog) 합니다. 탈퇴 바로 옆이라 잘못 누르기 쉽습니다
 * - "계정 탈퇴하기" 는 판 맨 아래 가운데 빨간 글자이고, 누르면 탈퇴 화면(`WithdrawPage` — 이유 고르기 · 최종 확인)으로 갑니다.
 *   아래에 알림 설정 칸이 이어져서, 판 밖에 두면 두 칸 사이에 떠 보여 판 안에 넣었습니다
 */
export default function AccountSection({ me }: Props) {
  const account = useAccount()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const info = account.status === 'ready' ? account.account : null

  return (
    <div id={MYPAGE_ACCOUNT_ID} className="scroll-mt-6">
      <Card padding="lg" label="계정" className="w-full">
        <h2 className="text-h2 text-neutral-900">계정</h2>

        {(info || me.status === 'ready') && (
          <dl className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <dt className="text-body-sm text-neutral-500">로그인 방식</dt>
              <dd className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {info
                  ? info.auths.map((auth) => (
                      <span key={auth.provider} className="flex items-center gap-2">
                        <Badge>{PROVIDER_LABEL[auth.provider] ?? auth.provider}</Badge>
                        <span className="text-body-sm text-neutral-500">{toDateLabel(auth.linkedAt)} 연결</span>
                      </span>
                    ))
                  : me.status === 'ready' &&
                    me.me.providers.map((provider) => (
                      <Badge key={provider}>{PROVIDER_LABEL[provider] ?? provider}</Badge>
                    ))}
              </dd>
            </div>
            {info && (
              <div className="flex flex-col gap-2">
                <dt className="text-body-sm text-neutral-500">가입일</dt>
                <dd className="text-body-md text-neutral-900">{toDateLabel(info.createdAt)}</dd>
              </div>
            )}
          </dl>
        )}
        {!info && me.status === 'error' && (
          <p role="alert" className="mt-5 text-body-md text-neutral-500">
            계정 정보를 불러오지 못했어요. 로그아웃과 탈퇴는 그대로 할 수 있어요.
          </p>
        )}

        <hr className="my-5 border-neutral-200" />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-body-md font-semibold text-neutral-900">로그아웃</p>
            <p className="text-body-sm text-neutral-500">이 브라우저에서만 로그아웃해요.</p>
          </div>
          <Button size="sm" onClick={() => setLogoutOpen(true)}>
            로그아웃
          </Button>
        </div>

        <hr className="my-5 border-neutral-200" />

        <div className="flex justify-center">
          <Link
            to={ROUTES.MYPAGE_WITHDRAW}
            className="text-body-sm text-semantic-danger underline-offset-2 hover:underline"
          >
            계정 탈퇴하기
          </Link>
        </div>
      </Card>

      {logoutOpen && <LogoutConfirmDialog onClose={() => setLogoutOpen(false)} />}
    </div>
  )
}
