import type { ReactNode } from 'react'

import Card from './Card'
import Pagination from './Pagination'

type Props = {
  /** 이 목록 구역의 이름입니다. 스크린리더가 구역 이름으로 읽습니다 (예: "문서 목록") */
  label: string
  /** 아래 줄의 "n개 항목" 에 들어갈 수. 거른 뒤의 수를 넘겨주세요 */
  count: number
  /** 페이지를 나누는 목록이면 넘깁니다. 없으면 한 쪽짜리로 보고 페이지 버튼을 잠가 둡니다 */
  pagination?: {
    /** 0부터 셉니다 */
    page: number
    totalPages: number
    onChange: (page: number) => void
  }
  /** 목록 본문 — 행이든 표든 쓰는 화면이 그립니다. 행 사이 구분선도 쓰는 쪽에서 긋습니다 */
  children: ReactNode
}

/**
 * 보관함 목록 판입니다. (보관함 시안 file-table · table-footer-row — 자소서 · 포트폴리오, 연습 기록, 질문 은행)
 *
 * 흰 판 안에 목록이 판 끝까지 닿고, 맨 아래 줄에 "n개 항목" 과 이전 · 다음 페이지 버튼이 있습니다. 세 화면이 같은
 * 판과 아래 줄을 쓰고, 행의 생김새만 다릅니다(문서는 머리줄이 있는 표, 연습 기록 · 질문 은행은 머리줄 없는 행).
 * 그래서 판과 아래 줄만 여기서 그리고 행은 `children` 으로 받습니다.
 *
 * 아래 줄은 시안대로 높이 52px 입니다. 글자는 시안 13px 대신 `text-body-sm` 입니다 (SegmentedTabs 주석 참고).
 */
export default function ListCard({ label, count, pagination, children }: Props) {
  return (
    <Card padding="none" label={label} className="overflow-hidden">
      {children}

      <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-2.5">
        <p className="text-body-sm text-neutral-500">{count}개 항목</p>
        <Pagination
          page={pagination?.page ?? 0}
          totalPages={pagination?.totalPages ?? 1}
          onChange={pagination?.onChange ?? (() => {})}
        />
      </div>
    </Card>
  )
}
