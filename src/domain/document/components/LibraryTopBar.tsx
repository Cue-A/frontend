import { IconBell, IconChevronDown, IconUser } from '@tabler/icons-react'
import { useEffect, useId, useRef, useState, type RefObject } from 'react'

import { useMe } from '@/domain/user/hooks/useMe'

/**
 * 바깥을 누르거나 Esc 를 누르면 닫히는 작은 팝오버 상태입니다.
 * 알림 · 프로필 두 곳에서만 써서 이 파일 안에 둡니다. 세 번째 쓰임이 생기면 shared/hooks 로 올립니다.
 *
 * ref 는 쓰는 쪽이 만들어 넘깁니다. 훅이 ref 를 담은 객체를 돌려주면 React 컴파일러 규칙이
 * 그 객체의 다른 값(`open`)을 읽는 것까지 "렌더 중 ref 접근" 으로 봅니다.
 */
function usePopover(ref: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, ref])

  return { open, toggle: () => setOpen((value) => !value) }
}

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

/** 닉네임 첫 글자. 한글 · 영문 모두 한 글자로 자릅니다(서로게이트 쌍도 한 글자로 셉니다). */
function initialOf(nickname: string) {
  return Array.from(nickname.trim())[0]?.toUpperCase() ?? ''
}

/**
 * 프로필 사진 필드가 없어서 닉네임 첫 글자로 원을 만듭니다.
 *
 * 드롭다운의 마이페이지 · 로그아웃은 **"준비 중" 비활성**입니다. 마이페이지는 MVP 밖이고,
 * 로그아웃은 인증(#53) 쪽 흐름이 생기면 연결합니다 — 아이콘 레일의 로그아웃과 같은 상태입니다.
 */
function ProfileMenu() {
  const me = useMe()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const popover = usePopover(rootRef)
  const menuId = useId()

  const nickname = me.status === 'ready' ? me.me.nickname : null

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
            me.status === 'loading' ? 'animate-pulse bg-neutral-200' : 'bg-primary-200 text-primary-700'
          }`}
        >
          {nickname ? initialOf(nickname) : me.status === 'error' ? <IconUser size={16} stroke={2} /> : null}
        </span>
        {/* 좁은 화면에서는 원만 둡니다. 닉네임은 메뉴를 열면 보입니다. */}
        <span className="hidden whitespace-nowrap text-body-md font-semibold text-neutral-900 sm:inline">{nickname ?? ''}</span>
        <span className="sr-only">{nickname ? `${nickname} 님 메뉴` : '내 메뉴'}</span>
        <IconChevronDown size={16} stroke={2} aria-hidden className="text-neutral-500" />
      </button>

      {popover.open && (
        <div id={menuId} className={`${POPOVER_CLASS} w-56 py-2`}>
          {me.status === 'ready' && (
            <div className="border-b border-neutral-200 px-4 pb-3 pt-1">
              <p className="text-body-md font-semibold text-neutral-900">{me.me.nickname}</p>
              {me.me.email && <p className="text-micro text-neutral-500">{me.me.email}</p>}
            </div>
          )}
          {me.status === 'error' && (
            <p className="border-b border-neutral-200 px-4 pb-3 pt-1 text-body-sm text-neutral-500">
              사용자 정보를 불러오지 못했어요.
            </p>
          )}
          <ul className="pt-1">
            {['마이페이지', '로그아웃'].map((label) => (
              <li key={label}>
                <span aria-disabled className="flex items-center justify-between px-4 py-2 text-body-md text-neutral-400">
                  {label}
                  <span className="text-micro">준비 중</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** 보관함 화면에만 있는 상단 줄입니다. 다른 화면의 레이아웃은 바꾸지 않습니다. (이슈 #59) */
export default function LibraryTopBar() {
  return (
    <div className="flex items-center justify-between gap-4">
      <nav aria-label="현재 위치" className="min-w-0 overflow-hidden">
        <ol className="flex items-center gap-2 whitespace-nowrap text-body-sm">
          <li className="text-neutral-500">내 보관함</li>
          <li aria-hidden className="text-neutral-400">
            /
          </li>
          <li aria-current="page" className="font-semibold text-neutral-900">
            자소서 · 포트폴리오
          </li>
        </ol>
      </nav>

      <div className="flex items-center gap-3">
        <NotificationButton />
        <ProfileMenu />
      </div>
    </div>
  )
}
