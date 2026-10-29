import { IconPlayerPlay, IconVideo } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES, toAnalyzing, toDeviceCheck, toReport } from '@/app/routes'
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
}

const ACTION_BASE =
  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-2 text-body-sm font-semibold transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-primary-500'

function Notice({ children }: { children: ReactNode }) {
  return <li className="break-keep px-6 py-12 text-center">{children}</li>
}

/**
 * 행 끝의 버튼. 세션 상태마다 할 수 있는 일이 다릅니다.
 *
 * - **다시보기** (완료 · 리포트 있음) — 리포트로 갑니다. 답변 영상 · 점수 · 개선 답변이 거기 있습니다
 * - **분석하기** (완료 · 리포트 없음) — 면접은 끝냈지만 분석 화면에서 나가 리포트를 맡기지 않은 세션입니다. 분석 중
 *   화면으로 가면 분석을 등록하고 끝나면 리포트로 넘어갑니다. 시안에 없는 경우라 시안의 버튼 모양을 따랐습니다
 * - **이어하기** (진행 중) — 그 세션의 장치 테스트로 갑니다. ⚠️ 백엔드에 "이어서 보기" API 가 없어서, 목업에서는
 *   첫 질문부터 다시 나옵니다. 실제 서버에 붙이면 AI 서버가 그 세션을 아직 들고 있는지에 달려 있습니다
 * - 중단한 세션은 버튼이 없습니다. 리포트를 만들지 않는 세션입니다(`SessionStatus.ABORTED`)
 *
 * 시안의 "영상 만료됨"(버튼 잠김)은 뺐습니다. 답변 영상을 언제까지 두는지 백엔드에 정해진 게 없어서(S3 보관 기간 ·
 * 만료 여부 필드 없음) 화면이 만료를 알 수 없습니다. 정해지면 이 자리에 상태를 하나 더합니다.
 */
function RowAction({ session }: { session: PracticeSession }) {
  const title = titleOf(session)

  if (session.status === 'IN_PROGRESS') {
    return (
      <Link to={toDeviceCheck(session.sessionId)} className={`${ACTION_BASE} text-primary-500`}>
        이어하기
        <IconPlayerPlay size={16} stroke={2} aria-hidden />
        <span className="sr-only"> — {title}</span>
      </Link>
    )
  }

  if (session.status === 'COMPLETED') {
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

function renderBody(body: PracticeListBody) {
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
            </div>
            <p className="mt-0.5 truncate text-body-sm text-neutral-500">{metaOf(session)}</p>
          </div>

          <RowAction session={session} />
        </li>
      ))
  }
}

/**
 * 연습 기록 목록입니다. 판과 아래 줄("n개 항목" · 페이지 넘김)은 자소서 · 포트폴리오와 같은 `ListCard` 이고,
 * 행은 시안대로 머리줄 없는 한 줄씩입니다.
 */
export default function PracticeList({ body, count, pagination, updating }: Props) {
  return (
    <ListCard label="연습 기록 목록" count={count} pagination={pagination}>
      <ul
        aria-busy={updating || undefined}
        className={`divide-y divide-neutral-200 transition-opacity ${updating ? 'opacity-60' : ''}`}
      >
        {renderBody(body)}
      </ul>
    </ListCard>
  )
}
