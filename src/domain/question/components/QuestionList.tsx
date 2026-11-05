import { IconStar, IconStarFilled } from '@tabler/icons-react'
import type { ReactNode } from 'react'

import { ROUTES } from '@/app/routes'
import Button from '@/shared/ui/Button'
import ListCard from '@/shared/ui/ListCard'

import { metaOf } from '../lib/questionDisplay'
import type { Question } from '../types/question'

/** 목록 자리에 들어갈 것. 행이 아니면 한 줄짜리 안내입니다 */
export type QuestionListBody =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; onRetry: () => void }
  /** 질문이 하나도 없을 때. 모의면접을 보면 쌓입니다 */
  | { kind: 'empty' }
  /** "북마크" 탭인데 북마크한 질문이 없을 때 */
  | { kind: 'empty-bookmarks' }
  /** 질문은 있는데 검색에 걸리는 게 없을 때 */
  | { kind: 'no-match' }
  | { kind: 'rows'; questions: Question[] }

type Props = {
  body: QuestionListBody
  /** "n개 항목" — 거른 뒤의 전체 개수입니다. 이 쪽에 보이는 행 수가 아닙니다 */
  count: number
  pagination?: { page: number; totalPages: number; onChange: (page: number) => void }
  /** 새 조건의 목록을 받는 중이면 true. 이전 목록을 흐리게 둡니다 */
  updating: boolean
  /** 별이 켜져 있는지. 방금 누른 값이 목록이 준 값보다 먼저입니다 (useQuestionBookmarks) */
  isBookmarked: (question: Question) => boolean
  /** 서버에 보내는 중이면 true. 그 행의 별을 잠급니다 */
  isPending: (question: Question) => boolean
  onToggleBookmark: (question: Question) => void
}

function Notice({ children, focusTarget = false }: { children: ReactNode; focusTarget?: boolean }) {
  return (
    <li
      // 북마크를 마지막 하나까지 해제하면 포커스가 있던 행이 사라집니다. 그때 포커스를 받을 자리입니다 (QuestionBankPage)
      tabIndex={focusTarget ? -1 : undefined}
      data-question-empty={focusTarget ? '' : undefined}
      className="break-keep px-6 py-12 text-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500"
    >
      {children}
    </li>
  )
}

function renderBody({ body, isBookmarked, isPending, onToggleBookmark }: Props) {
  switch (body.kind) {
    case 'loading':
      return (
        <Notice>
          <p className="text-body-md text-neutral-500">질문을 불러오는 중이에요…</p>
        </Notice>
      )
    case 'error':
      return (
        <Notice>
          <p className="text-body-md text-neutral-900">질문을 불러오지 못했어요.</p>
          <p className="mt-1 text-body-sm text-neutral-500">{body.message}</p>
          <Button size="sm" onClick={body.onRetry} className="mt-4">
            다시 시도
          </Button>
        </Notice>
      )
    case 'empty':
      return (
        <Notice>
          <p className="text-body-md text-neutral-900">아직 쌓인 질문이 없어요.</p>
          <p className="mt-1 text-body-sm text-neutral-500">모의면접을 한 번 보면 나온 질문이 여기에 쌓여요.</p>
          <Button variant="primary" size="sm" to={ROUTES.SESSION_SETUP} className="mt-4">
            새 연습 시작
          </Button>
        </Notice>
      )
    case 'empty-bookmarks':
      return (
        <Notice focusTarget>
          <p className="text-body-md text-neutral-900">북마크한 질문이 없어요.</p>
          <p className="mt-1 text-body-sm text-neutral-500">다시 보고 싶은 질문의 별을 눌러 북마크해 보세요.</p>
        </Notice>
      )
    case 'no-match':
      return (
        <Notice>
          <p className="text-body-md text-neutral-900">조건에 맞는 질문이 없어요.</p>
          <p className="mt-1 text-body-sm text-neutral-500">검색어를 바꿔보세요.</p>
        </Notice>
      )
    case 'rows':
      return body.questions.map((question) => {
        const bookmarked = isBookmarked(question)

        return (
          <li key={question.questionId} className="flex items-center gap-4 px-4 py-4 md:px-6">
            <div className="min-w-0 flex-1">
              <p className="break-keep text-body-md font-semibold text-neutral-900">{question.text}</p>
              <p className="mt-0.5 truncate text-body-sm text-neutral-500">{metaOf(question)}</p>
            </div>

            <button
              type="button"
              onClick={() => onToggleBookmark(question)}
              // 해제한 행이 사라질 때 포커스를 이웃 행의 별로 옮기려고 찾는 표시입니다 (QuestionBankPage)
              data-question-star={question.questionId}
              aria-pressed={bookmarked}
              // `disabled` 로 잠그면 키보드로 누른 순간 포커스가 화면 밖으로 빠집니다. 서버에 보내는 동안의 연타는
              // `toggle` 이 막으니, 여기서는 상태만 알립니다 (shared/ui/Pagination 의 포커스 처리와 같은 이유).
              aria-disabled={isPending(question) || undefined}
              title="북마크"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-primary-500 aria-disabled:cursor-wait"
            >
              {bookmarked ? (
                <IconStarFilled size={20} aria-hidden className="text-primary-500" />
              ) : (
                <IconStar size={20} stroke={2} aria-hidden className="text-neutral-300" />
              )}
              {/* 켜짐 · 꺼짐은 aria-pressed 가 알립니다. 이름까지 "추가 · 해제" 로 바꾸면 "해제, 눌림" 처럼 거꾸로 읽힙니다 */}
              <span className="sr-only">북마크 — {question.text}</span>
            </button>
          </li>
        )
      })
  }
}

/**
 * 질문 은행 목록입니다. 판과 아래 줄("n개 항목" · 페이지 넘김)은 자소서 · 포트폴리오, 연습 기록과 같은 `ListCard` 이고,
 * 행은 시안대로 머리줄 없는 한 줄씩입니다 (질문 · 메타 · 오른쪽 별).
 */
export default function QuestionList(props: Props) {
  const { count, pagination, updating } = props

  return (
    <ListCard label="질문 목록" count={count} pagination={pagination}>
      <ul
        aria-busy={updating || undefined}
        className={`divide-y divide-neutral-200 transition-opacity ${updating ? 'opacity-60' : ''}`}
      >
        {renderBody(props)}
      </ul>
    </ListCard>
  )
}
