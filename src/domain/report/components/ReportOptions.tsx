import { Link } from 'react-router-dom'

import { toReport } from '@/app/routes'
import Card from '@/shared/ui/Card'
import Chip from '@/shared/ui/Chip'
import Switch from '@/shared/ui/Switch'

import type { DisplayOptions } from '../types/displayOptions'
import type { AttemptRef } from '../types/report'

type ToggleKey = Exclude<keyof DisplayOptions, 'printMono'>

const TOGGLES: { key: ToggleKey; label: string }[] = [
  { key: 'showTimeline', label: '타임라인 마커 표시' },
  { key: 'showImprovedAnswer', label: '개선 답변 예시 포함' },
  { key: 'showGaze', label: '시선 지표 포함' },
]

type Props = {
  attempts: AttemptRef[]
  currentAttempt: number
  options: DisplayOptions
  onChange: (next: DisplayOptions) => void
  /**
   * 토글이 가리키는 절이 이 리포트에 있는지입니다. 없으면 토글을 그리지 않습니다.
   *
   * 타임라인 · 개선 답변 예시는 명세서 v0.2 에서 P1 이라 백엔드 MVP 에 안 들어올 수 있습니다.
   * 절은 이미 값이 없으면 안 그리는데, 토글만 남으면 눌러도 아무 일이 없어 고장으로 읽힙니다.
   * (이슈 #54 3-1)
   */
  available: Record<ToggleKey, boolean>
}

/**
 * 회차 선택과 표시 옵션입니다. (C-01 "리포트 옵션")
 *
 * 회차는 회차마다 리포트가 따로 있어서 링크로 이동합니다.
 * 표시 옵션은 서버에 저장하지 않습니다. 지금 이 화면에서 뭘 볼지의 문제라
 * 새로고침하면 기본값으로 돌아가는 게 맞다고 봤습니다.
 *
 * 시안 첫 줄 왼쪽의 `성장 추이 보기` 가 가는 곳은 **C-04 성장관리** 라는 별도
 * 화면인데 아직 없습니다. 갈 곳 없는 링크를 걸면 눌렀을 때 404 가 떠서,
 * 자리만 두고 왜 못 누르는지 옆에 적었습니다. (이슈 #38)
 */
export default function ReportOptions({
  attempts,
  currentAttempt,
  options,
  onChange,
  available,
}: Props) {
  const set = (key: keyof DisplayOptions) => (checked: boolean) =>
    onChange({ ...options, [key]: checked })

  return (
    <Card label="리포트 옵션" padding="md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Chip selected>이번 회차 리포트</Chip>

            <span className="opacity-50">
              <Chip>성장 추이 보기</Chip>
            </span>

            <span className="text-body-sm text-neutral-400">
              성장 추이 화면은 아직 준비 중이에요
            </span>
          </div>

          {/*
            회차 목록은 리포트가 아니라 세션 도메인에서 옵니다. 안 오면 "회차" 글자만
            덩그러니 남지 않게 줄째 뺍니다. (이슈 #54 3-1 · #32 5번 (1))
          */}
          {attempts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 md:ml-auto">
              <span className="text-body-sm text-neutral-500">회차</span>

              {attempts.map((item) => (
                <Link
                  key={item.attempt}
                  to={toReport(item.reportId)}
                  aria-current={item.attempt === currentAttempt ? 'page' : undefined}
                >
                  <Chip selected={item.attempt === currentAttempt} fill="solid">
                    {item.attempt}회차{item.isLatest ? ' (최신)' : ''}
                  </Chip>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {TOGGLES.filter(({ key }) => available[key]).map(({ key, label }) => (
            <Switch key={key} checked={options[key]} onChange={set(key)}>
              <span className="text-body-md text-neutral-700">{label}</span>
            </Switch>
          ))}

          <Switch checked={options.printMono} onChange={set('printMono')} className="md:ml-auto">
            <span className="text-body-md text-neutral-700">인쇄용 흑백</span>
          </Switch>
        </div>

        <p className="text-body-sm text-neutral-400">
          재연습 기록은 이 면접 리포트 안에 회차별로 저장됩니다
        </p>
      </div>
    </Card>
  )
}
