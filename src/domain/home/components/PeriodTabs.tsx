import { useId } from 'react'

import { PRACTICE_PERIODS } from '../lib/practicePeriod'
import type { PracticePeriod } from '../types/home'

type Props = {
  value: PracticePeriod
  onChange: (value: PracticePeriod) => void
}

/**
 * 연습 기록의 기간 탭 (시안 mode-chips `1247:1709`).
 *
 * 보기엔 탭이지만 "넷 중 하나 고르기" 라 라디오로 만듭니다. 진짜 `input[type=radio]` 를 숨겨 두면 화살표 키
 * 이동과 스크린리더의 "4개 중 2번째, 선택됨" 을 브라우저가 알아서 해줍니다. 옵션 설정(A-05)의 칩과 같은 방식입니다.
 */
export default function PeriodTabs({ value, onChange }: Props) {
  const name = useId()

  return (
    <fieldset className="flex rounded-full bg-neutral-50 p-1">
      <legend className="sr-only">기간</legend>
      {PRACTICE_PERIODS.map((period) => (
        <label key={period.value} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={period.value}
            checked={value === period.value}
            onChange={() => onChange(period.value)}
            className="peer sr-only"
          />
          <span className="block rounded-full px-3.5 py-1.5 text-body-sm text-neutral-500 transition-colors hover:text-neutral-900 peer-checked:bg-neutral-0 peer-checked:font-semibold peer-checked:text-primary-500 peer-checked:shadow-card peer-focus-visible:ring-2 peer-focus-visible:ring-primary-200">
            {period.label}
          </span>
        </label>
      ))}
    </fieldset>
  )
}
