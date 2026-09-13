import Badge from '@/shared/ui/Badge'
import Chip from '@/shared/ui/Chip'

import type { Choice } from '../types/sessionSetup'

type Props<T extends string> = {
  label: string
  required?: boolean
  choices: Choice<T>[]
  value: T | null
  onChange: (value: T) => void
}

/**
 * 값 하나를 고르는 칩 묶음입니다. 직무 · 면접관 스타일 · 진행 방식이 같은 모양이라
 * 하나로 씁니다. (A-05)
 *
 * 라디오 버튼으로 만들었습니다. 보기엔 칩이지만 하는 일은 "여럿 중 하나 고르기"라,
 * 키보드와 스크린리더에서도 그렇게 동작해야 합니다.
 *
 * 라디오는 화면에서 숨기고 모양은 Chip 이 그립니다. 숨기면 초점 표시도 같이
 * 사라지므로, 감싼 span 에 `peer-focus-visible` 로 테두리를 돌려줍니다.
 */
export default function ChipGroup<T extends string>({
  label,
  required = false,
  choices,
  value,
  onChange,
}: Props<T>) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="flex items-center gap-2 text-body-lg text-neutral-900">
        {label}
        {required && <Badge tone="brand">필수</Badge>}
      </legend>

      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <label key={choice.value} className="cursor-pointer">
            <input
              type="radio"
              name={label}
              value={choice.value}
              checked={choice.value === value}
              onChange={() => onChange(choice.value)}
              className="peer sr-only"
            />

            <span className="inline-flex rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-500">
              <Chip selected={choice.value === value}>{choice.label}</Chip>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
