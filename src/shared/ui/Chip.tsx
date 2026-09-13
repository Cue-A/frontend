import type { ReactNode } from 'react'

/** 시안에서 고른 칩은 연한 배경이 아니라 primary 를 꽉 채웁니다 (A-05 · C-01). */
const SELECTED_CLASS = 'border-primary-500 bg-primary-500 text-neutral-0 font-semibold'
const UNSELECTED_CLASS = 'border-neutral-200 bg-neutral-0 text-neutral-700 hover:bg-neutral-50'

/** 칩은 `radius-full` 입니다 (docs/design-system.md §4). */
const BASE_CLASS =
  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-body-md transition-colors'

type Props = {
  children: ReactNode
  selected?: boolean
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
 *     <Chip selected={…}>3회차 (최신)</Chip>
 *   </Link>
 */
export default function Chip({ children, selected = false }: Props) {
  const classes = [BASE_CLASS, selected ? SELECTED_CLASS : UNSELECTED_CLASS].join(' ')

  return <span className={classes}>{children}</span>
}
