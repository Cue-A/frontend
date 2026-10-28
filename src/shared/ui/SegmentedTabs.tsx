import { useId } from 'react'

export type SegmentedTabOption<T extends string> = {
  value: T
  label: string
}

type Props<T extends string> = {
  /** 탭 묶음의 이름입니다. 화면에는 안 보이고 스크린리더가 읽습니다 (예: "문서 종류") */
  label: string
  options: readonly SegmentedTabOption<T>[]
  value: T
  onChange: (value: T) => void
}

/**
 * 목록 위의 필터 탭입니다. (보관함 시안 filter-tabs — 자소서 · 포트폴리오, 연습 기록, 질문 은행)
 *
 * 연한 보라 띠 안에서 고른 탭만 흰 알약으로 떠 있는 모양입니다. 세 화면 시안이 같은 모양이라 여기 한 곳에서 그립니다.
 *
 * 보기엔 탭이지만 하는 일은 "여럿 중 하나 고르기" 라서 라디오로 만듭니다. 진짜 `input[type=radio]` 를 숨겨 두면
 * 화살표 키 이동과 스크린리더의 "3개 중 2번째, 선택됨" 을 브라우저가 알아서 해줍니다. 홈의 기간 탭(PeriodTabs)과
 * 같은 방식입니다. 탭을 고르면 목록만 걸러지고 화면은 그대로라 `role="tab"` 은 쓰지 않습니다.
 *
 * 시안의 띠 색(#EFECFF)은 토큰에 없어서 가장 가까운 `primary-100` 을 씁니다. 글자는 시안 13px 대신 보관함 본문과
 * 같은 `text-body-md`(14px)입니다 — 13px `text-body` 는 랜딩 전용 세트입니다 (docs/design-system.md §3.3).
 */
export default function SegmentedTabs<T extends string>({ label, options, value, onChange }: Props<T>) {
  const name = useId()

  return (
    <fieldset className="flex w-fit min-w-0 max-w-full gap-0.5 overflow-x-auto rounded-full bg-primary-100 p-1">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label key={option.value} className="shrink-0 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          <span className="block whitespace-nowrap rounded-full px-4 py-1.5 text-body-md text-neutral-500 transition-colors hover:text-neutral-900 peer-checked:bg-neutral-0 peer-checked:font-semibold peer-checked:text-primary-500 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-200">
            {option.label}
          </span>
        </label>
      ))}
    </fieldset>
  )
}
