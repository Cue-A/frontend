import { IconPlus } from '@tabler/icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { toUserMessage } from '@/shared/api/errorMessage'
import Button from '@/shared/ui/Button'
import SearchField from '@/shared/ui/SearchField'
import SegmentedTabs from '@/shared/ui/SegmentedTabs'

import { MAX_BOOKMARK_COUNT } from '../api/questionApi'
import { useBookmarks } from '../hooks/useBookmarks'
import { useCommonQuestions } from '../hooks/useCommonQuestions'
import {
  bookmarkKey,
  filterBookmarks,
  filterCommon,
  QUESTION_TAB_LABEL,
  summarize,
  summarizeCommon,
} from '../lib/questionDisplay'
import type { BookmarkedQuestion, CommonQuestion, QuestionTab } from '../types/question'

import BookmarkRemoveDialog from './BookmarkRemoveDialog'
import QuestionList, { type QuestionListBody } from './QuestionList'
import QuestionTopBar from './QuestionTopBar'

/**
 * 북마크 카드를 빼면 포커스가 있던 버튼이 사라집니다. 포커스가 화면 밖(`body`)으로 빠지면 키보드 사용자가 Tab 을
 * 맨 처음부터 다시 눌러야 해서, 사라진 뒤에 옮길 곳을 빼는 순간 정해 둡니다.
 * - `card` 이웃 카드(다음 카드, 없으면 이전 카드)의 빼기 버튼
 * - `empty` 남은 카드가 없을 때의 "북마크한 질문이 없어요" 안내
 * - `favorite` 공통 질문에서 즐겨찾기를 누르면 그 카드가 맨 위로 옮겨 가면서 포커스가 풀립니다. 그 카드의 별로 돌립니다
 */
type FocusRequest = { kind: 'card'; key: string } | { kind: 'empty' } | { kind: 'favorite'; questionId: string }

/** 해제 안내를 보여주는 시간. 다른 탭으로 옮기거나 새 동작을 하면 바로 사라집니다 */
const NOTICE_MS = 4000

const GONE_NOTICE = '이미 해제된 북마크예요. 목록에서 지웠어요.'

/**
 * 내 보관함 > 질문 은행. (이슈 #138 → 북마크 개편)
 *
 * 탭은 **내 북마크 · 공통 질문** 이고 북마크가 먼저입니다. 면접 중에 북마크한 질문(꼬리질문 · 되묻기는 원질문과 함께)에
 * 메모를 달고, 필요 없어진 질문은 확인을 거쳐 뺍니다. 빼면 다시 담을 수 없어서 확인 창이 먼저 뜹니다
 * (BookmarkRemoveDialog).
 *
 * 공통 질문은 별(즐겨찾기)을 누르면 그 질문이 바로 맨 위로 올라가고, 북마크와 같은 메모를 달 수 있습니다. 즐겨찾기는 풀어도
 * 다시 누를 수 있어서 확인 창이 없습니다.
 *
 * 서버에 검색이 없어서 북마크를 전부 받아 두고(`useBookmarks`) 검색은 화면이 합니다. 그래서 쪽 나누기도 없고,
 * 빼기 · 메모 저장은 서버가 성공한 뒤 받아 둔 목록을 바로 고칩니다.
 *
 * "+ 질문 추가" 는 기획이 정해지지 않아 자리만 두고 잠가 뒀습니다.
 */
export default function QuestionBankPage() {
  const [tab, setTab] = useState<QuestionTab>('BOOKMARKED')
  const [query, setQuery] = useState('')
  const [removing, setRemoving] = useState<BookmarkedQuestion | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const bookmarks = useBookmarks()
  const common = useCommonQuestions()

  const focusRequestRef = useRef<FocusRequest | null>(null)

  const shownBookmarks = useMemo(
    () => (bookmarks.status === 'ready' ? filterBookmarks(bookmarks.bookmarks, query) : []),
    [bookmarks, query],
  )
  const shownCommon = useMemo(
    () => (common.status === 'ready' ? filterCommon(common.questions, query) : []),
    [common, query],
  )

  // 카드가 사라진 **그 그림 다음에** 포커스를 옮겨야 해서 effect 에 둡니다.
  useEffect(() => {
    const request = focusRequestRef.current
    if (!request) return
    focusRequestRef.current = null

    if (request.kind === 'card') {
      document.querySelector<HTMLElement>(`[data-bookmark-remove="${CSS.escape(request.key)}"]`)?.focus()
    } else if (request.kind === 'favorite') {
      document.querySelector<HTMLElement>(`[data-common-favorite="${CSS.escape(request.questionId)}"]`)?.focus()
    } else {
      document.querySelector<HTMLElement>('[data-question-empty]')?.focus()
    }
  }, [bookmarks, common])

  // 안내는 잠깐만 보여줍니다. 계속 남아 있으면 다른 탭에서도 지난 동작의 결과가 떠 있는 것처럼 읽힙니다
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), NOTICE_MS)
    return () => window.clearTimeout(timer)
  }, [notice])

  const changeTab = (next: QuestionTab) => {
    setNotice(null)
    setTab(next)
  }

  const handleToggleFavorite = (question: CommonQuestion) => {
    // 이미 서버에 보내는 중이면 훅이 무시합니다. 그때는 포커스를 옮길 일도 없습니다
    if (!common.isFavoritePending(question)) {
      focusRequestRef.current = { kind: 'favorite', questionId: question.questionId }
    }
    common.toggleFavorite(question)
  }

  const askRemove = (bookmark: BookmarkedQuestion) => {
    setNotice(null)
    setRemoving(bookmark)
  }

  // 빼는 카드의 이웃을 지금 보이는 목록에서 골라 둡니다(검색 중이면 검색 결과 안에서)
  const rememberNeighbor = (bookmark: BookmarkedQuestion) => {
    const index = shownBookmarks.findIndex((item) => bookmarkKey(item) === bookmarkKey(bookmark))
    const neighbor = shownBookmarks[index + 1] ?? shownBookmarks[index - 1]
    focusRequestRef.current = neighbor ? { kind: 'card', key: bookmarkKey(neighbor) } : { kind: 'empty' }
  }

  const handleRemoved = (bookmark: BookmarkedQuestion) => {
    rememberNeighbor(bookmark)
    bookmarks.removeLocal(bookmark)
    setNotice('북마크를 해제했어요.')
  }

  const handleGone = (bookmark: BookmarkedQuestion) => {
    rememberNeighbor(bookmark)
    bookmarks.removeLocal(bookmark)
    setNotice(GONE_NOTICE)
  }

  let body: QuestionListBody
  if (tab === 'BOOKMARKED') {
    if (bookmarks.status === 'loading') {
      body = { kind: 'loading' }
    } else if (bookmarks.status === 'error') {
      body = { kind: 'error', message: toUserMessage(bookmarks.error.code), onRetry: bookmarks.reload }
    } else if (shownBookmarks.length > 0) {
      body = { kind: 'bookmarks', bookmarks: shownBookmarks }
    } else if (bookmarks.bookmarks.length > 0) {
      body = { kind: 'no-match' }
    } else {
      body = { kind: 'empty-bookmarks', onShowCommon: () => changeTab('COMMON') }
    }
  } else if (common.status === 'loading') {
    body = { kind: 'loading' }
  } else if (common.status === 'error') {
    body = { kind: 'error', message: toUserMessage(common.error.code), onRetry: common.reload }
  } else if (shownCommon.length > 0) {
    body = { kind: 'common', questions: shownCommon }
  } else if (common.questions.length > 0) {
    body = { kind: 'no-match' }
  } else {
    body = { kind: 'empty-common' }
  }

  // 탭 이름 뒤에 개수를 붙입니다. 아직 받는 중이거나 실패했으면 붙이지 않습니다
  const tabOptions = (['BOOKMARKED', 'COMMON'] as const).map((value) => {
    const count =
      value === 'BOOKMARKED'
        ? bookmarks.status === 'ready'
          ? bookmarks.bookmarks.length
          : null
        : common.status === 'ready'
          ? common.questions.length
          : null
    return { value, label: count === null ? QUESTION_TAB_LABEL[value] : `${QUESTION_TAB_LABEL[value]} ${count}` }
  })

  const bookmarkSummary =
    bookmarks.status === 'ready' && bookmarks.bookmarks.length > 0 ? summarize(bookmarks.bookmarks) : null
  const commonSummary = common.status === 'ready' && common.questions.length > 0 ? summarizeCommon(common.questions) : null

  return (
    // 1248px = 자소서 · 포트폴리오, 연습 기록과 같은 본문 폭입니다
    <div className="mx-auto flex w-full max-w-312 flex-col gap-6">
      <QuestionTopBar />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 lg:flex-1">
          <h1 className="text-h1 text-neutral-900">질문 은행</h1>
          <p className="mt-2 break-keep text-body-md text-neutral-500">
            자주 나오는 공통 질문과 내가 북마크한 질문을 모아 보고, 다음 연습에 활용해요
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 lg:items-end">
          <Button variant="primary" size="sm" disabled className="whitespace-nowrap">
            <IconPlus size={16} stroke={2} aria-hidden />
            질문 추가
          </Button>
          {/* 비활성 버튼의 이유는 글로 적습니다 (docs/01-conventions.md). */}
          <p className="break-keep text-body-sm text-neutral-500">질문을 직접 추가하는 기능은 준비 중이에요.</p>
        </div>
      </div>

      <SearchField
        label="질문 검색"
        placeholder="질문 검색 (직무 · 기업 · 키워드)"
        value={query}
        onChange={setQuery}
        className="w-full"
      />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <SegmentedTabs label="질문 종류" options={tabOptions} value={tab} onChange={changeTab} />
        {tab === 'BOOKMARKED' && bookmarkSummary && (
          <p className="text-body-sm text-neutral-500">
            메모 {bookmarkSummary.memoCount}개 · 꼬리질문 {bookmarkSummary.followupCount}개
            {bookmarkSummary.reaskCount > 0 && ` · 되묻기 ${bookmarkSummary.reaskCount}개`}
          </p>
        )}
        {tab === 'COMMON' && commonSummary && (
          <p className="text-body-sm text-neutral-500">
            즐겨찾기 {commonSummary.favoriteCount}개 · 메모 {commonSummary.memoCount}개
          </p>
        )}
      </div>

      {tab === 'BOOKMARKED' && bookmarks.status === 'ready' && bookmarks.truncated && (
        <p className="text-body-sm text-neutral-500">
          북마크가 많아 최근 {MAX_BOOKMARK_COUNT}개까지만 보여요. 검색도 이 안에서 해요.
        </p>
      )}

      {notice && (
        <p role="status" className="text-body-sm text-badge-success-text">
          {notice}
        </p>
      )}

      {tab === 'COMMON' && common.favoriteError && (
        <p role="alert" className="text-body-sm text-semantic-danger">
          {common.favoriteError}
        </p>
      )}

      <QuestionList
        body={body}
        onRemoveBookmark={askRemove}
        onMemoSaved={bookmarks.setMemoLocal}
        onToggleFavorite={handleToggleFavorite}
        isFavoritePending={common.isFavoritePending}
        onCommonMemoSaved={common.setMemoLocal}
      />

      {removing && (
        <BookmarkRemoveDialog
          bookmark={removing}
          onRemoved={handleRemoved}
          onGone={handleGone}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  )
}
