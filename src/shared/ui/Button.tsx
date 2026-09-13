import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

/**
 * 토큰이 dev 에 들어오면 여기만 채우면 됩니다.
 * 지금은 레이아웃만 있고 색 · 타이포는 비어 있습니다.
 *
 * 예정) primary: 'bg-primary-500 text-neutral-0 hover:bg-primary-600 …'
 */
const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'border',
  secondary: 'border',
  ghost: '',
}

/** 여백은 Tailwind 기본값을 씁니다 (docs/01-conventions.md "스타일" 절) */
const SIZE_CLASS: Record<Size, string> = {
  sm: 'px-4 py-2',
  md: 'px-4 py-3',
  lg: 'px-6 py-3',
}

const BASE_CLASS = 'inline-flex items-center justify-center gap-2 text-center'

type Props = {
  children: ReactNode
  variant?: Variant
  size?: Size
  /** 값이 있으면 링크로, 없으면 버튼으로 그립니다 */
  to?: string
  onClick?: () => void
  disabled?: boolean
  /** 왜 못 누르는지 알려줄 때 씁니다 */
  title?: string
  /** 레이아웃만 넣어주세요. 색 · 타이포는 variant 로 정합니다 */
  className?: string
}

/**
 * 공통 버튼입니다.
 *
 * 같은 모양이 화면마다 흩어져 있으면 토큰을 입힐 때 열두 곳을 고쳐야 하고,
 * 그러다 보면 화면마다 크기가 조금씩 달라집니다. 실제로 지금 코드에
 * px-6 py-3 · px-4 py-3 · px-4 py-2 세 가지가 섞여 있었습니다.
 *
 * 링크와 버튼을 한 컴포넌트로 둔 이유는, 보기엔 같은 버튼인데 어떤 건
 * 화면 이동이고 어떤 건 동작이기 때문입니다. 쓰는 쪽에서 to 만 주면 됩니다.
 */
export default function Button({
  children,
  variant = 'secondary',
  size = 'md',
  to,
  onClick,
  disabled = false,
  title,
  className = '',
}: Props) {
  const classes = [BASE_CLASS, VARIANT_CLASS[variant], SIZE_CLASS[size], className]
    .filter(Boolean)
    .join(' ')

  // 비활성 링크는 만들 수 없습니다. 못 누르는 상태면 버튼으로 그립니다.
  if (to && !disabled) {
    return (
      <Link to={to} className={classes} title={title}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={classes}>
      {children}
    </button>
  )
}
