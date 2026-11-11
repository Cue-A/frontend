import { useBookmarkHint } from '../hooks/useBookmarkHint'
import { useQuestionBookmark } from '../hooks/useQuestionBookmark'
import type { Question } from '../types/interview'

import BookmarkBubble from './BookmarkBubble'
import BookmarkButton from './BookmarkButton'
import AnswerDelayNotice from './AnswerDelayNotice'
import CaptionLine from './CaptionLine'
import LoadingLine from './LoadingLine'
import QuestionNumberLabel from './QuestionNumberLabel'
import QuestionText from './QuestionText'
import QuestionTypeBadge from './QuestionTypeBadge'

type Props = {
  question: Question
  hideQuestionText: boolean
  /** 북마크 요청 경로(`/api/interviews/{sessionId}/questions/...`)에 쓴다. */
  sessionId: string
  /** 카드 안 한 줄 자막을 보일지. 자막을 카메라 아래 박스로 보여주는 배치에서는 false. */
  showCaptionLine?: boolean
  /** 답변 제출 후 진행 문구. 있으면 자막 대신 그 자리에 가운데 정렬로 보여준다(자막은 바로 숨긴다). */
  loadingLabel?: string | null
  /** 답변 처리가 오래 걸리는 중. true 면 진행 문구(loadingLabel) 아래에 지연 안내를 덧붙인다. */
  delayed?: boolean
  /** 첫 질문의 제시 · 답변 중 true. 북마크 버튼 옆에 "저장할 수 있다"는 안내 말풍선을 한 번 보여준다. */
  bookmarkHintEligible?: boolean
  caption?: string | null
  captionSupported?: boolean
  captionUsesSelectedMic?: boolean
}

const BOOKMARK_NOTICE_TEXT = {
  saved: '질문 은행에 저장했어요',
  removed: '북마크를 해제했어요',
} as const

export default function QuestionCard({
  question,
  hideQuestionText,
  sessionId,
  showCaptionLine = false,
  loadingLabel = null,
  delayed = false,
  bookmarkHintEligible = false,
  caption = null,
  captionSupported = true,
  captionUsesSelectedMic = true,
}: Props) {
  const bookmark = useQuestionBookmark(sessionId, question.questionId)
  const bookmarkHint = useBookmarkHint(bookmarkHintEligible)

  // 확인 문구가 안내보다 먼저다 — 방금 누른 결과를 알려주는 쪽이 더 급하다.
  const bubbleText = bookmark.notice
    ? BOOKMARK_NOTICE_TEXT[bookmark.notice]
    : bookmarkHint.visible
      ? '마음에 드는 질문은 북마크해 두면 질문 은행에서 다시 볼 수 있어요'
      : null

  const handleBookmarkClick = () => {
    bookmarkHint.dismiss()
    bookmark.toggle()
  }

  return (
    // TODO(design-token): design-system.md에 없는 값. 임시로 radius-lg(20px) 사용 중.
    // 필요한 값: 질문 카드 모서리 24px (Figma 848:5, 문서엔 radius-lg(20px)까지만 정의됨)
    // 그라디언트 배경 위라 카드는 살짝 투명한 흰색이다(80%) — 배경 그라디언트와 어우러지게 한다.
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-lg bg-stage-card px-8 py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <QuestionNumberLabel questionNumber={question.questionNumber} />
          <QuestionTypeBadge questionType={question.questionType} />
        </div>

        <div className="flex items-center gap-3">
          {bubbleText && <BookmarkBubble>{bubbleText}</BookmarkBubble>}
          <BookmarkButton bookmarked={bookmark.bookmarked} pending={bookmark.pending} onClick={handleBookmarkClick} />
        </div>
      </div>

      <QuestionText questionType={question.questionType} text={question.text} hideQuestionText={hideQuestionText} />

      {bookmark.error && (
        <p role="alert" className="text-body-sm text-semantic-danger">
          {bookmark.error}
        </p>
      )}

      {loadingLabel ? (
        delayed ? (
          <AnswerDelayNotice label={loadingLabel} />
        ) : (
          <LoadingLine label={loadingLabel} />
        )
      ) : (
        showCaptionLine && (
          <CaptionLine caption={caption} isSupported={captionSupported} usesSelectedMic={captionUsesSelectedMic} />
        )
      )}
    </section>
  )
}
