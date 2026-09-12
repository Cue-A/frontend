import type { ReactNode } from 'react'

/**
 * 토큰이 들어오면 여기만 채우면 됩니다.
 * 예정) selected: 'bg-primary-100 border-primary-500 text-primary-700'
 */
const SELECTED_CLASS = 'border'
const UNSELECTED_CLASS = 'border'

const BASE_CLASS = 'inline-flex items-center gap-2 px-4 py-2'

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
