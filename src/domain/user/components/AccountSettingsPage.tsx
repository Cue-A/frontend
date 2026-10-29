import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import { initialOf } from '@/shared/lib/initialOf'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useMe } from '../hooks/useMe'
import type { LoginProvider } from '../types/user'

import LogoutConfirmDialog from './LogoutConfirmDialog'
import MyPageHeader from './MyPageHeader'

const PROVIDER_LABEL: Record<LoginProvider, string> = {
  LOCAL: '이메일',
  KAKAO: '카카오',
}

/** 고칠 수 없는 값이라 입력창 모양을 빌리되 바탕을 깔아 "읽기 전용" 으로 보이게 합니다 */
const READONLY_FIELD_CLASS = 'rounded-sm border border-neutral-200 bg-neutral-50 px-4 py-2 text-body-md'

/**
 * 마이페이지 > 계정 설정 — 로그아웃 · 회원 탈퇴. (기능명세서 P0)
 *
 * 로그아웃은 한 번 묻고(LogoutConfirmDialog) 합니다. 탈퇴 바로 옆이라 잘못 누르기 쉽습니다.
 *
 * 계정 설정 시안이 아직 없어서 **프로필 시안을 빌려 임시로** 그렸습니다. 같은 판(카드) 안에 머리(프로필 원 ·
 * 닉네임) → 구분선 → 항목 순서이고, "계정 탈퇴하기" 는 프로필 시안처럼 판 아래 가운데 빨간 글자입니다.
 * 누르면 탈퇴 화면(`WithdrawPage` — 이유 고르기 · 최종 확인)으로 갑니다.
 * 시안이 나오면 맞춰 고칩니다.
 *
 * 닉네임 · 이메일은 여기서 고치지 않습니다. 수정 API 가 없고, 고치는 자리는 프로필 화면(준비 중)입니다.
 */
export default function AccountSettingsPage() {
  const me = useMe()
  const [logoutOpen, setLogoutOpen] = useState(false)

  const title = (
    <>
      <Link to={ROUTES.MYPAGE} className="transition-colors hover:text-primary-600">
        마이페이지
      </Link>{' '}
      · 계정 설정
    </>
  )

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <MyPageHeader title={title} me={me} />

      <div className="flex max-w-4xl flex-col items-center gap-4">
        <Card padding="lg" label="계정 설정" className="w-full">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-h2 text-neutral-0 ${
                me.status === 'loading' ? 'animate-pulse bg-neutral-200' : 'bg-[image:var(--gradient-brand)]'
              }`}
            >
              {me.status === 'ready' ? initialOf(me.me.nickname) : null}
            </span>

            {me.status === 'ready' && (
              <div className="min-w-0">
                <p className="truncate text-body-lg text-neutral-900">{me.me.nickname}</p>
                <p className="text-body-sm text-neutral-500">내 계정</p>
              </div>
            )}
            {me.status === 'error' && (
              <p role="alert" className="text-body-md text-neutral-500">
                계정 정보를 불러오지 못했어요. 로그아웃과 탈퇴는 그대로 할 수 있어요.
              </p>
            )}
          </div>

          <hr className="my-5 border-neutral-200" />

          {me.status === 'ready' && (
            <>
              <dl className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <dt className="text-body-sm text-neutral-500">이메일</dt>
                  <dd className={`${READONLY_FIELD_CLASS} ${me.me.email ? 'text-neutral-900' : 'text-neutral-500'}`}>
                    {/* 카카오에서 이메일 제공에 동의하지 않으면 null 입니다 */}
                    {me.me.email ?? '카카오에서 이메일을 받지 않았어요'}
                  </dd>
                </div>
                <div className="flex flex-col gap-2">
                  <dt className="text-body-sm text-neutral-500">로그인 방식</dt>
                  <dd className="flex gap-2">
                    {me.me.providers.map((provider) => (
                      <Badge key={provider}>{PROVIDER_LABEL[provider] ?? provider}</Badge>
                    ))}
                  </dd>
                </div>
              </dl>

              <hr className="my-5 border-neutral-200" />
            </>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-body-md font-semibold text-neutral-900">로그아웃</p>
              <p className="text-body-sm text-neutral-500">이 브라우저에서만 로그아웃해요.</p>
            </div>
            <Button size="sm" onClick={() => setLogoutOpen(true)}>
              로그아웃
            </Button>
          </div>
        </Card>

        <Link
          to={ROUTES.MYPAGE_WITHDRAW}
          className="text-body-sm text-semantic-danger underline-offset-2 hover:underline"
        >
          계정 탈퇴하기
        </Link>
      </div>

      {logoutOpen && <LogoutConfirmDialog onClose={() => setLogoutOpen(false)} />}
    </div>
  )
}
