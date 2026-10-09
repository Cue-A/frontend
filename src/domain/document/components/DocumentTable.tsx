import { IconPencil, IconTrash } from '@tabler/icons-react'
import type { ReactNode } from 'react'

import Button from '@/shared/ui/Button'
import ListCard from '@/shared/ui/ListCard'

import { DOCUMENT_TYPE_LABEL, formatBadgeOf, formatMeta } from '../lib/documentDisplay'
import type { DocumentSummary } from '../types/document'

/** 목록 자리에 들어갈 것. 행이 아니면 한 줄짜리 안내입니다. */
export type DocumentTableBody =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; onRetry: () => void }
  /** 보관함 자체가 비었을 때. 올리기를 열 수 있으면 버튼을 둡니다 */
  | { kind: 'empty'; onUpload?: () => void; onWrite?: () => void }
  /** 문서는 있는데 탭 · 검색에 걸리는 게 없을 때 */
  | { kind: 'no-match' }
  | { kind: 'rows'; documents: DocumentSummary[] }

type Props = {
  body: DocumentTableBody
  /** 지금 여는 중인 문서. 그 행의 조회 버튼을 잠급니다. */
  openingId: string | null
  onOpen: (document: DocumentSummary) => void
  /** 제목 수정 창을 엽니다. 없으면 수정 버튼을 내지 않습니다 (수정 API 를 쓸 수 없을 때) */
  onRename?: (document: DocumentSummary) => void
  /** 지우기 확인 창을 엽니다. 실제로 지우는 건 확인 창입니다 */
  onDelete: (document: DocumentSummary) => void
}

/** 행 끝의 아이콘 버튼(제목 수정 · 지우기) 모양입니다. */
const ICON_BUTTON =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-900'

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
      <td colSpan={3} className="break-keep px-6 py-12 text-center">
        {children}
      </td>
    </tr>
  )
}

function renderBody(
  body: DocumentTableBody,
  openingId: string | null,
  onOpen: Props['onOpen'],
  onRename: Props['onRename'],
  onDelete: Props['onDelete'],
) {
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
            자기소개서를 올리거나 직접 적으면 그 내용을 바탕으로 면접 질문을 만들어 드려요.
          </p>
          {(body.onUpload || body.onWrite) && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {body.onWrite && (
                <Button size="sm" onClick={body.onWrite}>
                  직접 작성
                </Button>
              )}
              {body.onUpload && (
                <Button variant="primary" size="sm" onClick={body.onUpload}>
                  파일 업로드
                </Button>
              )}
            </div>
          )}
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
        const opening = openingId === document.documentId

        return (
          <tr key={document.documentId} className="border-t border-neutral-200">
            <td className={CELL}>
              <div className="flex items-center gap-3">
                <FormatBadge document={document} />
                <div className="min-w-0">
                  <p className="truncate text-body-md font-semibold text-neutral-900">{document.title}</p>
                  <p className="truncate text-body-sm text-neutral-500">{DOCUMENT_TYPE_LABEL[document.documentType]}</p>
                </div>
              </div>
            </td>
            <td className={`${CELL} hidden whitespace-nowrap text-right text-body-sm text-neutral-700 md:table-cell`}>
              {formatMeta(document)}
            </td>
            <td className={`${CELL} text-right`}>
              <div className="flex items-center justify-end gap-1">
                <Button size="sm" onClick={() => onOpen(document)} disabled={opening} className="whitespace-nowrap">
                  {opening ? '여는 중…' : '조회'}
                  <span className="sr-only"> — {document.title}</span>
                </Button>
                {onRename && (
                  <button type="button" onClick={() => onRename(document)} title="제목 수정" className={ICON_BUTTON}>
                    <IconPencil size={18} stroke={2} aria-hidden />
                    <span className="sr-only">제목 수정 — {document.title}</span>
                  </button>
                )}
                <button type="button" onClick={() => onDelete(document)} title="지우기" className={ICON_BUTTON}>
                  <IconTrash size={18} stroke={2} aria-hidden />
                  <span className="sr-only">지우기 — {document.title}</span>
                </button>
              </div>
            </td>
          </tr>
        )
      })
  }
}

/**
 * 보관함 목록입니다. (C-02)
 *
 * 시안의 "조회/수정" 버튼은 **"조회"** 로 두고, 수정은 **제목만** 바꿀 수 있어 따로 뺐습니다. 행 끝의 ⋮ 메뉴
 * 대신 **제목 수정 · 지우기 아이콘 버튼**을 바로 둡니다(지우기는 Cue-A/backend#40). 항목이 둘뿐이라 한 번 더 눌러
 * 메뉴를 여는 수고가 없고, 표가 `overflow-hidden` 이라 아래쪽 행의 메뉴가 잘리는 문제도 없습니다. 항목이 더
 * 늘면 그때 메뉴로 모읍니다. (이슈 #59)
 *
 * 제목 수정 버튼은 `onRename` 을 받았을 때만 냅니다. 수정 API 가 백엔드에 아직 없어서, 문서를 실제 서버에 붙인
 * 동안은 화면이 `onRename` 을 주지 않습니다 (`documentApi.ts` 의 `CAN_RENAME_DOCUMENT`).
 *
 * "상태" 칸(완료 · 분석 중 · 실패)은 뺐습니다. 문서의 준비 상태가 백엔드 응답에서 빠져서(Cue-A/backend#58)
 * 모든 행에 똑같은 "완료" 만 남기 때문입니다. 등록한 문서는 곧바로 면접에 쓸 수 있습니다.
 *
 * 문서는 사용자당 20개까지라 한 페이지에 전부 옵니다. 페이지 버튼은 시안대로 두되 늘 비활성입니다
 * (`ListCard` 에 `pagination` 을 넘기지 않음). 판과 아래 줄은 연습 기록 · 질문 은행과 같은 `ListCard` 입니다.
 */
export default function DocumentTable({ body, openingId, onOpen, onRename, onDelete }: Props) {
  const count = body.kind === 'rows' ? body.documents.length : 0

  return (
    <ListCard label="문서 목록" count={count}>
      <table className="w-full table-fixed">
        <thead>
          <tr className="whitespace-nowrap text-left text-body-sm text-neutral-500">
            <th scope="col" className="px-4 py-3 font-semibold md:px-6">
              파일
            </th>
            <th scope="col" className="hidden w-48 px-6 py-3 text-right font-semibold md:table-cell">
              등록일 · 용량
            </th>
            {/* 조회 + 아이콘 버튼 둘(제목 수정 · 지우기)이 한 줄에 들어가는 폭입니다. 좁으면 파일 칸 위로 넘칩니다 */}
            <th scope="col" className="w-44 px-4 py-3 text-right font-semibold md:w-48 md:px-6">
              작업
            </th>
          </tr>
        </thead>
        <tbody>{renderBody(body, openingId, onOpen, onRename, onDelete)}</tbody>
      </table>

    </ListCard>
  )
}
