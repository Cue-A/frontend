import { IconFolder, IconLayoutGrid, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { useId } from 'react'

import Button from '@/shared/ui/Button'

import type { UsePracticeFoldersResult } from '../hooks/usePracticeFolders'
import { ALL_FOLDERS, type FolderSelection, type PracticeFolder } from '../types/practice'

type Props = {
  folders: UsePracticeFoldersResult
  value: FolderSelection
  onChange: (value: FolderSelection) => void
  onCreate: () => void
  /** 고른 폴더의 "이름 바꾸기" (이슈 #205) */
  onRename: (folder: PracticeFolder) => void
  /** 고른 폴더의 "지우기" (이슈 #205) */
  onDelete: (folder: PracticeFolder) => void
}

const FOLDER_ACTION =
  'inline-flex items-center gap-1 rounded-xs px-2 py-1 text-body-sm font-semibold text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-primary-500'

type CardOption = {
  value: FolderSelection
  name: string
  /** 아직 숫자를 모르면 null — 불러오는 중이거나 실패했을 때입니다 */
  count: number | null
  Icon: typeof IconFolder
}

const CARD_BASE =
  'flex min-h-16 min-w-34 max-w-52 items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors'

/**
 * 연습 기록 위쪽의 폴더 카드 줄입니다. (연습 기록 시안 folder-row)
 *
 * **전체 · 내 폴더들** 순서입니다. 시안의 "기타"(폴더에 넣지 않은 세션) 카드는 아직 두지 않습니다 — 연습 기록 API 에
 * "폴더에 넣지 않은 기록만" 거르는 조건과 그 개수가 없습니다. 폴더 이동은 생겼지만(이슈 #205) 필터는 아직 백엔드에
 * 요청하지 않았습니다. 필터가 생기면 다시 넣습니다. (이슈 #167 · docs/90 Q17)
 *
 * 여럿 중 하나를 고르는 것이라 필터 탭(SegmentedTabs)처럼 숨긴 라디오로 만듭니다. 화살표 키로 옮겨 다니고
 * 스크린리더가 "4개 중 2번째, 선택됨" 으로 읽습니다. "새 폴더" 는 고르는 칸이 아니라 버튼이라 라디오 묶음 밖에 둡니다.
 *
 * 폴더를 못 불러와도 "전체" 는 고를 수 있게 둡니다. 목록은 폴더와 따로 받아서 전체 목록은 그대로 보입니다.
 *
 * 폴더를 고르면 카드 줄 아래에 그 폴더의 "이름 바꾸기" · "지우기" 가 나옵니다 (이슈 #205). 카드 안에 버튼을 넣으면 카드가
 * 라디오 라벨이라 누를 때 폴더 고르기와 겹쳐서, 고른 폴더 하나에만 따로 둡니다.
 */
export default function FolderCards({ folders, value, onChange, onCreate, onRename, onDelete }: Props) {
  const name = useId()
  const selectedFolder =
    folders.status === 'ready' ? folders.folders.folders.find((folder) => folder.folderId === value) : undefined

  const options: CardOption[] = [
    {
      value: ALL_FOLDERS,
      name: '전체',
      count: folders.status === 'ready' ? folders.folders.totalCount : null,
      Icon: IconLayoutGrid,
    },
  ]
  if (folders.status === 'ready') {
    for (const folder of folders.folders.folders) {
      options.push({ value: folder.folderId, name: folder.name, count: folder.sessionCount, Icon: IconFolder })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start gap-3">
        <fieldset className="flex min-w-0 flex-wrap items-start gap-3">
          <legend className="sr-only">폴더</legend>
          {options.map((option) => {
            const checked = value === option.value
            return (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={checked}
                  onChange={() => onChange(option.value)}
                  className="peer sr-only"
                />
                <span
                  className={`${CARD_BASE} peer-focus-visible:ring-2 peer-focus-visible:ring-primary-200 ${
                    checked
                      ? 'border-primary-500 bg-primary-100/60'
                      : 'border-neutral-200 bg-neutral-0 hover:border-primary-200'
                  }`}
                >
                  <span
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs bg-primary-100 text-primary-600"
                  >
                    <option.Icon size={16} stroke={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-body-md font-semibold text-neutral-900">{option.name}</span>
                    <span className="block whitespace-nowrap text-body-sm text-neutral-500">
                      {option.count === null ? ' ' : `${option.count}개 세션`}
                    </span>
                  </span>
                </span>
              </label>
            )
          })}
        </fieldset>

        <button
          type="button"
          onClick={onCreate}
          disabled={folders.status !== 'ready'}
          className={`${CARD_BASE} justify-center border-dashed border-neutral-300 text-body-md font-semibold text-neutral-500 hover:border-primary-200 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary-500`}
        >
          <IconPlus size={16} stroke={2} aria-hidden />새 폴더
        </button>
      </div>

      {selectedFolder && (
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <p className="mr-1 min-w-0 truncate text-body-sm text-neutral-500">
            ‘<span className="font-semibold text-neutral-700">{selectedFolder.name}</span>’ 폴더
          </p>
          <button type="button" onClick={() => onRename(selectedFolder)} className={FOLDER_ACTION}>
            <IconPencil size={14} stroke={2} aria-hidden />
            이름 바꾸기
          </button>
          <button type="button" onClick={() => onDelete(selectedFolder)} className={FOLDER_ACTION}>
            <IconTrash size={14} stroke={2} aria-hidden />
            지우기
          </button>
        </div>
      )}

      {folders.status === 'loading' && <p className="text-body-sm text-neutral-500">폴더를 불러오는 중이에요…</p>}
      {folders.status === 'error' && (
        // "새 폴더" 가 잠긴 이유도 여기서 같이 알립니다 — 지금 폴더 이름을 모르면 같은 이름을 막을 수 없습니다.
        <div role="alert" className="flex flex-wrap items-center gap-3">
          <p className="text-body-sm text-semantic-danger">폴더를 불러오지 못했어요. 전체 기록은 아래에서 볼 수 있어요.</p>
          <Button size="sm" onClick={folders.reload}>
            다시 시도
          </Button>
        </div>
      )}
    </div>
  )
}
