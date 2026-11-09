import { useSaveBookmarkMemo } from '../hooks/useSaveBookmarkMemo'
import type { BookmarkedQuestion } from '../types/question'

import QuestionMemo from './QuestionMemo'

type Props = {
  bookmark: BookmarkedQuestion
  /** 서버가 저장한 메모(지웠으면 null)로 목록의 그 줄을 바꿉니다 */
  onSaved: (bookmark: BookmarkedQuestion, memo: string | null) => void
}

/** 북마크 카드 아래의 메모입니다. 저장은 `PATCH /api/bookmarks/{sessionId}/{questionId}` 입니다 */
export default function BookmarkMemo({ bookmark, onSaved }: Props) {
  const saver = useSaveBookmarkMemo(bookmark)

  return <QuestionMemo memo={bookmark.memo} {...saver} onSaved={(memo) => onSaved(bookmark, memo)} />
}
