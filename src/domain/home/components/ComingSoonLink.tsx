import { IconArrowRight } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

type Props = {
  label: string
  /** "전체보기 →" 처럼 화살표를 붙일지. "목표 수정" 은 시안에 화살표가 없습니다 */
  withArrow?: boolean
  /** 갈 화면이 생기면 그 경로를 넘기세요. 있으면 진짜 링크로 그리고, 없으면 "준비 중" 으로 둡니다 */
  to?: string
}

/**
 * 시안에는 링크인데 **갈 화면이 아직 없는** 자리입니다 (리포트 전체보기 · 인재상 · 목표 수정).
 * 화면이 생기면 `to` 만 넘겨서 같은 자리를 진짜 링크로 바꿉니다 (질문은행 전체보기 — 이슈 #138).
 *
 * 사이드바(AppLayout)의 준비 중 메뉴와 같은 방식입니다 — 눌러서 404 로 떨어지는 것보다 흐린 글자로 두고
 * 마우스를 올리면 준비 중이라고 알려줍니다. 버튼이 아니라 span 이라 `title` 툴팁이 뜹니다
 * (비활성 버튼은 툴팁이 안 뜹니다 — docs/01-conventions.md).
 */
export default function ComingSoonLink({ label, withArrow = true, to }: Props) {
  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex shrink-0 items-center gap-1 rounded-sm text-body-sm text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-primary-500"
      >
        {label}
        {withArrow && <IconArrowRight size={14} stroke={2} aria-hidden />}
      </Link>
    )
  }

  return (
    <span
      aria-disabled
      title={`${label} (준비 중이에요)`}
      className="inline-flex shrink-0 items-center gap-1 text-body-sm text-neutral-400"
    >
      {label}
      {withArrow && <IconArrowRight size={14} stroke={2} aria-hidden />}
      <span className="sr-only">(준비 중)</span>
    </span>
  )
}
