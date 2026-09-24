import type { ReactNode } from 'react'

type Padding = 'none' | 'sm' | 'md' | 'lg'
type Surface = 'white' | 'brand'

/**
 * 판의 색은 여기서만 정합니다.
 *
 * `className` 으로 배경색을 넘기면 안 됩니다. Tailwind 는 클래스를 적는 순서가
 * 아니라 **생성된 CSS 의 순서**로 이기고 지는 게 정해져서, `bg-neutral-0` 과
 * `bg-primary-100` 처럼 같은 속성이 겹치면 어느 쪽이 이길지 알 수 없습니다.
 * 지금 우연히 원하는 대로 보이더라도 다른 토큰으로 바꾸면 조용히 무시됩니다.
 * (PR #28 리뷰)
 */
const SURFACE_CLASS: Record<Surface, string> = {
  /** 시안의 기본 카드 — 테두리가 아니라 흰 배경 + 그림자입니다. */
  white: 'bg-neutral-0 shadow-card',
  /** 종합 점수처럼 강조되는 판 — 연한 브랜드 배경에 그림자는 없습니다. */
  brand: 'bg-primary-100',
}

/** 카드는 `radius-lg` 입니다 (docs/design-system.md §4). */
const BASE_CLASS = 'rounded-lg'

const PADDING_CLASS: Record<Padding, string> = {
  /**
   * 안쪽 내용이 판 끝까지 닿아야 할 때 씁니다. 표처럼 행 구분선이 좌우 끝까지
   * 이어지는 모양이 그렇습니다 (보관함 목록). 여백은 안쪽 칸이 각자 가집니다.
   */
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

type Props = {
  children: ReactNode
  padding?: Padding
  /** 판의 배경. 색은 `className` 이 아니라 이걸로 고르세요 */
  surface?: Surface
  /**
   * 이 카드가 화면에서 하나의 구역이면 제목을 주세요. section 으로 그리고
   * 스크린리더가 구역 이름으로 읽습니다. 없으면 그냥 div 입니다.
   */
  label?: string
  /** 레이아웃만 넣어주세요 (flex-1, w-64 같은 것). 색 · 여백은 여기서 정합니다 */
  className?: string
}

/**
 * 내용을 담는 판입니다.
 *
 * 시안의 구역은 테두리가 아니라 배경 + 그림자 + 둥근 모서리입니다.
 * 화면마다 따로 쓰면 그림자 세기가 조금씩 달라지므로, 판의 모양은
 * 이 파일에서만 정합니다.
 */
export default function Card({
  children,
  padding = 'md',
  surface = 'white',
  label,
  className = '',
}: Props) {
  const classes = [BASE_CLASS, SURFACE_CLASS[surface], PADDING_CLASS[padding], className]
    .filter(Boolean)
    .join(' ')

  if (label) {
    return (
      <section aria-label={label} className={classes}>
        {children}
      </section>
    )
  }

  return <div className={classes}>{children}</div>
}
