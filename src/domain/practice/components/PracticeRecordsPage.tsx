import { IconPlus } from '@tabler/icons-react'
import { useState } from 'react'

import { ROUTES } from '@/app/routes'
import { toUserMessage } from '@/shared/api/errorMessage'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import Button from '@/shared/ui/Button'
import SearchField from '@/shared/ui/SearchField'
import SegmentedTabs from '@/shared/ui/SegmentedTabs'

import type { MoveToFolderResult } from '../hooks/useMoveToFolder'
import { usePracticeFolders } from '../hooks/usePracticeFolders'
import { usePracticeSessions } from '../hooks/usePracticeSessions'
import { PRACTICE_PAGE_SIZE, PRACTICE_STATUS_TABS } from '../lib/practiceDisplay'
import {
  ALL_FOLDERS,
  type FolderSelection,
  type PracticeFolder,
  type PracticeSession,
  type PracticeStatusTab,
} from '../types/practice'

import FolderCards from './FolderCards'
import FolderDeleteDialog from './FolderDeleteDialog'
import FolderMoveDialog from './FolderMoveDialog'
import FolderNameDialog from './FolderNameDialog'
import PracticeList, { type PracticeListBody } from './PracticeList'
import PracticeTopBar from './PracticeTopBar'

/** 검색어를 다 칠 때까지 기다리는 시간. 글자마다 서버에 묻지 않으려는 것입니다 */
const SEARCH_DELAY_MS = 300

/** 지금 열린 창 */
type OpenDialog =
  | { kind: 'create' }
  | { kind: 'rename'; folder: PracticeFolder }
  | { kind: 'delete'; folder: PracticeFolder }
  | { kind: 'move'; session: PracticeSession }

const FOLDER_GONE_NOTICE = '이미 지워진 폴더예요. 폴더를 새로 불러왔어요.'

/**
 * 내 보관함 > 연습 기록.
 *
 * 지금까지 본 모의면접을 폴더 · 상태 · 검색어로 거르고, 리포트를 다시 봅니다. 진행 중인 면접 이어하기는 아직 열지
 * 않았습니다 (PracticeList 의 `RowAction`).
 * 위쪽 폴더 카드와 아래 목록은 따로 받습니다 — 목록 조건이 바뀔 때마다 폴더 숫자까지 다시 받을 이유가 없습니다.
 *
 * 시안에는 아이콘 레일 옆에 "내 보관함" 두 번째 패널이 붙어 있지만, 자소서 · 포트폴리오처럼 패널 없이 사이드바의
 * 하위 메뉴(SideNav)로 대신하고 본문을 1248px 로 묶어 가운데에 둡니다. 상단 줄(현재 위치 · 알림 · 프로필)도 같습니다.
 *
 * 목록은 `GET /api/practice-records`, 폴더는 `GET · POST /api/folders` 입니다 (practiceApi.ts).
 *
 * 행의 "폴더" 버튼으로 세션을 폴더로 옮기거나 빼고, 폴더를 고르면 그 폴더의 이름을 바꾸거나 지울 수 있습니다 (이슈 #205).
 * 시안에 없는 기능이라 다른 창과 같은 모양으로 그렸습니다. 옮기거나 지운 뒤에는 목록과 폴더 숫자를 둘 다 뒤에서 다시 받습니다 —
 * 서버는 면접 단위로 옮겨서 화면이 들고 있는 줄만 고쳐서는 다른 회차 · 폴더 숫자가 맞지 않습니다.
 */
export default function PracticeRecordsPage() {
  const folders = usePracticeFolders()
  const [folder, setFolder] = useState<FolderSelection>(ALL_FOLDERS)
  const [status, setStatus] = useState<PracticeStatusTab>('ALL')
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<OpenDialog | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const keyword = useDebouncedValue(query, SEARCH_DELAY_MS)

  // 조건을 바꾸면 첫 쪽부터 봅니다. 3쪽을 보다가 폴더를 바꿨는데 그 폴더에 1쪽뿐이면 빈 목록이 됩니다.
  // 쪽 번호는 그 쪽을 고른 조건과 함께 들고 있다가, 조건이 달라지면 0 으로 봅니다. 검색어는 **0.3초 늦게 반영된 값**
  // (`keyword`)을 기준으로 삼습니다 — 칠 때 바로 0 으로 돌리면 "이전 검색어 + 1쪽" 요청이 한 번 더 나갑니다. (PR #128 리뷰)
  const filterKey = JSON.stringify([folder, status, keyword.trim()])
  const [paging, setPaging] = useState({ filterKey, page: 0 })
  const page = paging.filterKey === filterKey ? paging.page : 0
  const changePage = (next: number) => setPaging({ filterKey, page: next })

  const sessions = usePracticeSessions({ folder, status, keyword, page, size: PRACTICE_PAGE_SIZE })

  // 옮기거나 지워서 이 쪽의 마지막 줄이 빠지면, 뒤에서 다시 받은 목록의 쪽 수가 줄어 빈 쪽이 됩니다. 마지막 쪽으로 당깁니다.
  // 렌더 중에 고치는 것은 React 가 허용하는 "이전 렌더 값으로 상태 맞추기" 입니다 — 조건이 맞을 때 한 번만 바뀝니다.
  if (sessions.status === 'ready' && !sessions.updating && page > 0 && page >= sessions.page.totalPages) {
    setPaging({ filterKey, page: Math.max(0, sessions.page.totalPages - 1) })
  }

  const openDialog = (next: OpenDialog) => {
    setNotice(null)
    setDialog(next)
  }

  /** 폴더나 세션을 바꾼 뒤. 폴더 카드 숫자와 목록(행의 폴더 이름 · 빠진 줄)을 둘 다 다시 받습니다 */
  const refreshAll = () => {
    folders.refresh()
    sessions.refresh()
  }

  /** 보던 폴더가 없어졌으면 "전체" 로 돌립니다. 없는 폴더의 목록을 계속 부르면 빈 목록만 옵니다 */
  const leaveFolder = (folderId: string) => {
    if (folder === folderId) setFolder(ALL_FOLDERS)
  }

  // 만든 폴더를 바로 고르지는 않습니다. 비어 있는 폴더라 목록이 텅 비어서, 보던 기록이 사라진 것처럼 보입니다.
  const handleFolderSaved = (saved: PracticeFolder) => {
    if (dialog?.kind === 'rename') {
      setNotice('폴더 이름을 바꿨어요.')
      refreshAll()
      return
    }
    setNotice(`‘${saved.name}’ 폴더를 만들었어요.`)
    folders.refresh()
  }

  const handleFolderGone = (gone: PracticeFolder) => {
    setNotice(FOLDER_GONE_NOTICE)
    leaveFolder(gone.folderId)
    refreshAll()
  }

  const handleFolderDeleted = (deleted: PracticeFolder) => {
    setNotice(`‘${deleted.name}’ 폴더를 지웠어요.`)
    leaveFolder(deleted.folderId)
    refreshAll()
  }

  const handleMoved = (result: Exclude<MoveToFolderResult, { kind: 'failed' }>) => {
    refreshAll()

    if (result.kind === 'session-gone') {
      setNotice('이미 없는 연습 기록이에요. 목록을 새로 불러왔어요.')
      return
    }
    if (result.kind === 'folder-gone') {
      setNotice(FOLDER_GONE_NOTICE)
      return
    }

    const { folderId, movedCount } = result.result
    const target = folders.status === 'ready' ? folders.folders.folders.find((item) => item.folderId === folderId) : undefined
    const done = folderId === null ? '폴더에서 뺐어요.' : target ? `‘${target.name}’ 폴더로 옮겼어요.` : '폴더로 옮겼어요.'
    // 서버는 면접 단위로 옮겨서, 재면접이 있으면 보낸 것보다 많이 옮겨집니다. 다른 줄이 같이 바뀐 이유를 적습니다
    const together = `같은 면접의 다른 회차 ${movedCount - 1}개도 함께 ${folderId === null ? '뺐어요' : '옮겼어요'}.`
    setNotice(movedCount > 1 ? `${done} ${together}` : done)
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
            <SearchField label="세션 검색" placeholder="기업 · 직무 검색" value={query} onChange={setQuery} />
            <Button variant="primary" size="sm" to={ROUTES.SESSION_SETUP} className="whitespace-nowrap">
              <IconPlus size={16} stroke={2} aria-hidden />새 연습 시작
            </Button>
          </div>
        </div>

        <FolderCards
          folders={folders}
          value={folder}
          onChange={setFolder}
          onCreate={() => openDialog({ kind: 'create' })}
          onRename={(target) => openDialog({ kind: 'rename', folder: target })}
          onDelete={(target) => openDialog({ kind: 'delete', folder: target })}
        />

        <SegmentedTabs label="진행 상태" options={PRACTICE_STATUS_TABS} value={status} onChange={setStatus} />

        {notice && (
          <p role="status" className="text-body-sm text-badge-success-text">
            {notice}
          </p>
        )}

        <PracticeList
          body={body}
          count={ready ? sessions.page.totalElements : 0}
          pagination={
            ready ? { page: sessions.page.page, totalPages: sessions.page.totalPages, onChange: changePage } : undefined
          }
          updating={ready && sessions.updating}
          onMove={folders.status === 'ready' ? (session) => openDialog({ kind: 'move', session }) : undefined}
          showFolder={folder === ALL_FOLDERS}
        />
      </div>

      {dialog?.kind === 'create' && folders.status === 'ready' && (
        <FolderNameDialog
          // "전체" 는 늘 있는 카드라 같은 이름의 폴더를 만들면 카드 줄에서 구분할 수 없습니다. "기타" 카드는 지금 숨겼지만
          // 백엔드에 "폴더 없음" 필터가 생기면 다시 넣을 자리라(docs/90 Q17) 이름을 미리 막아 둡니다.
          existingNames={['전체', '기타', ...folders.folders.folders.map((item) => item.name)]}
          onSaved={handleFolderSaved}
          onGone={() => setNotice(FOLDER_GONE_NOTICE)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'rename' && folders.status === 'ready' && (
        <FolderNameDialog
          editing={dialog.folder}
          // 이름을 바꾸는 폴더의 지금 이름은 빼고 견줍니다. 대소문자만 바꾸는 것도 허용합니다
          existingNames={[
            '전체',
            '기타',
            ...folders.folders.folders
              .filter((item) => item.folderId !== dialog.folder.folderId)
              .map((item) => item.name),
          ]}
          onSaved={handleFolderSaved}
          onGone={() => handleFolderGone(dialog.folder)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'delete' && (
        <FolderDeleteDialog
          folder={dialog.folder}
          onDeleted={handleFolderDeleted}
          onGone={handleFolderGone}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'move' && folders.status === 'ready' && (
        <FolderMoveDialog
          session={dialog.session}
          folders={folders.folders.folders}
          onDone={handleMoved}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}
