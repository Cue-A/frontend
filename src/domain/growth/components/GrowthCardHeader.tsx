import type { ReactNode } from 'react'

type Props = {
  title: string
  /** 제목 바로 옆에 붙는 작은 글 */
  note?: ReactNode
  /** 오른쪽 끝 (목표 수정 · 일정 등록 같은 것) */
  aside?: ReactNode
}

/** 성장 관리 카드 맨 위 줄 — 왼쪽 제목, 오른쪽 동작 (시안 HeaderRow) */
export default function GrowthCardHeader({ title, note, aside }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-body-lg text-neutral-900">{title}</h2>
        {note}
      </div>
      {aside}
    </div>
  )
}
