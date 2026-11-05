import { IconArrowRight } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

type Props = {
  label: string
  /** "전체보기 →" 처럼 화살표를 붙일지. "목표 수정" 은 시안에 화살표가 없습니다 */
  withArrow?: boolean
  /** 갈 곳. 비우면 갈 화면이 아직 없는 자리로 보고 "준비 중" 으로 그립니다 */
  to?: string
}

/**
 * 홈 카드 머리 줄 오른쪽의 작은 링크입니다 (전체보기 · 목표 수정 같은 것).
 *
 * 처음에는 갈 화면이 없는 자리만 있어서 `ComingSoonLink` 였는데, 화면이 생기면서 대부분 진짜 링크가 됐습니다
 * (질문은행 #138, 연습 기록 · 성장 관리 #142, 기업별 인재상 · 연습 기록 카드 #162). 이름과 하는 일이 어긋나서 `CardLink` 로 바꿨습니다. (PR #139 리뷰)
 *
 * 갈 화면이 아직 없는 자리는 `to` 를 비웁니다(지금은 없습니다). 사이드바(AppLayout)의 준비 중 메뉴와 같은
 * 방식으로, 눌러서 404 로 떨어지는 것보다 흐린 글자로 두고 마우스를 올리면 준비 중이라고 알려줍니다. 버튼이 아니라
 * span 이라 `title` 툴팁이 뜹니다 (비활성 버튼은 툴팁이 안 뜹니다 — docs/01-conventions.md).
 */
export default function CardLink({ label, withArrow = true, to }: Props) {
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
