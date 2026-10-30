import type { ReactNode } from 'react'

type Fill = 'soft' | 'solid'

/**
 * 고른 칩의 모양은 화면마다 다릅니다.
 *
 * - `soft`  옵션 설정(A-05)의 선택 칩 — 연한 배경 + 보라 테두리
 * - `solid` 리포트(C-01)의 회차 칩 — primary 를 꽉 채운 탭 모양
 *
 * 둘 다 시안에 있는 모양이라 하나로 합치지 않고 이름을 나눴습니다.
 */
const SELECTED_CLASS: Record<Fill, string> = {
  soft: 'border-primary-500 bg-primary-100 text-primary-700 font-semibold',
  solid: 'border-primary-500 bg-primary-500 text-neutral-0 font-semibold',
}

const UNSELECTED_CLASS = 'border-neutral-200 bg-neutral-0 text-neutral-700 hover:bg-neutral-50'

/** 칩은 `radius-full` 입니다 (docs/design-system.md §4). */
const BASE_CLASS = 'items-center gap-2 rounded-full border py-2 text-body-md transition-colors'

/**
 * 칩의 폭. 보통은 글자만큼(`inline-flex px-4`)이고, `fullWidth` 면 칸을 꽉 채우고 글자를 가운데 둡니다.
 * 같은 칸(grid)에 칩을 여러 개 늘어놓아 한 줄에 맞춰야 할 때 씁니다 — 이때는 좌우 여백을 칸 폭이 대신합니다.
 * 여백 클래스를 className 으로 덮어쓰지 않고 여기서 고르는 이유는 Card 와 같습니다 (Card.tsx 상단 주석).
 */
const WIDTH_CLASS = {
  auto: 'inline-flex px-4',
  full: 'flex w-full justify-center px-2',
}

type Props = {
  children: ReactNode
  selected?: boolean
  /** 고른 상태의 모양. 기본은 옵션 고르기에 쓰는 soft 입니다 */
  fill?: Fill
  /** 칸을 꽉 채울지. 기본은 글자만큼입니다 */
  fullWidth?: boolean
}

/**
 * 칩 하나의 **겉모습만** 담당합니다. 직접 누를 수 없습니다.
 *
 * 칩은 쓰이는 곳마다 하는 일이 다릅니다. 옵션 설정의 직무 칩은 "여럿 중
 * 하나 고르기"(라디오)이고, 리포트의 회차 칩은 화면 이동(링크)입니다.
 * 모양은 같은데 동작이 달라서, 동작은 쓰는 쪽에 맡기고 여기서는 모양만 맞춥니다.
 *
 *   <label>
 *     <input type="radio" … />
 *     <Chip selected={…}>프론트엔드 개발자</Chip>
 *   </label>
 *
 *   <Link to={…}>
 *     <Chip selected={…} fill="solid">3회차 (최신)</Chip>
 *   </Link>
 */
export default function Chip({ children, selected = false, fill = 'soft', fullWidth = false }: Props) {
  const width = WIDTH_CLASS[fullWidth ? 'full' : 'auto']
  const classes = [BASE_CLASS, width, selected ? SELECTED_CLASS[fill] : UNSELECTED_CLASS].join(' ')

  return <span className={classes}>{children}</span>
}
