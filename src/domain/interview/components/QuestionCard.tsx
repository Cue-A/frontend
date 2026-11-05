import { useQuestionBookmark } from '../hooks/useQuestionBookmark'
import type { Question } from '../types/interview'

import BookmarkButton from './BookmarkButton'
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
  caption?: string | null
  captionSupported?: boolean
}

export default function QuestionCard({
  question,
  hideQuestionText,
  sessionId,
  showCaptionLine = false,
  loadingLabel = null,
  caption = null,
  captionSupported = true,
}: Props) {
  const bookmark = useQuestionBookmark(sessionId, question.questionId)

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

        <BookmarkButton bookmarked={bookmark.bookmarked} pending={bookmark.pending} onClick={bookmark.toggle} />
      </div>

      <QuestionText questionType={question.questionType} text={question.text} hideQuestionText={hideQuestionText} />

      {bookmark.error && (
        <p role="alert" className="text-body-sm text-semantic-danger">
          {bookmark.error}
        </p>
      )}

      {loadingLabel ? (
        <LoadingLine label={loadingLabel} />
      ) : (
        showCaptionLine && <CaptionLine caption={caption} isSupported={captionSupported} />
      )}
    </section>
  )
}
