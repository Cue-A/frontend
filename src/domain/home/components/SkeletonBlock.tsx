type Props = {
  /** 크기만 넣어주세요 (h-6 w-24 같은 것). 모양은 `shape` 로 고릅니다 */
  className?: string
  /**
   * 막대(기본)인지 원인지. `className` 으로 `rounded-full` 을 넘기면 기본의 `rounded-sm` 과 겹쳐서
   * 어느 쪽이 이길지 알 수 없습니다 (shared/ui/Card.tsx 주석과 같은 이유).
   */
  shape?: 'bar' | 'circle'
}

/** 불러오는 동안 글자 · 숫자 자리를 채우는 회색 막대입니다 */
export default function SkeletonBlock({ className = '', shape = 'bar' }: Props) {
  const rounded = shape === 'circle' ? 'rounded-full' : 'rounded-sm'
  return <span aria-hidden className={`block animate-pulse bg-neutral-200 ${rounded} ${className}`} />
}
