import { useEffect, useId, useRef, useState } from 'react'

import Button from '@/shared/ui/Button'

import { useMoveToFolder, type MoveToFolderResult } from '../hooks/useMoveToFolder'
import { titleOf } from '../lib/practiceDisplay'
import type { PracticeFolder, PracticeSession } from '../types/practice'

/** "폴더에서 빼기" 를 고른 값. 폴더 id 는 UUID 라 겹치지 않습니다 */
const REMOVE_FROM_FOLDER = 'REMOVE'

type Props = {
  session: PracticeSession
  /** 내 폴더들. 만든 순서입니다 */
  folders: PracticeFolder[]
  /** 옮겼거나, 목록이 낡아서 못 옮겼을 때(`session-gone` · `folder-gone`). 화면은 목록 · 폴더를 새로 부릅니다 */
  onDone: (result: Exclude<MoveToFolderResult, { kind: 'failed' }>) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/**
 * 연습 기록 한 줄을 폴더로 옮기거나 폴더에서 뺍니다. `PATCH /api/practice-records/folder` (이슈 #205)
 *
 * 시안이 없어서 다른 확인 창과 같은 크기 · 버튼 자리로 그렸습니다. 폴더는 라디오로 하나만 고릅니다.
 *
 * - 지금 들어 있는 폴더를 처음부터 골라 두고 "지금 폴더" 라고 적습니다. 그대로면 옮기기 버튼이 잠깁니다
 * - 폴더에 들어 있는 세션이면 맨 아래에 "폴더에서 빼기" 가 있습니다
 * - 서버는 면접 단위로 옮겨서 같은 면접의 다른 회차도 같이 옮겨집니다. 목록 응답에는 어느 회차끼리 같은 면접인지가 없어서
 *   늘 안내를 적어 둡니다
 * - 옮기는 동안은 닫을 수 없습니다. 요청을 끊을 방법이 없어서, 닫혀도 서버에서는 옮겨집니다
 * - 실패하면 창을 닫지 않고 이유를 보여줍니다. 다시 누를 수 있습니다
 */
export default function FolderMoveDialog({ session, folders, onDone, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const radioName = useId()
  const currentFolderId = session.folder?.folderId ?? null
  const [selected, setSelected] = useState<string | null>(currentFolderId)
  const { move, moving, error } = useMoveToFolder()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    if (!moving) return

    const blockEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault()
    }
    window.addEventListener('keydown', blockEscape, true)
    return () => window.removeEventListener('keydown', blockEscape, true)
  }, [moving])

  const close = () => {
    if (!moving) dialogRef.current?.close()
  }

  const target = selected === REMOVE_FROM_FOLDER ? null : selected
  const changed = selected !== null && target !== currentFolderId
  const canSubmit = changed && !moving

  const handleMove = async () => {
    if (!canSubmit) return

    const result = await move(session.sessionId, target)
    if (result.kind === 'failed') return

    onDone(result)
    dialogRef.current?.close()
  }

  const options = folders.map((folder) => ({
    value: folder.folderId,
    label: folder.name,
    current: folder.folderId === currentFolderId,
  }))
  if (currentFolderId !== null) options.push({ value: REMOVE_FROM_FOLDER, label: '폴더에서 빼기', current: false })

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (moving) event.preventDefault()
      }}
      aria-labelledby={headingId}
      className="m-auto w-full max-w-md rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleMove()
        }}
      >
        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-1">
            <p id={headingId} className="text-h2 text-neutral-900">
              폴더 옮기기
            </p>
            <p className="break-keep text-body-sm text-neutral-500">
              {titleOf(session)} · {session.round}회차
            </p>
          </div>

          {options.length === 0 ? (
            <p className="break-keep rounded-sm bg-neutral-50 px-4 py-3 text-body-md text-neutral-700">
              아직 만든 폴더가 없어요. 위쪽 ‘새 폴더’ 로 먼저 만들어 주세요.
            </p>
          ) : (
            <fieldset className="flex flex-col gap-2" disabled={moving}>
              <legend className="sr-only">옮길 폴더</legend>
              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                {options.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-sm border px-4 py-3 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-primary-500 ${
                      selected === option.value
                        ? 'border-primary-500 bg-primary-100/60'
                        : 'border-neutral-200 bg-neutral-0 hover:border-primary-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name={radioName}
                      value={option.value}
                      checked={selected === option.value}
                      onChange={() => setSelected(option.value)}
                      className="h-4 w-4 shrink-0 accent-primary-500"
                    />
                    <span
                      className={`min-w-0 flex-1 truncate text-body-md ${
                        option.value === REMOVE_FROM_FOLDER ? 'text-neutral-700' : 'font-semibold text-neutral-900'
                      }`}
                    >
                      {option.label}
                    </span>
                    {option.current && <span className="shrink-0 text-body-sm text-neutral-500">지금 폴더</span>}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <p className="break-keep text-body-sm text-neutral-500">같은 면접을 다시 본 회차가 있으면 함께 옮겨져요.</p>

          {error && (
            <p role="alert" className="break-keep text-body-sm text-semantic-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
          <Button size="sm" onClick={close} disabled={moving}>
            취소
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!canSubmit}>
            {moving ? '옮기는 중…' : selected === REMOVE_FROM_FOLDER ? '빼기' : '옮기기'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
