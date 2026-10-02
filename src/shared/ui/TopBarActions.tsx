import { IconBell, IconChevronDown, IconUser } from '@tabler/icons-react'
import { useId, useRef } from 'react'
import { Link } from 'react-router-dom'

import { usePopover } from '../hooks/usePopover'
import { initialOf } from '../lib/initialOf'

const POPOVER_CLASS = 'absolute right-0 top-full z-10 mt-2 rounded-lg bg-neutral-0 shadow-float'

/**
 * 알림 목록 API 가 없습니다(`NotificationSetting` 은 수신 설정뿐). 그래서 **빨간 점을 달지 않습니다** —
 * 새 알림이 없는데 있는 것처럼 보이면 사용자가 눌러보고 속았다고 느낍니다. (이슈 #59)
 */
function NotificationButton() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const popover = usePopover(rootRef)
  const panelId = useId()

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={popover.toggle}
        aria-expanded={popover.open}
        aria-controls={panelId}
        className="flex h-10 w-10 items-center justify-center rounded-sm bg-neutral-0 text-neutral-700 shadow-card transition-colors hover:text-neutral-900"
      >
        <IconBell size={20} stroke={2} aria-hidden />
        <span className="sr-only">알림</span>
      </button>

      {popover.open && (
        <section id={panelId} aria-label="알림" className={`${POPOVER_CLASS} w-72 p-5`}>
          <p className="text-body-lg text-neutral-900">알림</p>
          <p className="mt-3 text-body-md text-neutral-500">아직 알림이 없어요.</p>
        </section>
      )}
    </div>
  )
}

/**
 * 상단 프로필에 그릴 사용자입니다.
 *
 * `shared/` 는 `domain/` 을 모르므로 `useMe` 결과를 그대로 받지 않고 이 모양으로 옮겨 받습니다.
 * 쓰는 화면이 `useMe()` 를 불러 넘깁니다.
 */
export type TopBarProfile =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; nickname: string; email: string | null }

const MENU_ITEM_CLASS =
  'flex w-full items-center px-4 py-2 text-left text-body-md text-neutral-900 transition-colors hover:bg-neutral-50'

type ProfileMenuProps = {
  profile: TopBarProfile
  myPageTo?: string
  onLogout: () => void
}

/** 프로필 사진 필드가 없어서 닉네임 첫 글자로 원을 만듭니다. */
function ProfileMenu({ profile, myPageTo, onLogout }: ProfileMenuProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const popover = usePopover(rootRef)
  const menuId = useId()

  const nickname = profile.status === 'ready' ? profile.nickname : null

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={popover.toggle}
        aria-expanded={popover.open}
        aria-controls={menuId}
        className="flex h-10 items-center gap-2 rounded-full bg-neutral-0 py-1 pl-1 pr-3 shadow-card"
      >
        <span
          aria-hidden
          className={`flex h-8 w-8 items-center justify-center rounded-full text-body-md font-semibold ${
            profile.status === 'loading' ? 'animate-pulse bg-neutral-200' : 'bg-primary-200 text-primary-700'
          }`}
        >
          {nickname ? initialOf(nickname) : profile.status === 'error' ? <IconUser size={16} stroke={2} /> : null}
        </span>
        {/* 좁은 화면에서는 원만 둡니다. 닉네임은 메뉴를 열면 보입니다. */}
        <span className="hidden whitespace-nowrap text-body-md font-semibold text-neutral-900 sm:inline">
          {nickname ?? ''}
        </span>
        <span className="sr-only">{nickname ? `${nickname} 님 메뉴` : '내 메뉴'}</span>
        <IconChevronDown size={16} stroke={2} aria-hidden className="text-neutral-500" />
      </button>

      {popover.open && (
        <div id={menuId} className={`${POPOVER_CLASS} w-56 py-2`}>
          {profile.status === 'ready' && (
            <div className="border-b border-neutral-200 px-4 pb-3 pt-1">
              <p className="text-body-md font-semibold text-neutral-900">{profile.nickname}</p>
              {profile.email && <p className="text-micro text-neutral-500">{profile.email}</p>}
            </div>
          )}
          {profile.status === 'error' && (
            <p className="border-b border-neutral-200 px-4 pb-3 pt-1 text-body-sm text-neutral-500">
              사용자 정보를 불러오지 못했어요.
            </p>
          )}
          <ul className="pt-1">
            <li>
              {myPageTo ? (
                <Link to={myPageTo} onClick={popover.close} className={MENU_ITEM_CLASS}>
                  마이페이지
                </Link>
              ) : (
                <span aria-disabled className="flex items-center justify-between px-4 py-2 text-body-md text-neutral-400">
                  마이페이지
                  <span className="text-micro">준비 중</span>
                </span>
              )}
            </li>
            <li>
              <button type="button" onClick={onLogout} className={MENU_ITEM_CLASS}>
                로그아웃
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

type Props = {
  profile: TopBarProfile
  /**
   * 프로필 메뉴의 "마이페이지" 가 갈 곳. `shared/` 가 `app/routes` 를 모르게 쓰는 쪽이 넘깁니다.
   * 비우면 "준비 중" 으로 그립니다 — 마이페이지 화면이 아직 없습니다
   */
  myPageTo?: string
  /** 프로필 메뉴의 "로그아웃". 쓰는 쪽이 `useLogout()` 을 넘깁니다 */
  onLogout: () => void
}

/**
 * 화면 오른쪽 위의 알림 · 프로필 묶음입니다. (보관함 C-02 · 홈 A-04 시안)
 *
 * 보관함에만 있던 것을 홈 대시보드 시안에도 같은 자리에 나와서 shared/ui 로 올렸습니다
 * (docs/01-conventions.md — 같은 모양이 두 번째 화면에 생기면 올립니다). AppLayout 공통으로
 * 두지 않은 이유는 옵션 설정(A-05) 시안에는 이 묶음이 없기 때문입니다.
 *
 * 프로필 메뉴의 로그아웃은 이제 동작합니다(#69 의 `useLogout` 을 쓰는 쪽이 넘깁니다).
 */
export default function TopBarActions({ profile, myPageTo, onLogout }: Props) {
  return (
    <div className="flex items-center gap-3">
      <NotificationButton />
      <ProfileMenu profile={profile} myPageTo={myPageTo} onLogout={onLogout} />
    </div>
  )
}
