import { IconSearch } from '@tabler/icons-react'

type Props = {
  /** 칸의 이름입니다. 화면에는 안 보이고 스크린리더가 읽습니다 (예: "파일명 검색") */
  label: string
  value: string
  onChange: (value: string) => void
  /** 비우면 `label` 을 그대로 씁니다 */
  placeholder?: string
  /** 레이아웃만 넣어주세요. 폭의 기본값은 시안의 220px 입니다 */
  className?: string
}

/**
 * 목록을 거르는 검색 칸입니다. (보관함 시안 search-box — 자소서 · 포트폴리오, 연습 기록, 질문 은행)
 *
 * 입력할 때마다 `onChange` 로 글자를 넘깁니다. 거르는 건 쓰는 화면이 합니다 — 화면마다 보는 칸(파일명, 세션 이름,
 * 질문 문장)이 달라서입니다. `type="search"` 라 Esc 와 브라우저의 지우기 단추로 비울 수 있습니다.
 *
 * 시안은 높이 36px · 테두리 neutral-300 · 모서리 10px(`radius-sm`)입니다. 글자는 필터 탭과 같은 이유로
 * 시안 13px 대신 `text-body-md` 입니다 (SegmentedTabs 주석 참고).
 */
export default function SearchField({ label, value, onChange, placeholder, className = 'w-55' }: Props) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{label}</span>
      <IconSearch
        size={16}
        stroke={2}
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? label}
        className="h-9 w-full rounded-sm border border-neutral-300 bg-neutral-0 pl-9.5 pr-3 text-body-md text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
      />
    </label>
  )
}
