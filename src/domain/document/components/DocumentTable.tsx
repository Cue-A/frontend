import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import type { ReactNode } from 'react'

import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { describeDocument, formatBadgeOf, formatMeta, STATUS_VIEW } from '../lib/documentDisplay'
import type { DocumentSummary } from '../types/document'

/** 목록 자리에 들어갈 것. 행이 아니면 한 줄짜리 안내입니다. */
export type DocumentTableBody =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; onRetry: () => void }
  /** 보관함 자체가 비었을 때 */
  | { kind: 'empty' }
  /** 문서는 있는데 탭 · 검색에 걸리는 게 없을 때 */
  | { kind: 'no-match' }
  | { kind: 'rows'; documents: DocumentSummary[] }

type Props = {
  body: DocumentTableBody
  /** 지금 여는 중인 문서. 그 행의 조회 버튼을 잠급니다. */
  openingId: string | null
  onOpen: (document: DocumentSummary) => void
}

/** 좁은 화면에서는 좌우 여백을 줄여 파일 칸에 폭을 남깁니다. */
const CELL = 'px-4 py-4 md:px-6'

function FormatBadge({ document }: { document: DocumentSummary }) {
  const label = formatBadgeOf(document)
  // 직접 작성은 파일이 아니라서 색을 달리합니다. 시안도 "직접" 만 주황 계열입니다.
  const tone = document.sourceType === 'MARKDOWN' ? 'bg-badge-warning-bg text-badge-warning-text' : 'bg-primary-100 text-primary-600'

  return (
    <span aria-hidden className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-sm text-micro font-bold sm:flex ${tone}`}>
      {label}
    </span>
  )
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <tr>
      <td colSpan={4} className="break-keep px-6 py-12 text-center">
        {children}
      </td>
    </tr>
  )
}

function renderBody(body: DocumentTableBody, openingId: string | null, onOpen: Props['onOpen']) {
  switch (body.kind) {
    case 'loading':
      return (
        <Notice>
          <p className="text-body-md text-neutral-500">문서를 불러오는 중이에요…</p>
        </Notice>
      )
    case 'error':
      return (
        <Notice>
          <p className="text-body-md text-neutral-900">문서 목록을 불러오지 못했어요.</p>
          <p className="mt-1 text-body-sm text-neutral-500">{body.message}</p>
          <Button size="sm" onClick={body.onRetry} className="mt-4">
            다시 시도
          </Button>
        </Notice>
      )
    case 'empty':
      return (
        <Notice>
          <p className="text-body-md text-neutral-900">아직 등록한 문서가 없어요.</p>
          <p className="mt-1 text-body-sm text-neutral-500">
            자기소개서를 올리면 그 내용을 바탕으로 면접 질문을 만들어 드려요.
          </p>
        </Notice>
      )
    case 'no-match':
      return (
        <Notice>
          <p className="text-body-md text-neutral-900">조건에 맞는 문서가 없어요.</p>
          <p className="mt-1 text-body-sm text-neutral-500">검색어나 탭을 바꿔보세요.</p>
        </Notice>
      )
    case 'rows':
      return body.documents.map((document) => {
        const status = STATUS_VIEW[document.indexStatus]
        const opening = openingId === document.documentId

        return (
          <tr key={document.documentId} className="border-t border-neutral-200">
            <td className={CELL}>
              <div className="flex items-center gap-3">
                <FormatBadge document={document} />
                <div className="min-w-0">
                  <p className="truncate text-body-md font-semibold text-neutral-900">{document.title}</p>
                  <p className="truncate text-body-sm text-neutral-500">{describeDocument(document)}</p>
                </div>
              </div>
            </td>
            <td className={`${CELL} hidden whitespace-nowrap text-right text-body-sm text-neutral-700 md:table-cell`}>
              {formatMeta(document)}
            </td>
            <td className={`${CELL} whitespace-nowrap text-center`}>
              <Badge tone={status.tone}>
                <span aria-hidden className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                {status.label}
              </Badge>
            </td>
            <td className={`${CELL} text-right`}>
              <Button size="sm" onClick={() => onOpen(document)} disabled={opening} className="whitespace-nowrap">
                {opening ? '여는 중…' : '조회'}
                <span className="sr-only"> — {document.title}</span>
              </Button>
            </td>
          </tr>
        )
      })
  }
}

/**
 * 보관함 목록입니다. (C-02)
 *
 * 시안의 "조회/수정" 은 **"조회"** 만 둡니다 — 수정 API 가 없습니다. 행 끝의 ⋮ 메뉴(삭제 등)도
 * 삭제 API 가 없어서 뺐습니다(Cue-A/backend#38). 실패한 문서의 "다시 업로드" 는 업로드 흐름이
 * 붙을 때 같이 넣습니다. (이슈 #59)
 *
 * 문서는 사용자당 20개까지라 한 페이지에 전부 옵니다. 페이지 버튼은 시안대로 두되 늘 비활성입니다.
 */
export default function DocumentTable({ body, openingId, onOpen }: Props) {
  const count = body.kind === 'rows' ? body.documents.length : 0

  return (
    <Card padding="none" label="문서 목록" className="overflow-hidden">
      <table className="w-full table-fixed">
        <thead>
          <tr className="whitespace-nowrap text-left text-body-sm text-neutral-500">
            <th scope="col" className="px-4 py-3 font-semibold md:px-6">
              파일
            </th>
            <th scope="col" className="hidden w-48 px-6 py-3 text-right font-semibold md:table-cell">
              등록일 · 용량
            </th>
            <th scope="col" className="w-28 px-4 py-3 text-center font-semibold md:w-36 md:px-6">
              상태
            </th>
            <th scope="col" className="w-20 px-4 py-3 text-right font-semibold md:w-28 md:px-6">
              작업
            </th>
          </tr>
        </thead>
        <tbody>{renderBody(body, openingId, onOpen)}</tbody>
      </table>

      <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
        <p className="text-body-sm text-neutral-500">{count}개 항목</p>
        <div className="flex gap-2">
          {[
            { label: '이전 페이지', Icon: IconChevronLeft },
            { label: '다음 페이지', Icon: IconChevronRight },
          ].map(({ label, Icon }) => (
            <button
              key={label}
              type="button"
              disabled
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-neutral-200 text-neutral-400 disabled:cursor-not-allowed"
            >
              <Icon size={16} stroke={2} aria-hidden />
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
