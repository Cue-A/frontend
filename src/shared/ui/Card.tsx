import type { ReactNode } from 'react'

type Padding = 'sm' | 'md' | 'lg'

/**
 * 토큰이 들어오면 여기만 채우면 됩니다.
 * 예정) 'bg-neutral-0 rounded-lg shadow-card' (테두리 대신 그림자)
 */
const SURFACE_CLASS = 'border'

const PADDING_CLASS: Record<Padding, string> = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

type Props = {
  children: ReactNode
  padding?: Padding
  /**
   * 이 카드가 화면에서 하나의 구역이면 제목을 주세요. section 으로 그리고
   * 스크린리더가 구역 이름으로 읽습니다. 없으면 그냥 div 입니다.
   */
  label?: string
  /** 레이아웃만 넣어주세요 (flex-1, min-w-64 같은 것). 색 · 여백은 여기서 정합니다 */
  className?: string
}

/**
 * 내용을 담는 흰 판입니다.
 *
 * 지금 화면 대부분이 테두리 박스로 구역을 나누고 있습니다. 토큰이 들어오면
 * 테두리 대신 흰 배경 + 그림자 + 둥근 모서리로 바뀌는데, 그때 이 파일 하나만
 * 고치면 모든 화면이 같이 바뀝니다.
 */
export default function Card({ children, padding = 'md', label, className = '' }: Props) {
  const classes = [SURFACE_CLASS, PADDING_CLASS[padding], className].filter(Boolean).join(' ')

  if (label) {
    return (
      <section aria-label={label} className={classes}>
        {children}
      </section>
    )
  }

  return <div className={classes}>{children}</div>
}
