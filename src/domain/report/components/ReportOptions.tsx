import { Link } from 'react-router-dom'

import { toReport } from '@/app/routes'
import Card from '@/shared/ui/Card'
import Chip from '@/shared/ui/Chip'
import Switch from '@/shared/ui/Switch'

import type { DisplayOptions } from '../types/displayOptions'
import type { AttemptRef } from '../types/report'

type ToggleKey = Exclude<keyof DisplayOptions, 'printMono'>

/** 리포트 화면의 탭. 이번 회차 리포트 본문, 또는 같은 면접을 다시 본 회차들의 성장 추이(회차 비교) */
export type ReportView = 'report' | 'growth'

const VIEWS: { view: ReportView; label: string }[] = [
  { view: 'report', label: '이번 회차 리포트' },
  { view: 'growth', label: '성장 추이 보기' },
]

const TOGGLES: { key: ToggleKey; label: string }[] = [
  { key: 'showTimelineMarkers', label: '타임라인 마커 표시' },
  { key: 'showImprovedAnswer', label: '답변 개선 방향 포함' },
  { key: 'showGaze', label: '시선 지표 포함' },
]

type Props = {
  attempts: AttemptRef[]
  currentAttempt: number
  view: ReportView
  onViewChange: (next: ReportView) => void
  options: DisplayOptions
  onChange: (next: DisplayOptions) => void
  /**
   * 토글이 가리키는 절이 이 리포트에 있는지입니다. 없으면 토글을 그리지 않습니다.
   *
   * 타임라인 · 답변 개선 방향은 명세서 v0.2 에서 P1 이라 백엔드 MVP 에 안 들어올 수 있습니다.
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
 * 시안 첫 줄 왼쪽의 `이번 회차 리포트` · `성장 추이 보기` 는 **이 화면 안의 탭**입니다. 성장 추이는 이 리포트의 회차까지
 * 비교한 회차 비교(점수 추이 · 직전 회차 대비 · 문항별 변화)만 따로 보여줍니다 — 같은 섹션이 리포트 본문에도 있습니다. 전에는 사이드바의 성장 관리(C-04)로 넘어갔는데,
 * 그곳은 가장 최근 면접 기준이라 지금 보는 리포트와 다른 면접이 나올 수 있었습니다 (이슈 #183).
 *
 * 표시 옵션 토글(타임라인 마커 · 답변 개선 방향 · 시선)은 리포트 본문에만 걸려서 성장 추이 탭에서는 그리지 않습니다.
 * 인쇄용 흑백은 저장에 쓰여서 두 탭 모두에 둡니다(저장은 지금 보는 탭 그대로 나갑니다).
 */
export default function ReportOptions({
  attempts,
  currentAttempt,
  view,
  onViewChange,
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
          <div role="group" aria-label="리포트 보기" className="flex flex-wrap items-center gap-2">
            {VIEWS.map((item) => (
              <button
                key={item.view}
                type="button"
                aria-pressed={item.view === view}
                onClick={() => onViewChange(item.view)}
                className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
              >
                <Chip selected={item.view === view}>{item.label}</Chip>
              </button>
            ))}
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
                  // 성장 추이 탭에서 회차를 바꾸면 그 회차의 성장 추이를 봅니다. 그래프 막대를 누르면 그 회차 리포트로 갑니다
                  to={toReport(item.reportId, view === 'growth' ? 'growth' : undefined)}
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
          {TOGGLES.filter(({ key }) => view === 'report' && available[key]).map(({ key, label }) => (
            <Switch key={key} checked={options[key]} onChange={set(key)}>
              <span className="text-body-md text-neutral-700">{label}</span>
            </Switch>
          ))}

          <Switch checked={options.printMono} onChange={set('printMono')} className="md:ml-auto">
            <span className="text-body-md text-neutral-700">인쇄용 흑백</span>
          </Switch>
        </div>

        <p className="text-body-sm text-neutral-400">
          재연습 기록은 이 결과 리포트 안에 회차별로 저장됩니다
        </p>
      </div>
    </Card>
  )
}
