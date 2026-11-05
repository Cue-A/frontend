import { IconPencil, IconPlus } from '@tabler/icons-react'
import { useEffect, useId, useRef, useState } from 'react'

import Button from '@/shared/ui/Button'

import { useSaveBookmarkMemo } from '../hooks/useSaveBookmarkMemo'
import { MAX_MEMO_LENGTH } from '../lib/questionDisplay'
import type { BookmarkedQuestion } from '../types/question'

type Props = {
  bookmark: BookmarkedQuestion
  /** 서버가 저장한 메모(지웠으면 null)로 목록의 그 줄을 바꿉니다 */
  onSaved: (bookmark: BookmarkedQuestion, memo: string | null) => void
}

/**
 * 북마크 카드 아래의 메모입니다.
 *
 * - 메모가 없으면 `+ 메모 추가`, 있으면 내용과 `수정` 이 보입니다. 누르면 그 자리에서 입력칸으로 바뀝니다
 * - 저장은 버튼을 눌렀을 때만 보냅니다. 글자마다 보내면 Rate Limit(30회/60초)에 걸립니다
 * - 비운 채 저장하면 메모가 지워집니다(북마크는 남습니다). 안내 문구로 미리 알립니다
 * - 저장하는 동안은 버튼을 잠그고, 실패하면 입력칸을 그대로 두고 이유를 보여줍니다. 다시 누를 수 있습니다
 * - Esc 는 취소입니다. 닫히면 포커스를 `수정` · `메모 추가` 로 돌려 키보드 사용자가 길을 잃지 않게 합니다
 */
export default function BookmarkMemo({ bookmark, onSaved }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const { save, saving, error, clearError } = useSaveBookmarkMemo()

  const labelId = useId()
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const restoreFocusRef = useRef(false)

  // 입력칸이 닫힌 뒤, 그 자리에 다시 나타난 버튼으로 포커스를 돌립니다
  useEffect(() => {
    if (editing || !restoreFocusRef.current) return
    restoreFocusRef.current = false
    triggerRef.current?.focus()
  }, [editing])

  const open = () => {
    setDraft(bookmark.memo ?? '')
    clearError()
    setEditing(true)
  }

  const close = () => {
    restoreFocusRef.current = true
    clearError()
    setEditing(false)
  }

  const handleSave = async () => {
    // 바뀐 게 없으면 서버에 보내지 않습니다
    if (draft === (bookmark.memo ?? '')) {
      close()
      return
    }

    const result = await save(bookmark, draft)
    if (!result.ok) return

    onSaved(bookmark, result.memo)
    close()
  }

  if (editing) {
    return (
      <div className="rounded-md border border-neutral-300 bg-neutral-0 p-4">
        <label htmlFor={labelId} className="text-body-sm font-semibold text-neutral-900">
          메모
        </label>
        <textarea
          id={labelId}
          value={draft}
          maxLength={MAX_MEMO_LENGTH}
          rows={3}
          autoFocus
          disabled={saving}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !saving) close()
          }}
          placeholder="이 질문에 대한 답변 포인트나 다음 연습 때 챙길 점을 적어 두세요"
          className="mt-2 block w-full resize-y rounded-sm text-body-md text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />

        {error && (
          <p role="alert" className="mt-2 break-keep text-body-sm text-semantic-danger">
            {error}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 pt-3">
          <p className="text-body-sm text-neutral-500">
            {draft.length} / {MAX_MEMO_LENGTH}
            <span className="ml-3">비운 채 저장하면 메모가 삭제돼요</span>
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={close} disabled={saving}>
              취소
            </Button>
            <Button variant="primary" size="sm" onClick={() => void handleSave()} disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (bookmark.memo) {
    return (
      <div className="flex items-start gap-3 rounded-md bg-neutral-50 px-4 py-3">
        <IconPencil size={16} stroke={2} aria-hidden className="mt-0.5 shrink-0 text-neutral-400" />
        <p className="min-w-0 flex-1 whitespace-pre-line break-words text-body-md text-neutral-900">{bookmark.memo}</p>
        <button
          ref={triggerRef}
          type="button"
          onClick={open}
          className="shrink-0 text-body-md text-neutral-900 underline underline-offset-2 hover:text-primary-500"
        >
          수정
          <span className="sr-only"> — 메모</span>
        </button>
      </div>
    )
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={open}
      className="inline-flex items-center gap-1.5 rounded-sm border border-neutral-200 bg-neutral-0 px-3 py-1.5 text-body-md text-neutral-700 transition-colors hover:bg-neutral-50"
    >
      <IconPlus size={16} stroke={2} aria-hidden />
      메모 추가
    </button>
  )
}
