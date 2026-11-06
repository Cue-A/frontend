import { IconBookmarkFilled, IconStar, IconStarFilled } from '@tabler/icons-react'
import type { ReactNode } from 'react'

import { ROUTES } from '@/app/routes'
import Button from '@/shared/ui/Button'

import { BOOKMARK_TYPE_LABEL, bookmarkKey, metaOfBookmark, metaOfCommon } from '../lib/questionDisplay'
import type { BookmarkedQuestion, CommonQuestion } from '../types/question'

import BookmarkMemo from './BookmarkMemo'
import CommonMemo from './CommonMemo'
import QuestionCard from './QuestionCard'

/** 목록 자리에 들어갈 것. 카드가 아니면 한 줄짜리 안내입니다 */
export type QuestionListBody =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; onRetry: () => void }
  /** 북마크가 하나도 없을 때. 면접 중 질문의 북마크 아이콘을 누르면 쌓입니다 */
  | { kind: 'empty-bookmarks'; onShowCommon: () => void }
  /** 공통 질문이 하나도 없을 때 */
  | { kind: 'empty-common' }
  /** 질문은 있는데 검색에 걸리는 게 없을 때 */
  | { kind: 'no-match' }
  | { kind: 'bookmarks'; bookmarks: BookmarkedQuestion[] }
  | { kind: 'common'; questions: CommonQuestion[] }

type Props = {
  body: QuestionListBody
  /** 북마크 카드의 해제 버튼. 확인 모달은 화면이 엽니다 */
  onRemoveBookmark: (bookmark: BookmarkedQuestion) => void
  onMemoSaved: (bookmark: BookmarkedQuestion, memo: string | null) => void
  /** 공통 질문의 즐겨찾기 별. 누르면 그 질문이 바로 맨 위로 올라갑니다 */
  onToggleFavorite: (question: CommonQuestion) => void
  /** 서버에 보내는 중이면 true. 그 카드의 별을 잠급니다 */
  isFavoritePending: (question: CommonQuestion) => boolean
  onCommonMemoSaved: (question: CommonQuestion, memo: string | null) => void
}

function Notice({ children, focusTarget = false }: { children: ReactNode; focusTarget?: boolean }) {
  return (
    <li
      // 북마크를 마지막 하나까지 빼면 포커스가 있던 카드가 사라집니다. 그때 포커스를 받을 자리입니다 (QuestionBankPage)
      tabIndex={focusTarget ? -1 : undefined}
      data-question-empty={focusTarget ? '' : undefined}
      className="break-keep rounded-lg bg-neutral-0 px-6 py-12 text-center shadow-card focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500"
    >
      {children}
    </li>
  )
}

function renderBody({
  body,
  onRemoveBookmark,
  onMemoSaved,
  onToggleFavorite,
  isFavoritePending,
  onCommonMemoSaved,
}: Props) {
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
    case 'empty-bookmarks':
      return (
        <Notice focusTarget>
          <p className="text-body-md text-neutral-900">아직 북마크한 질문이 없어요.</p>
          <p className="mt-1 text-body-sm text-neutral-500">
            면접을 보면서 질문의 북마크 아이콘을 누르면 여기에 모여요.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="primary" size="sm" to={ROUTES.SESSION_SETUP}>
              새 연습 시작
            </Button>
            <Button size="sm" onClick={body.onShowCommon}>
              공통 질문 보기
            </Button>
          </div>
        </Notice>
      )
    case 'empty-common':
      return (
        <Notice>
          <p className="text-body-md text-neutral-900">공통 질문이 아직 없어요.</p>
        </Notice>
      )
    case 'no-match':
      return (
        // 검색 결과의 마지막 카드를 빼면 남은 북마크는 검색에 안 걸려서 이 안내가 보입니다. 포커스를 받을 자리입니다
        <Notice focusTarget>
          <p className="text-body-md text-neutral-900">조건에 맞는 질문이 없어요.</p>
          <p className="mt-1 text-body-sm text-neutral-500">검색어를 바꿔보세요.</p>
        </Notice>
      )
    case 'bookmarks':
      return body.bookmarks.map((bookmark) => (
        <li key={bookmarkKey(bookmark)}>
          <QuestionCard
            badge={BOOKMARK_TYPE_LABEL[bookmark.type]}
            meta={metaOfBookmark(bookmark)}
            originalText={bookmark.originalText}
            text={bookmark.text}
            action={
              <button
                type="button"
                onClick={() => onRemoveBookmark(bookmark)}
                // 빼고 나면 이 카드가 사라집니다. 포커스를 이웃 카드의 버튼으로 옮기려고 찾는 표시입니다 (QuestionBankPage)
                data-bookmark-remove={bookmarkKey(bookmark)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-primary-500 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-primary-500"
              >
                <IconBookmarkFilled size={20} aria-hidden />
                <span className="sr-only">북마크 해제 — {bookmark.text}</span>
              </button>
            }
            footer={<BookmarkMemo bookmark={bookmark} onSaved={onMemoSaved} />}
          />
        </li>
      ))
    case 'common':
      return body.questions.map((question) => (
        <li key={question.questionId}>
          <QuestionCard
            meta={metaOfCommon(question)}
            text={question.text}
            action={
              <button
                type="button"
                onClick={() => onToggleFavorite(question)}
                // 누르면 카드가 맨 위로 옮겨 가면서 포커스가 풀립니다. 다시 이 별로 돌리려고 찾는 표시입니다 (QuestionBankPage)
                data-common-favorite={question.questionId}
                aria-pressed={question.favorite}
                // `disabled` 로 잠그면 키보드로 누른 순간 포커스가 화면 밖으로 빠집니다. 서버에 보내는 동안의 연타는
                // 훅이 막으니 여기서는 상태만 알립니다 (shared/ui/Pagination 의 포커스 처리와 같은 이유).
                aria-disabled={isFavoritePending(question) || undefined}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-primary-500 aria-disabled:cursor-wait"
              >
                {question.favorite ? (
                  <IconStarFilled size={20} aria-hidden className="text-primary-500" />
                ) : (
                  <IconStar size={20} stroke={2} aria-hidden className="text-neutral-300" />
                )}
                {/* 켜짐 · 꺼짐은 aria-pressed 가 알립니다. 이름까지 "추가 · 해제" 로 바꾸면 "해제, 눌림" 처럼 거꾸로 읽힙니다 */}
                <span className="sr-only">즐겨찾기 — {question.text}</span>
              </button>
            }
            footer={<CommonMemo question={question} onSaved={onCommonMemoSaved} />}
          />
        </li>
      ))
  }
}

/** 질문 은행 목록입니다. 시안대로 카드가 한 장씩 떠 있고, 전부 받아 두고 보여주니 쪽 나누기는 없습니다 */
export default function QuestionList(props: Props) {
  return (
    <ul aria-label="질문 목록" className="flex flex-col gap-3">
      {renderBody(props)}
    </ul>
  )
}
