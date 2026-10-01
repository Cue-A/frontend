import {
  IconChartLine,
  IconChevronDown,
  IconFolder,
  IconHome,
  IconLogout,
  IconMicrophone,
  IconUser,
  IconUsers,
} from '@tabler/icons-react'
import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'

import Logo from '@/shared/ui/Logo'

import { LIBRARY_PREFIX, ROUTES } from '../routes'

type NavChild = {
  label: string
  /** 비어 있으면 아직 화면이 없는 "준비 중" 항목입니다 */
  to?: string
}

type NavItem = {
  label: string
  Icon: typeof IconHome
  /** 비어 있으면 아직 화면이 없는 "준비 중" 메뉴입니다 */
  to?: string
  /** 이 앞부분으로 시작하는 화면이면 이 메뉴를 켭니다. 없으면 `to` 와 똑같을 때만 켭니다 */
  matchPrefix?: string
  /**
   * 하위 항목. 있으면 이 줄은 화면 이동 링크가 아니라 **하위 항목을 여닫는 버튼**입니다.
   * 누르면 열리고 다시 누르면 닫힙니다. 화면 이동은 하위 항목으로 합니다
   */
  children?: NavChild[]
}

/**
 * 사이드바 메뉴입니다. 시안(A-05)의 6개를 그대로 두되, 아직 화면이 없는 곳은 `to` 를 비워둡니다.
 * 갈 곳 없는 링크를 눌러 404 로 떨어지는 것보다 준비 중이라고 보이는 편이 낫습니다.
 *
 * "내 보관함" 의 하위 항목은 전에 보관함 화면 안의 두 번째 패널(LibraryPanel)에 있던 것입니다. 패널을 없애고
 * 사이드바로 옮겼습니다 — 하위 항목 셋 중 둘이 준비 중이라 패널이 화면 폭만 차지했습니다.
 *
 * 아이콘은 Tabler outline 입니다 (docs/design-system.md §7).
 */
const NAV_ITEMS: NavItem[] = [
  { label: '홈', Icon: IconHome, to: ROUTES.HOME },
  { label: '면접 연습', Icon: IconMicrophone, to: ROUTES.SESSION_SETUP },
  {
    label: '내 보관함',
    Icon: IconFolder,
    // 하위 항목이 있어서 이 줄은 여닫기 버튼입니다. `to` 는 이동이 아니라 "켜진 메뉴" 판단에만 씁니다.
    to: ROUTES.LIBRARY_DOCUMENTS,
    matchPrefix: LIBRARY_PREFIX,
    children: [{ label: '자소서 · 포트폴리오', to: ROUTES.LIBRARY_DOCUMENTS }, { label: '연습 기록' }, { label: '질문 은행' }],
  },
  { label: '성장 관리', Icon: IconChartLine },
  // 마이페이지는 아직 화면이 없습니다. 생기면 내 보관함처럼 하위 항목(프로필 · 계정 설정 등)을 답니다.
  { label: '마이페이지', Icon: IconUser },
  { label: '커뮤니티', Icon: IconUsers },
]

function isActive(item: NavItem, pathname: string) {
  if (!item.to) return false
  if (item.matchPrefix) return pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`)
  return pathname === item.to
}

/** 시안의 아이콘은 24px · stroke 2 입니다. */
const ICON_SIZE = 24
const ICON_STROKE = 2

/**
 * 키보드 포커스 테두리는 줄 **안쪽**에 그립니다. 바깥에 그리면 사이드바의 `overflow-hidden` 에 양옆이 잘립니다.
 */
const FOCUS_RING = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500'

/**
 * 한 칸은 아이콘 + 글자입니다. 접혀 있을 때는 아이콘 자리(44px)만 보이고, 펼치면 글자가 나타납니다.
 * 접힌 레일 안쪽 폭(80 − 18 × 2 = 44px)에 아이콘(24px)이 가운데 오도록 좌우 10px 을 줍니다.
 */
const SLOT_CLASS = `flex h-11 w-full items-center gap-3 overflow-hidden whitespace-nowrap rounded-md px-2.5 transition-colors ${FOCUS_RING}`
const ACTIVE_CLASS = 'bg-primary-100 text-primary-600'
const INACTIVE_CLASS = 'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700'

/** 펼쳤을 때만 보이는 글자. 접혀 있어도 읽기 순서에는 남아서 스크린리더는 그대로 읽습니다 */
function labelClass(expanded: boolean) {
  return `whitespace-nowrap text-body-md font-semibold transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`
}

/** 본문으로 가려고 레일 위를 스쳐 지나갈 때 펼쳐지지 않게, 잠깐 머물렀을 때만 펼칩니다 */
const OPEN_DELAY_MS = 150

type Props = {
  onLogout: () => void
}

/**
 * 로그인 이후 화면의 왼쪽 메뉴입니다. 시안에는 상단 헤더바가 없고, 사이드바는 아이콘만 있는 좁은 레일입니다.
 *
 * **마우스를 올리면(또는 키보드로 안에 들어가면) 펼쳐져서 메뉴 이름이 보입니다.** (dd7c9bd)
 * - 펼친 레일은 본문 **위에 겹쳐** 뜹니다. 본문을 밀면 마우스가 지나갈 때마다 화면 전체가 출렁입니다.
 *   그래서 바깥 칸이 접힌 폭(80px)만 자리를 잡고, 레일은 그 안에서 넓어집니다
 * - 올리자마자 펼치지 않고 0.15초 기다립니다
 * - 키보드는 기다리지 않습니다. Tab 으로 들어오면 바로 이름이 보여야 합니다
 *
 * **하위 항목이 있는 메뉴(내 보관함)는 그 줄을 누르면 아래로 하위 항목이 열리고, 다시 누르면 닫힙니다.**
 * 전에는 마우스를 올리면 저절로 열리고 사이드바를 벗어나기 전까지 닫을 방법이 없었습니다. 열고 닫는 건 사용자가
 * 정하게 바꿨습니다. 연 상태는 사이드바가 접혔다 다시 펼쳐져도 그대로 둡니다 — 누른 사람이 닫을 때까지 엽니다.
 * (사람인 사이드바 참고)
 *
 * 하위 메뉴를 열고 닫으려면 상태가 필요해서 펼침도 CSS(`group-hover` · `focus-within`)가 아니라 상태로 다룹니다.
 * 덕분에 키보드 펼침을 `:focus-visible` 로만 걸 수 있습니다 — `focus-within` 은 마우스로 메뉴를 누른 뒤 남는
 * 포커스에도 걸려서, 누르고 마우스를 치워도 펼친 메뉴가 본문을 가린 채 남았습니다. Esc 로도 접힙니다.
 */
export default function SideNav({ onLogout }: Props) {
  const { pathname } = useLocation()
  const [mouseInside, setMouseInside] = useState(false)
  const [keyboardInside, setKeyboardInside] = useState(false)
  /** 눌러서 열어 둔 하위 메뉴들(메뉴 이름). 다시 누르면 빠집니다 */
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const openTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(openTimer.current), [])

  const expanded = mouseInside || keyboardInside

  const toggleGroup = (label: string) => {
    setOpenGroups((previous) =>
      previous.includes(label) ? previous.filter((group) => group !== label) : [...previous, label],
    )
  }

  const handleMouseEnter = () => {
    window.clearTimeout(openTimer.current)
    openTimer.current = window.setTimeout(() => setMouseInside(true), OPEN_DELAY_MS)
  }

  const collapse = () => {
    window.clearTimeout(openTimer.current)
    setMouseInside(false)
    setKeyboardInside(false)
  }

  const handleMouseLeave = () => {
    window.clearTimeout(openTimer.current)
    setMouseInside(false)
  }

  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    if (event.target.matches(':focus-visible')) setKeyboardInside(true)
  }

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setKeyboardInside(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') collapse()
  }

  return (
    // 접힌 폭만큼 자리를 잡는 칸. 펼친 레일은 이 칸을 넘어 본문 위에 겹칩니다
    <div className="hidden w-20 shrink-0 md:block">
      <aside
        aria-label="사이드바"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`sticky top-0 z-30 flex h-screen flex-col gap-8 overflow-hidden rounded-r-lg bg-neutral-0 px-4.5 py-6 transition-[width,box-shadow] duration-200 ease-out ${
          expanded ? 'w-56 shadow-float' : 'w-20'
        }`}
      >
        <div className="flex h-11 shrink-0 items-center gap-3 px-1.5">
          <Logo variant="mark" className="h-8 w-8 shrink-0 object-contain" />
          <span aria-hidden className={`${labelClass(expanded)} text-h2 text-primary-600`}>
            Cue&amp;A
          </span>
        </div>

        {/*
          하위 메뉴를 둘 다 열면 낮은 화면에서는 메뉴가 사이드바 높이를 넘어서 이 칸 안에서 스크롤됩니다.
          스크롤은 그대로 두고 **스크롤바만 숨깁니다.** 윈도우의 스크롤바는 폭(약 17px)을 차지해서 좁은 사이드바에
          회색 막대가 생기고, 그만큼 하위 항목의 "준비 중" 글자가 잘렸습니다. 마우스 휠 · 터치패드로는 계속 내려갑니다.
        */}
        <nav
          aria-label="주요 메뉴"
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <NavRow
                key={item.label}
                item={item}
                pathname={pathname}
                expanded={expanded}
                open={openGroups.includes(item.label)}
                onToggle={() => toggleGroup(item.label)}
              />
            ))}
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => {
            collapse()
            onLogout()
          }}
          className={`${SLOT_CLASS} shrink-0 ${INACTIVE_CLASS}`}
        >
          <IconLogout size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden className="shrink-0" />
          <span className={labelClass(expanded)}>로그아웃</span>
        </button>
      </aside>
    </div>
  )
}

type NavRowProps = {
  item: NavItem
  pathname: string
  expanded: boolean
  /** 하위 항목을 눌러서 열어 뒀는지 */
  open: boolean
  onToggle: () => void
}

function NavRow({ item, pathname, expanded, open, onToggle }: NavRowProps) {
  const { label, Icon, to, children } = item
  const childrenId = useId()
  const active = isActive(item, pathname)
  // 접힌 레일에는 하위 항목을 그리지 않습니다. 열어 둔 상태는 기억했다가 다시 펼치면 보여줍니다.
  const showChildren = expanded && open && children !== undefined

  if (!to) {
    return (
      <li>
        <span aria-disabled className={`${SLOT_CLASS} text-neutral-300`}>
          <Icon size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden className="shrink-0" />
          <span className={labelClass(expanded)}>{label}</span>
          <span className={`${labelClass(expanded)} ml-auto text-micro font-normal`}>준비 중</span>
        </span>
      </li>
    )
  }

  // 접힌 레일에서는 켜진 칸을 배경으로 보여주고, 하위 항목이 열렸을 때는 배경을 하위 항목에 넘깁니다.
  // 둘 다 칠하면 같은 보라 띠가 두 줄 겹쳐 무엇을 보고 있는지 오히려 흐려집니다.
  const tone = active ? (showChildren ? 'text-primary-600' : ACTIVE_CLASS) : INACTIVE_CLASS

  const content = (
    <>
      <Icon size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden className="shrink-0" />
      <span className={labelClass(expanded)}>{label}</span>
      {children && (
        <IconChevronDown
          size={16}
          stroke={2}
          aria-hidden
          className={`ml-auto shrink-0 transition-[transform,opacity] duration-200 ${expanded ? 'opacity-100' : 'opacity-0'} ${
            showChildren ? 'rotate-180' : ''
          }`}
        />
      )}
    </>
  )

  return (
    <li>
      {children ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={showChildren}
          aria-controls={showChildren ? childrenId : undefined}
          className={`${SLOT_CLASS} ${tone}`}
        >
          {content}
        </button>
      ) : (
        <Link to={to} aria-current={active ? 'page' : undefined} className={`${SLOT_CLASS} ${tone}`}>
          {content}
        </Link>
      )}

      {showChildren && (
        <ul id={childrenId} aria-label={`${label} 하위 메뉴`} className="mt-1 flex flex-col gap-1 pl-9">
          {children.map((child) => {
            // 계정 설정 > 회원 탈퇴(/mypage/account/withdraw)처럼 하위 항목 안쪽 화면에서도 그 항목을 켭니다.
            const childActive = child.to !== undefined && (pathname === child.to || pathname.startsWith(`${child.to}/`))
            return (
              <li key={child.label}>
                {child.to ? (
                  <Link
                    to={child.to}
                    aria-current={childActive ? 'page' : undefined}
                    className={`block whitespace-nowrap rounded-sm px-3 py-2 text-body-md transition-colors ${FOCUS_RING} ${
                      childActive
                        ? 'bg-primary-100 font-semibold text-primary-700'
                        : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    {child.label}
                  </Link>
                ) : (
                  <span
                    aria-disabled
                    className="flex items-center justify-between gap-2 whitespace-nowrap px-3 py-2 text-body-md text-neutral-400"
                  >
                    {child.label}
                    <span className="text-micro">준비 중</span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}
