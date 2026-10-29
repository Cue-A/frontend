import { IconArrowRight } from '@tabler/icons-react'

type Props = {
  label: string
  /** "전체보기 →" 처럼 화살표를 붙일지. "목표 수정" 은 시안에 화살표가 없습니다 */
  withArrow?: boolean
}

/**
 * 시안에는 링크인데 **갈 화면이 아직 없는** 자리입니다 (리포트 전체보기 · 인재상 · 질문은행 · 목표 수정).
 *
 * 사이드바(AppLayout)의 준비 중 메뉴와 같은 방식입니다 — 눌러서 404 로 떨어지는 것보다 흐린 글자로 두고
 * 마우스를 올리면 준비 중이라고 알려줍니다. 버튼이 아니라 span 이라 `title` 툴팁이 뜹니다
 * (비활성 버튼은 툴팁이 안 뜹니다 — docs/01-conventions.md).
 */
export default function ComingSoonLink({ label, withArrow = true }: Props) {
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
