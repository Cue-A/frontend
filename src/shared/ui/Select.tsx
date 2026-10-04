type Option = {
  value: string
  label: string
}

type Props = {
  options: Option[]
  value: string | null
  onChange: (value: string) => void
  /** 고를 옵션이 없을 때 보여줄 자리표시 문구 */
  placeholder: string
  disabled?: boolean
  /** 스크린리더가 읽을 이름. 화면에 보이는 라벨이 따로 있으면 그 글자와 맞추세요. */
  ariaLabel: string
  /** 레이아웃만 넣어주세요. 색 · 타이포는 이 파일에서 정합니다 */
  className?: string
}

/**
 * 공용 드롭다운입니다. 네이티브 `<select>` 를 그대로 쓰고 스타일만 입힙니다.
 *
 * SessionSetupPage 의 답변시간 · 질문수 select 와 같은 모양(FIELD_CLASS)인데, 장치
 * 테스트 화면의 카메라 · 마이크 선택(이슈 #97)에도 같은 모양이 또 필요해져서
 * shared/ui 로 올렸습니다 — 같은 모양이 두 번째 화면에 생기면 올린다는 규칙 그대로입니다
 * (docs/01-conventions.md "버튼 · 카드는 shared/ui 를 씁니다").
 */
export default function Select({ options, value, onChange, placeholder, disabled = false, ariaLabel, className = '' }: Props) {
  return (
    <select
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled || options.length === 0}
      aria-label={ariaLabel}
      className={`rounded-sm border border-neutral-200 bg-neutral-0 px-4 py-3 text-body-md text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {options.length === 0 && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
