import { IconPlus } from '@tabler/icons-react'
import { useState } from 'react'

import { ROUTES } from '@/app/routes'
import { toUserMessage } from '@/shared/api/errorMessage'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import Button from '@/shared/ui/Button'
import SearchField from '@/shared/ui/SearchField'
import SegmentedTabs from '@/shared/ui/SegmentedTabs'

import { usePracticeFolders } from '../hooks/usePracticeFolders'
import { usePracticeSessions } from '../hooks/usePracticeSessions'
import { PRACTICE_PAGE_SIZE, PRACTICE_STATUS_TABS } from '../lib/practiceDisplay'
import { ALL_FOLDERS, type FolderSelection, type PracticeFolder, type PracticeStatusTab } from '../types/practice'

import FolderCards from './FolderCards'
import FolderCreateDialog from './FolderCreateDialog'
import PracticeList, { type PracticeListBody } from './PracticeList'
import PracticeTopBar from './PracticeTopBar'

/** 검색어를 다 칠 때까지 기다리는 시간. 글자마다 서버에 묻지 않으려는 것입니다 */
const SEARCH_DELAY_MS = 300

/**
 * 내 보관함 > 연습 기록.
 *
 * 지금까지 본 모의면접을 폴더 · 상태 · 검색어로 거르고, 리포트를 다시 보거나 진행 중인 면접을 이어 봅니다.
 * 위쪽 폴더 카드와 아래 목록은 따로 받습니다 — 목록 조건이 바뀔 때마다 폴더 숫자까지 다시 받을 이유가 없습니다.
 *
 * 시안에는 아이콘 레일 옆에 "내 보관함" 두 번째 패널이 붙어 있지만, 자소서 · 포트폴리오처럼 패널 없이 사이드바의
 * 하위 메뉴(SideNav)로 대신하고 본문을 1248px 로 묶어 가운데에 둡니다. 상단 줄(현재 위치 · 알림 · 프로필)도 같습니다.
 *
 * **백엔드에 세션 목록 · 폴더 API 가 없어서 목업으로만 동작합니다** (practiceApi.ts). 세션을 폴더에 넣고 빼는 기능은
 * 시안에 없어 아직 만들지 않았습니다 — 새 폴더는 만들 수 있지만 지금은 빈 폴더로 남습니다.
 */
export default function PracticeRecordsPage() {
  const folders = usePracticeFolders()
  const [folder, setFolder] = useState<FolderSelection>(ALL_FOLDERS)
  const [status, setStatus] = useState<PracticeStatusTab>('ALL')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const keyword = useDebouncedValue(query, SEARCH_DELAY_MS)
  const sessions = usePracticeSessions({ folder, status, keyword, page, size: PRACTICE_PAGE_SIZE })

  // 조건을 바꾸면 첫 쪽부터 봅니다. 3쪽을 보다가 폴더를 바꿨는데 그 폴더에 1쪽뿐이면 빈 목록이 됩니다.
  const changeFolder = (next: FolderSelection) => {
    setFolder(next)
    setPage(0)
  }
  const changeStatus = (next: PracticeStatusTab) => {
    setStatus(next)
    setPage(0)
  }
  const changeQuery = (next: string) => {
    setQuery(next)
    setPage(0)
  }

  const openCreateFolder = () => {
    setNotice(null)
    setCreatingFolder(true)
  }

  // 만든 폴더를 바로 고르지는 않습니다. 비어 있는 폴더라 목록이 텅 비어서, 보던 기록이 사라진 것처럼 보입니다.
  const handleFolderCreated = (created: PracticeFolder) => {
    setNotice(`‘${created.name}’ 폴더를 만들었어요.`)
    folders.refresh()
  }

  let body: PracticeListBody
  if (sessions.status === 'loading') {
    body = { kind: 'loading' }
  } else if (sessions.status === 'error') {
    body = { kind: 'error', message: toUserMessage(sessions.error.code), onRetry: sessions.reload }
  } else if (sessions.page.sessions.length > 0) {
    body = { kind: 'rows', sessions: sessions.page.sessions }
  } else if (keyword.trim() || status !== 'ALL') {
    body = { kind: 'no-match' }
  } else if (folder !== ALL_FOLDERS) {
    body = { kind: 'empty-folder' }
  } else {
    body = { kind: 'empty' }
  }

  const ready = sessions.status === 'ready'

  return (
    <>
      {/* 1248px = 자소서 · 포트폴리오와 같은 본문 폭입니다 */}
      <div className="mx-auto flex w-full max-w-312 flex-col gap-6">
        <PracticeTopBar />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            <h1 className="text-h1 text-neutral-900">연습 기록</h1>
            <p className="mt-2 break-keep text-body-md text-neutral-500">
              지금까지 진행한 모의면접 연습 기록을 다시 확인하고 복습할 수 있어요.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <SearchField label="세션 검색" placeholder="기업 · 직무 검색" value={query} onChange={changeQuery} />
            <Button variant="primary" size="sm" to={ROUTES.SESSION_SETUP} className="whitespace-nowrap">
              <IconPlus size={16} stroke={2} aria-hidden />새 연습 시작
            </Button>
          </div>
        </div>

        <FolderCards folders={folders} value={folder} onChange={changeFolder} onCreate={openCreateFolder} />

        <SegmentedTabs label="진행 상태" options={PRACTICE_STATUS_TABS} value={status} onChange={changeStatus} />

        {notice && (
          <p role="status" className="text-body-sm text-badge-success-text">
            {notice}
          </p>
        )}

        <PracticeList
          body={body}
          count={ready ? sessions.page.totalElements : 0}
          pagination={
            ready ? { page: sessions.page.page, totalPages: sessions.page.totalPages, onChange: setPage } : undefined
          }
          updating={ready && sessions.updating}
        />
      </div>

      {creatingFolder && folders.status === 'ready' && (
        <FolderCreateDialog
          // "전체" · "기타" 는 늘 있는 카드라 같은 이름의 폴더를 만들면 카드 줄에서 구분할 수 없습니다.
          existingNames={['전체', '기타', ...folders.folders.folders.map((item) => item.name)]}
          onCreated={handleFolderCreated}
          onClose={() => setCreatingFolder(false)}
        />
      )}
    </>
  )
}
