import { IconPencil, IconPlus, IconSearch } from '@tabler/icons-react'
import { useState } from 'react'

import { toUserMessage } from '@/shared/api/errorMessage'
import Button from '@/shared/ui/Button'

import { useDocuments } from '../hooks/useDocuments'
import { useOpenDocument } from '../hooks/useOpenDocument'
import { DOCUMENT_TABS, filterDocuments, MAX_DOCUMENTS, type DocumentTab } from '../lib/documentDisplay'
import type { DocumentSummary } from '../types/document'

import DocumentContentDialog from './DocumentContentDialog'
import DocumentTable, { type DocumentTableBody } from './DocumentTable'
import DocumentUploadDialog from './DocumentUploadDialog'
import DocumentWriteDialog from './DocumentWriteDialog'
import LibraryPanel from './LibraryPanel'
import LibraryTopBar from './LibraryTopBar'

/**
 * C-02 내 보관함 > 자소서 · 포트폴리오. (이슈 #59)
 *
 * 등록한 문서를 보고, 종류별로 거르고, 원본을 다시 열어보고, 새로 올립니다.
 * 올리기 창은 임시 시안입니다 (DocumentUploadDialog 주석 참고, 이슈 #54 1-4).
 *
 * "직접 작성" 은 본문을 적어서 저장합니다. 직접 작성한 문서도 파일 문서처럼 면접에 쓸 수 있습니다
 * (Cue-A/backend#39). 작성 창도 임시 시안입니다 (DocumentWriteDialog 주석 참고).
 */
export default function LibraryDocumentsPage() {
  const documents = useDocuments()
  const opener = useOpenDocument()
  const [tab, setTab] = useState<DocumentTab>('ALL')
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<'upload' | 'write' | null>(null)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)

  // 사용자당 20개가 상한입니다. 채우면 올려봐야 서버가 거절하고, 지우는 기능도 아직 없어서
  // 버튼을 잠그고 이유를 글로 적습니다 (Cue-A/backend#38).
  const atLimit = documents.status === 'ready' && documents.page.totalElements >= MAX_DOCUMENTS
  const canAdd = documents.status === 'ready' && !atLimit

  const openDialog = (next: 'upload' | 'write') => {
    setSavedNotice(null)
    setDialog(next)
  }
  const openUpload = () => openDialog('upload')
  const openWrite = () => openDialog('write')

  const handleSaved = (document: DocumentSummary) => {
    const verb = document.sourceType === 'MARKDOWN' ? '저장했어요' : '올렸어요'
    setSavedNotice(`‘${document.title}’ 문서를 ${verb}.`)
    // 방금 올린 문서가 보이도록 거르는 조건을 풉니다. 다른 탭에 있으면 올렸는데 안 보입니다.
    setTab('ALL')
    setQuery('')
    documents.refresh()
  }

  let body: DocumentTableBody
  if (documents.status === 'loading') {
    body = { kind: 'loading' }
  } else if (documents.status === 'error') {
    body = { kind: 'error', message: toUserMessage(documents.error.code), onRetry: documents.reload }
  } else if (documents.page.documents.length === 0) {
    body = { kind: 'empty', onUpload: openUpload, onWrite: openWrite }
  } else {
    const visible = filterDocuments(documents.page.documents, tab, query)
    body = visible.length === 0 ? { kind: 'no-match' } : { kind: 'rows', documents: visible }
  }

  return (
    <div className="flex min-h-screen">
      <LibraryPanel documentCount={documents.status === 'ready' ? documents.page.totalElements : null} />

      <div className="flex min-w-0 flex-1 flex-col gap-6 px-6 py-6 md:px-12 md:py-8">
        <LibraryTopBar />

        {/* 넓은 화면에서는 제목 옆에 검색 · 업로드를 둡니다(시안). 설명이 길어져도 버튼을 밀어내지 않게 제목 쪽이 남는 폭을 씁니다. */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            <h1 className="text-h1 text-neutral-900">자소서 / 포트폴리오</h1>
            <p className="mt-2 break-keep text-body-md text-neutral-500">
              자소서를 등록하면 그 내용으로 면접 질문을 만들어 드려요. 등록한 문서와 상태를 여기서 다시 확인할 수 있어요.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-1 lg:items-end">
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative">
                <span className="sr-only">파일명 검색</span>
                <IconSearch
                  size={16}
                  stroke={2}
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="파일명 검색"
                  className="w-56 rounded-sm border border-neutral-200 bg-neutral-0 py-2 pl-9 pr-3 text-body-md text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
                />
              </label>
              <Button size="sm" disabled={!canAdd} onClick={openWrite} className="whitespace-nowrap">
                <IconPencil size={16} stroke={2} aria-hidden />
                직접 작성
              </Button>
              <Button variant="primary" size="sm" disabled={!canAdd} onClick={openUpload} className="whitespace-nowrap">
                <IconPlus size={16} stroke={2} aria-hidden />
                파일 업로드
              </Button>
            </div>
            {/* 비활성 버튼의 이유는 글로 적습니다 (docs/01-conventions.md). */}
            {atLimit && (
              <p className="break-keep text-body-sm text-neutral-500">
                문서는 {MAX_DOCUMENTS}개까지 등록할 수 있어요. 지우는 기능은 준비 중이에요.
              </p>
            )}
          </div>
        </div>

        <div role="group" aria-label="문서 종류" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-md bg-neutral-0 p-1 shadow-card">
          {DOCUMENT_TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
              className={`whitespace-nowrap rounded-sm px-4 py-2 text-body-md transition-colors ${
                tab === value ? 'bg-primary-100 font-semibold text-primary-700' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {savedNotice && (
          <p role="status" className="text-body-sm text-badge-success-text">
            {savedNotice}
          </p>
        )}

        {opener.error && (
          <p role="alert" className="text-body-sm text-semantic-danger">
            {opener.error}
          </p>
        )}

        <DocumentTable body={body} openingId={opener.openingId} onOpen={opener.open} />
      </div>

      <DocumentContentDialog document={opener.viewing} onClose={opener.closeViewing} />

      {dialog === 'upload' && (
        <DocumentUploadDialog
          defaultType={tab === 'PORTFOLIO' ? 'PORTFOLIO' : 'RESUME'}
          onUploaded={handleSaved}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'write' && (
        <DocumentWriteDialog
          defaultType={tab === 'PORTFOLIO' ? 'PORTFOLIO' : 'RESUME'}
          onSaved={handleSaved}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
