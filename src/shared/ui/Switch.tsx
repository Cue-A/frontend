import type { ReactNode } from 'react'

/** 시안의 스위치 크기입니다. 트랙 44×24, 손잡이 20 (docs/design-system.md §8). */
const TRACK_CLASS =
  'relative h-6 w-11 shrink-0 rounded-full transition-colors ' +
  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-500 ' +
  'peer-disabled:opacity-50'

const KNOB_CLASS = 'absolute top-0.5 h-5 w-5 rounded-full bg-neutral-0 transition-all'

type Props = {
  /** 스위치 옆에 붙는 글. 이게 곧 이름이라 따로 aria-label 을 주지 않습니다 */
  children: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  /** 글을 왼쪽에 두고 스위치를 오른쪽 끝으로 밀 때 씁니다 */
  labelFirst?: boolean
  /** 레이아웃만 넣어주세요 */
  className?: string
}

/**
 * 켜짐 · 꺼짐 스위치입니다.
 *
 * 실제 상태는 숨긴 체크박스가 갖고, 보이는 건 그 위에 그린 모양입니다.
 * 체크박스를 지우고 div 로 만들면 키보드로 못 켜고 스크린리더가 상태를
 * 못 읽습니다.
 *
 * 옵션 설정의 "기업 맞춤 질문"과 리포트의 표시 옵션에서 같은 모양을 쓰고 있어서
 * 여기로 올렸습니다 ("두 번째 화면이 생기면 shared/ui 로" — docs/01-conventions.md).
 */
export default function Switch({
  children,
  checked,
  onChange,
  disabled = false,
  labelFirst = false,
  className = '',
}: Props) {
  const track = (
    <span aria-hidden className={`${TRACK_CLASS} ${checked ? 'bg-primary-500' : 'bg-neutral-300'}`}>
      <span className={`${KNOB_CLASS} ${checked ? 'left-5.5' : 'left-0.5'}`} />
    </span>
  )

  return (
    <label
      className={`flex items-center gap-2 ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      {labelFirst && <span className="flex-1">{children}</span>}

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      {track}

      {!labelFirst && <span>{children}</span>}
    </label>
  )
}
