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
      <legend className="flex items-center gap-2">
        {label}
        {required && <span className="border px-2 py-0.5">필수</span>}
      </legend>

      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <label
            key={choice.value}
            aria-current={choice.value === value ? 'true' : undefined}
            className="flex items-center gap-2 border px-4 py-2"
          >
            <input
              type="radio"
              name={label}
              value={choice.value}
              checked={choice.value === value}
              onChange={() => onChange(choice.value)}
            />
            {choice.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
