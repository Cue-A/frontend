import { IconFolder, IconFolderSymlink, IconPlayerPlay, IconVideo } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES, toAnalyzing, toReport } from '@/app/routes'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import ListCard from '@/shared/ui/ListCard'

import { metaOf, titleOf } from '../lib/practiceDisplay'
import type { PracticeSession } from '../types/practice'

/** 목록 자리에 들어갈 것. 행이 아니면 한 줄짜리 안내입니다 */
export type PracticeListBody =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; onRetry: () => void }
  /** 연습을 한 번도 안 했을 때 */
  | { kind: 'empty' }
  /** 고른 폴더에 담긴 세션이 없을 때 */
  | { kind: 'empty-folder' }
  /** 세션은 있는데 탭 · 검색에 걸리는 게 없을 때 */
  | { kind: 'no-match' }
  | { kind: 'rows'; sessions: PracticeSession[] }

type Props = {
  body: PracticeListBody
  /** "n개 항목" — 거른 뒤의 전체 개수입니다. 이 쪽에 보이는 행 수가 아닙니다 */
  count: number
  pagination?: { page: number; totalPages: number; onChange: (page: number) => void }
  /** 새 조건의 목록을 받는 중이면 true. 이전 목록을 흐리게 둡니다 */
  updating: boolean
  /** 행의 "폴더" 버튼. 폴더를 아직 못 불러왔으면 비워서 버튼을 잠급니다 (이슈 #205) */
  onMove?: (session: PracticeSession) => void
  /** 행에 들어 있는 폴더 이름을 붙일지. "전체" 를 볼 때만 붙입니다 — 폴더를 고른 중이면 다 같은 이름이라 겹칩니다 */
  showFolder: boolean
}

type RowOptions = Pick<Props, 'onMove' | 'showFolder'>

const ACTION_BASE =
  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-2 text-body-sm font-semibold transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-primary-500'

function Notice({ children }: { children: ReactNode }) {
  return <li className="break-keep px-6 py-12 text-center">{children}</li>
}

/**
 * 행 끝의 버튼. 세션 상태마다 할 수 있는 일이 다릅니다.
 *
 * - **다시보기** (완료 · 볼 수 있는 리포트 `COMPLETED` · `PARTIAL`) — 리포트로 갑니다. 답변 영상 · 점수 · 답변 개선 방향이 거기 있습니다
 * - **분석하기** (완료 · 리포트 없음 또는 분석 실패) — 분석 중 화면으로 가면 분석을 등록하고 끝나면 리포트로 넘어갑니다.
 *   실패한 리포트는 서버가 같은 reportId 로 다시 받아 줍니다. 시안에 없는 경우라 시안의 버튼 모양을 따랐습니다
 * - **분석 중**인 리포트는 버튼이 없고 한 줄 설명에 "분석 중" 만 붙입니다. 분석 중 화면은 이 탭에서 등록한 리포트만
 *   이어 볼 수 있어서(다른 탭에서 열면 등록이 409 `REPORT_ALREADY_EXISTS` 로 막힘), 보내면 실패 화면이 뜹니다
 * - 중단한 세션은 서버가 목록에서 빼고 보냅니다(`SessionStatus.ABORTED`)
 *
 * 시안의 **이어하기**(진행 중)는 아직 두지 않습니다. 진행 중인 세션을 장치 테스트로 다시 보내면 실서버에서 어떻게
 * 되는지 확인되지 않았습니다 — 백엔드에 "이어서 보기" API 가 없고, AI 서버가 그 세션을 아직 들고 있는지에 달려
 * 있습니다. 첫 질문부터 다시 나오거나 연결이 끊기면 사용자가 헷갈려서, 백엔드와 확인한 뒤 엽니다. (PR #128 리뷰)
 * 그때까지 진행 중 세션은 중단한 세션처럼 버튼 없이 상태만 보입니다.
 *
 * 시안의 "영상 만료됨"(버튼 잠김)은 뺐습니다. 답변 영상을 언제까지 두는지 백엔드에 정해진 게 없어서(S3 보관 기간 ·
 * 만료 여부 필드 없음) 화면이 만료를 알 수 없습니다. 정해지면 이 자리에 상태를 하나 더합니다.
 */
function RowAction({ session }: { session: PracticeSession }) {
  const title = titleOf(session)

  if (session.status === 'COMPLETED' && session.reportStatus !== 'PROCESSING') {
    const to = session.reportId ? toReport(session.reportId) : toAnalyzing(session.sessionId)
    return (
      <Link to={to} className={`${ACTION_BASE} text-neutral-700`}>
        {session.reportId ? '다시보기' : '분석하기'}
        <IconPlayerPlay size={16} stroke={2} aria-hidden className="text-primary-500" />
        <span className="sr-only"> — {title}</span>
      </Link>
    )
  }

  return null
}

/**
 * 행 끝의 "폴더" 버튼. 폴더로 옮기거나 폴더에서 빼는 창을 엽니다 (이슈 #205).
 * 진행 중인 세션도 옮길 수 있습니다 — 서버는 중단된 세션만 막고, 중단된 세션은 목록에 오지 않습니다.
 */
function MoveAction({ session, onMove }: { session: PracticeSession; onMove?: (session: PracticeSession) => void }) {
  return (
    <button
      type="button"
      onClick={() => onMove?.(session)}
      disabled={!onMove}
      className={`${ACTION_BASE} text-neutral-500 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <IconFolderSymlink size={16} stroke={2} aria-hidden />
      폴더
      <span className="sr-only"> 옮기기 — {titleOf(session)}</span>
    </button>
  )
}

function renderBody(body: PracticeListBody, { onMove, showFolder }: RowOptions) {
  switch (body.kind) {
    case 'loading':
      return (
        <Notice>
          <p className="text-body-md text-neutral-500">연습 기록을 불러오는 중이에요…</p>
        </Notice>
      )
    case 'error':
      return (
        <Notice>
          <p className="text-body-md text-neutral-900">연습 기록을 불러오지 못했어요.</p>
          <p className="mt-1 text-body-sm text-neutral-500">{body.message}</p>
          <Button size="sm" onClick={body.onRetry} className="mt-4">
            다시 시도
          </Button>
        </Notice>
      )
    case 'empty':
      return (
        <Notice>
          <p className="text-body-md text-neutral-900">아직 연습 기록이 없어요.</p>
          <p className="mt-1 text-body-sm text-neutral-500">모의면접을 한 번 보면 여기에 기록이 쌓여요.</p>
          <Button variant="primary" size="sm" to={ROUTES.SESSION_SETUP} className="mt-4">
            새 연습 시작
          </Button>
        </Notice>
      )
    case 'empty-folder':
      return (
        <Notice>
          <p className="text-body-md text-neutral-900">이 폴더에 담긴 연습 기록이 없어요.</p>
        </Notice>
      )
    case 'no-match':
      return (
        <Notice>
          <p className="text-body-md text-neutral-900">조건에 맞는 연습 기록이 없어요.</p>
          <p className="mt-1 text-body-sm text-neutral-500">검색어나 탭을 바꿔보세요.</p>
        </Notice>
      )
    case 'rows':
      return body.sessions.map((session) => (
        <li key={session.sessionId} className="flex items-center gap-4 px-4 py-4 md:px-6">
          {/* 시안의 연보라 네모는 영상 썸네일 자리입니다. 썸네일 API 가 없어 아이콘으로 채웁니다 */}
          <span
            aria-hidden
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary-100 text-primary-400 sm:flex"
          >
            <IconVideo size={18} stroke={2} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-body-md font-semibold text-neutral-900">{titleOf(session)}</p>
              <span className="shrink-0">
                <Badge tone="brand">{session.round}회차</Badge>
              </span>
              {showFolder && session.folder && (
                <span className="flex min-w-0 max-w-48 shrink items-center gap-1 text-body-sm text-neutral-500">
                  <IconFolder size={14} stroke={2} aria-hidden className="shrink-0" />
                  <span className="sr-only">폴더</span>
                  <span className="truncate">{session.folder.name}</span>
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-body-sm text-neutral-500">{metaOf(session)}</p>
          </div>

          {/* "폴더" 를 맨 끝에 둡니다. 다시보기 · 분석하기가 없는 줄(진행 중 · 분석 중)도 같은 자리에 맞춰 보입니다 */}
          <div className="flex shrink-0 items-center gap-1">
            <RowAction session={session} />
            <MoveAction session={session} onMove={onMove} />
          </div>
        </li>
      ))
  }
}

/**
 * 연습 기록 목록입니다. 판과 아래 줄("n개 항목" · 페이지 넘김)은 자소서 · 포트폴리오와 같은 `ListCard` 이고,
 * 행은 시안대로 머리줄 없는 한 줄씩입니다.
 */
export default function PracticeList({ body, count, pagination, updating, onMove, showFolder }: Props) {
  return (
    <ListCard label="연습 기록 목록" count={count} pagination={pagination}>
      <ul
        aria-busy={updating || undefined}
        className={`divide-y divide-neutral-200 transition-opacity ${updating ? 'opacity-60' : ''}`}
      >
        {renderBody(body, { onMove, showFolder })}
      </ul>
    </ListCard>
  )
}
