import { IconX } from '@tabler/icons-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import Button from '@/shared/ui/Button'
import Chip from '@/shared/ui/Chip'

import { useUpdateWeeklyGoal } from '../hooks/useUpdateWeeklyGoal'
import { WEEKLY_GOAL_OPTIONS } from '../lib/growthDisplay'
import type { WeeklyGoal } from '../types/growth'

type Props = {
  /** 지금 목표. 아직 안 정했으면 null — 처음 고른 칸은 3회입니다 */
  goal: WeeklyGoal | null
  onSaved: (goal: WeeklyGoal) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/** 목표가 없을 때 처음 골라 둘 횟수. 시안의 "2 / 3회" 처럼 주 3회입니다 */
const DEFAULT_TARGET = 3

/**
 * 이번 주 목표 수정 창. **시안이 없어** 일정 등록 창과 같은 크기 · 머리 줄 · 버튼 줄로 그렸습니다.
 *
 * 고르는 값은 이번 주에 연습할 횟수(1 ~ 7회) 하나입니다. 백엔드 `goal` 은 무엇을 셀지(`target_metric`)까지 고를 수 있게
 * 되어 있지만, 시안의 "2 / 3회 완료" 가 연습 횟수라 그것만 둡니다. 횟수는 옵션 설정의 칩처럼 숨긴 라디오로 고릅니다 —
 * 화살표 키로 옮겨 다니고 화면 읽기 프로그램이 "7개 중 3번째, 선택됨" 으로 읽습니다.
 */
export default function GoalEditDialog({ goal, onSaved, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const descriptionId = useId()
  const name = useId()
  const [target, setTarget] = useState(goal?.target ?? DEFAULT_TARGET)
  const { save, saving, error, clearError } = useUpdateWeeklyGoal()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    if (!saving) return

    const blockEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault()
    }
    window.addEventListener('keydown', blockEscape, true)
    return () => window.removeEventListener('keydown', blockEscape, true)
  }, [saving])

  const close = () => {
    if (!saving) dialogRef.current?.close()
  }

  const unchanged = goal !== null && goal.target === target

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    // 같은 횟수로 저장하면 서버에 물을 것 없이 닫습니다
    if (unchanged) {
      dialogRef.current?.close()
      return
    }

    const saved = await save(target)
    if (!saved) return

    onSaved(saved)
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (saving) event.preventDefault()
      }}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      className="m-auto w-full max-w-120 rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-6 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p id={headingId} className="text-h2 font-bold text-neutral-900">
              {goal === null ? '이번 주 목표 정하기' : '이번 주 목표 수정'}
            </p>
            <p id={descriptionId} className="text-body-md text-neutral-500">
              이번 주(월 ~ 일)에 몇 번 연습할지 정해요
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="rounded-xs p-1 text-neutral-500 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary-500"
          >
            <IconX size={20} stroke={2} aria-hidden />
            <span className="sr-only">닫기</span>
          </button>
        </div>

        <fieldset className="flex flex-col gap-3" disabled={saving}>
          <legend className="mb-3 text-body-sm font-semibold text-neutral-700">연습 횟수</legend>
          {/* 일곱 칸을 한 줄에 똑같은 폭으로 둡니다. 글자만큼 폭이면 마지막 "7회" 가 다음 줄로 떨어집니다 */}
          <div className="grid grid-cols-7 gap-2">
            {WEEKLY_GOAL_OPTIONS.map((option) => (
              <label key={option} className="min-w-0 cursor-pointer">
                <input
                  type="radio"
                  name={name}
                  value={option}
                  checked={target === option}
                  onChange={() => {
                    clearError()
                    setTarget(option)
                  }}
                  className="peer sr-only"
                />
                <span className="flex rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-500">
                  <Chip selected={target === option} fullWidth>
                    {option}회
                  </Chip>
                </span>
              </label>
            ))}
          </div>
          {goal && (
            <p className="text-body-sm text-neutral-500">
              이번 주에 {goal.done}회 연습했어요.
              {target <= goal.done && ' 이 횟수로 정하면 바로 목표 달성이에요.'}
            </p>
          )}
        </fieldset>

        {error && (
          <p role="alert" className="-mt-2 break-keep text-body-sm text-semantic-danger">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button onClick={close} disabled={saving} className="flex-1">
            취소
          </Button>
          <Button variant="primary" type="submit" disabled={saving} className="flex-1">
            {saving ? '저장하는 중…' : '저장하기'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
