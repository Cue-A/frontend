import { IconPlus } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'

import { toUserMessage } from '@/shared/api/errorMessage'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import Button from '@/shared/ui/Button'
import SearchField from '@/shared/ui/SearchField'
import SegmentedTabs from '@/shared/ui/SegmentedTabs'

import { useQuestionBookmarks } from '../hooks/useQuestionBookmarks'
import { useQuestions } from '../hooks/useQuestions'
import { QUESTION_PAGE_SIZE, QUESTION_TABS } from '../lib/questionDisplay'
import type { Question, QuestionTab } from '../types/question'

import QuestionList, { type QuestionListBody } from './QuestionList'
import QuestionTopBar from './QuestionTopBar'

/** 검색어를 다 칠 때까지 기다리는 시간. 글자마다 서버에 묻지 않으려는 것입니다 */
const SEARCH_DELAY_MS = 300

/**
 * "북마크" 탭에서 해제하면 포커스가 있던 행이 사라집니다. 포커스가 화면 밖(`body`)으로 빠지면 키보드 사용자가 Tab 을
 * 맨 처음부터 다시 눌러야 해서, 사라진 뒤에 옮길 곳을 해제하는 순간 정해 둡니다.
 * - `row` 이웃 행(다음 행, 없으면 이전 행)의 별
 * - `empty` 남은 행이 없을 때의 "북마크한 질문이 없어요" 안내
 * - `last` 그 쪽이 비어 앞쪽으로 돌아갔을 때 앞쪽의 마지막 행. 앞쪽을 받아 올 때까지 기다립니다
 */
type FocusRequest =
  | { kind: 'row'; questionId: string }
  | { kind: 'empty' }
  | { kind: 'last'; page: number; filterKey: string }

function focusStar(questionId: string) {
  document.querySelector<HTMLElement>(`[data-question-star="${CSS.escape(questionId)}"]`)?.focus()
}

/**
 * 내 보관함 > 질문 은행. (이슈 #138)
 *
 * 기본으로 들어 있는 공통 질문과 모의면접에서 나온 질문을 한곳에서 보고, 다시 보고 싶은 질문은 별을 눌러 북마크합니다.
 * 탭은 전체 · 공통 질문 · 북마크이고, 검색은 질문 문장에서 찾습니다. 목록은 최신순입니다. "북마크" 탭에서 별을 꺼서
 * 해제하면 그 질문은 목록에서 바로 사라집니다.
 *
 * 만드는 방식은 연습 기록(PracticeRecordsPage)을 따랐습니다 — 질문은 면접마다 쌓이기만 해서 상한이 없으니, 탭 · 검색
 * · 쪽 나누기를 서버에 맡기고 조건이 바뀔 때마다 다시 받습니다. 패널 없이 사이드바 하위 메뉴(SideNav)를 쓰고 본문을
 * 1248px 로 묶어 가운데에 두는 것도 같습니다.
 *
 * **백엔드에 질문 은행 API 가 없어서 목업으로만 동작합니다** (questionApi.ts). "+ 질문 추가" 는 기획이 정해지지 않아
 * 자리만 두고 잠가 뒀습니다.
 */
export default function QuestionBankPage() {
  const [tab, setTab] = useState<QuestionTab>('ALL')
  const [query, setQuery] = useState('')

  const keyword = useDebouncedValue(query, SEARCH_DELAY_MS)

  // 조건을 바꾸면 첫 쪽부터 봅니다. 3쪽을 보다가 탭을 바꿨는데 그 탭에 1쪽뿐이면 빈 목록이 됩니다.
  // 쪽 번호는 그 쪽을 고른 조건과 함께 들고 있다가, 조건이 달라지면 0 으로 봅니다. 검색어는 **0.3초 늦게 반영된 값**
  // (`keyword`)을 기준으로 삼습니다 — 칠 때 바로 0 으로 돌리면 "이전 검색어 + 1쪽" 요청이 한 번 더 나갑니다.
  const filterKey = JSON.stringify([tab, keyword.trim()])
  const [paging, setPaging] = useState({ filterKey, page: 0 })
  const page = paging.filterKey === filterKey ? paging.page : 0
  const changePage = (next: number) => setPaging({ filterKey, page: next })

  const questions = useQuestions({ tab, keyword, page, size: QUESTION_PAGE_SIZE })

  // 지금 쪽에 남아 있는 행 수. 해제 요청이 성공한 **뒤에** 읽어야 해서 ref 에 둡니다 (아래 handleRemoved)
  const visibleCountRef = useRef(0)
  const focusRequestRef = useRef<FocusRequest | null>(null)

  // "북마크" 탭에서 해제하면 그 질문은 서버 목록에서도 빠집니다. 개수 · 쪽 수를 맞추려고 뒤에서 다시 받습니다.
  // 해제한 행이 그 쪽의 마지막이었고 앞쪽이 있으면, 비어 버린 쪽 대신 앞쪽으로 갑니다.
  const handleRemoved = () => {
    if (tab !== 'BOOKMARKED') return
    if (page > 0 && visibleCountRef.current === 0) {
      focusRequestRef.current = { kind: 'last', page: page - 1, filterKey }
      changePage(page - 1)
    } else {
      questions.refresh()
    }
  }
  const bookmarks = useQuestionBookmarks({ onRemoved: handleRemoved })

  // "북마크" 탭에서는 방금 해제한 질문을 바로 뺍니다. 서버가 거절하면 값이 되돌아와서 다시 나타납니다.
  // 다시 받기 전까지 "n개 항목" 이 어긋나지 않게, 뺀 만큼 개수에서도 뺍니다.
  // 거르는 기준은 지금 탭이 아니라 **들고 있는 목록을 받아 온 탭**입니다. 탭을 바꿔서 새 목록을 받는 동안 화면에는
  // 앞 탭의 흐린 목록이 남는데, 그걸 거르면 "n개 항목" 이 엉뚱하게 줄고 "북마크한 질문이 없어요" 가 잠깐 비칩니다.
  const loaded = questions.status === 'ready' ? questions.page.questions : []
  const shown =
    questions.status === 'ready' && questions.loadedTab === 'BOOKMARKED' ? loaded.filter(bookmarks.isBookmarked) : loaded
  const removedCount = loaded.length - shown.length

  const handleToggleBookmark = (question: Question) => {
    // 북마크 탭에서 해제하면 이 행이 사라집니다. 사라지기 전에 포커스를 옮길 곳을 정합니다.
    const removing =
      questions.status === 'ready' &&
      questions.loadedTab === 'BOOKMARKED' &&
      bookmarks.isBookmarked(question) &&
      !bookmarks.isPending(question)
    if (removing) {
      const index = shown.findIndex((item) => item.questionId === question.questionId)
      const neighbor = shown[index + 1] ?? shown[index - 1]
      focusRequestRef.current = neighbor ? { kind: 'row', questionId: neighbor.questionId } : { kind: 'empty' }
    }
    bookmarks.toggle(question)
  }

  // 화면을 다시 그릴 때마다 돕니다. 해제한 행이 사라진 **그 그림 다음에** 포커스를 옮겨야 해서 effect 에 둡니다.
  useEffect(() => {
    visibleCountRef.current = shown.length

    const request = focusRequestRef.current
    if (!request) return

    if (request.kind === 'last') {
      // 앞쪽을 받아 올 때까지 기다립니다. 그 사이 조건을 바꿨거나 받기에 실패했으면 그만둡니다.
      if (request.filterKey !== filterKey || questions.status === 'error') {
        focusRequestRef.current = null
        return
      }
      if (page !== request.page || questions.status !== 'ready' || questions.updating || shown.length === 0) return

      focusRequestRef.current = null
      focusStar(shown[shown.length - 1].questionId)
      return
    }

    focusRequestRef.current = null
    if (request.kind === 'row') focusStar(request.questionId)
    else document.querySelector<HTMLElement>('[data-question-empty]')?.focus()
  })

  let body: QuestionListBody
  if (questions.status === 'loading') {
    body = { kind: 'loading' }
  } else if (questions.status === 'error') {
    body = { kind: 'error', message: toUserMessage(questions.error.code), onRetry: questions.reload }
  } else if (shown.length > 0) {
    body = { kind: 'rows', questions: shown }
  } else if (keyword.trim()) {
    body = { kind: 'no-match' }
  } else if (tab === 'BOOKMARKED') {
    body = { kind: 'empty-bookmarks' }
  } else {
    body = { kind: 'empty' }
  }

  const ready = questions.status === 'ready'

  return (
    // 1248px = 자소서 · 포트폴리오, 연습 기록과 같은 본문 폭입니다
    <div className="mx-auto flex w-full max-w-312 flex-col gap-6">
      <QuestionTopBar />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 lg:flex-1">
          <h1 className="text-h1 text-neutral-900">질문 은행</h1>
          <p className="mt-2 break-keep text-body-md text-neutral-500">
            기본 공통 질문과 모의면접에서 나온 질문을 모아 봤어요. 다시 보고 싶은 질문은 북마크해 두세요.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 lg:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <SearchField label="질문 검색" value={query} onChange={setQuery} />
            <Button variant="primary" size="sm" disabled className="whitespace-nowrap">
              <IconPlus size={16} stroke={2} aria-hidden />
              질문 추가
            </Button>
          </div>
          {/* 비활성 버튼의 이유는 글로 적습니다 (docs/01-conventions.md). */}
          <p className="break-keep text-body-sm text-neutral-500">질문을 직접 추가하는 기능은 준비 중이에요.</p>
        </div>
      </div>

      <SegmentedTabs label="질문 종류" options={QUESTION_TABS} value={tab} onChange={setTab} />

      {bookmarks.error && (
        <p role="alert" className="text-body-sm text-semantic-danger">
          {bookmarks.error}
        </p>
      )}

      <QuestionList
        body={body}
        count={ready ? Math.max(questions.page.totalElements - removedCount, 0) : 0}
        pagination={
          ready ? { page: questions.page.page, totalPages: questions.page.totalPages, onChange: changePage } : undefined
        }
        updating={ready && questions.updating}
        isBookmarked={bookmarks.isBookmarked}
        isPending={bookmarks.isPending}
        onToggleBookmark={handleToggleBookmark}
      />
    </div>
  )
}
