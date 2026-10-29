import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

/**
 * 버튼 색은 여기서만 정합니다. 모양을 바꿀 일이 생기면 이 객체만 고치면
 * 모든 화면에 반영됩니다.
 */
const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-primary-500 text-neutral-0 hover:bg-primary-600 active:bg-primary-700',
  secondary: 'border border-neutral-300 text-neutral-900 hover:bg-neutral-50',
  ghost: 'text-neutral-500 hover:text-neutral-900',
}

/**
 * 여백은 Tailwind 기본값을 씁니다 (docs/01-conventions.md "스타일" 절).
 *
 * 글자 크기도 여기서 같이 정합니다. 전에는 BASE_CLASS 에 `text-body-lg`(16px)
 * 를 고정해둬서 작은 버튼도 글자만 16px 로 커졌습니다. (PR #28 리뷰)
 */
const SIZE_CLASS: Record<Size, string> = {
  sm: 'px-4 py-2 text-body-md',
  md: 'px-4 py-3 text-body-md',
  lg: 'px-6 py-3 text-body-lg',
}

const BASE_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-sm text-center font-semibold ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-50'

type Props = {
  children: ReactNode
  variant?: Variant
  size?: Size
  /** 값이 있으면 링크로, 없으면 버튼으로 그립니다 */
  to?: string
  /** 폼을 제출하는 버튼이면 `submit` 을 주세요. 기본은 `button` 입니다 */
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  /**
   * 마우스를 올렸을 때 뜨는 설명입니다.
   *
   * **못 누르는 이유를 여기 적지 마세요.** 브라우저는 비활성 요소에 마우스
   * 이벤트를 보내지 않아서 툴팁이 뜨지 않습니다. 결과적으로 이유를 아무도
   * 못 봅니다. 이유는 버튼 옆에 글로 적어주세요. (이슈 #32)
   */
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
  type = 'button',
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
    <button type={type} onClick={onClick} disabled={disabled} title={title} className={classes}>
      {children}
    </button>
  )
}
