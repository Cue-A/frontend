import type { ReactNode } from 'react'

type Props = {
  title: string
  /** 제목 오른쪽 (전체보기 · 5 / 12 같은 것) */
  aside?: ReactNode
}

/** 홈 카드 맨 위 줄 — 왼쪽 제목, 오른쪽 보조 */
export default function CardHeader({ title, aside }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-h2 text-neutral-900">{title}</h2>
      {aside}
    </div>
  )
}
