import type { ReactNode } from 'react'

type Padding = 'sm' | 'md' | 'lg'

/** 시안의 카드는 테두리가 아니라 흰 배경 + 그림자입니다. */
const SURFACE_CLASS = 'rounded-lg bg-neutral-0 shadow-card'

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
 * 시안의 구역은 테두리가 아니라 흰 배경 + 그림자 + 둥근 모서리입니다.
 * 화면마다 따로 쓰면 그림자 세기가 조금씩 달라지므로, 판의 모양은
 * 이 파일에서만 정합니다.
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
