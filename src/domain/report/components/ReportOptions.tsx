import { Link } from 'react-router-dom'

import { toReport } from '@/app/routes'

import type { DisplayOptions } from '../types/displayOptions'
import type { AttemptRef } from '../types/report'

const TOGGLES: { key: keyof DisplayOptions; label: string }[] = [
  { key: 'showTimeline', label: '타임라인 마커 표시' },
  { key: 'showImprovedAnswer', label: '개선 답변 예시 포함' },
  { key: 'showVision', label: '시선 지표 포함' },
]

type Props = {
  attempts: AttemptRef[]
  currentAttempt: number
  options: DisplayOptions
  onChange: (next: DisplayOptions) => void
}

/**
 * 회차 선택과 표시 옵션입니다. (C-01 "리포트 옵션")
 *
 * 회차는 회차마다 리포트가 따로 있어서 링크로 이동합니다.
 * 표시 옵션은 서버에 저장하지 않습니다. 지금 이 화면에서 뭘 볼지의 문제라
 * 새로고침하면 기본값으로 돌아가는 게 맞다고 봤습니다.
 */
export default function ReportOptions({ attempts, currentAttempt, options, onChange }: Props) {
  return (
    <section aria-label="리포트 옵션" className="flex flex-col gap-4 border p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span>회차</span>

        {attempts.map((item) => (
          <Link
            key={item.attempt}
            to={toReport(item.reportId)}
            aria-current={item.attempt === currentAttempt ? 'page' : undefined}
            className="border px-3 py-1.5"
          >
            {item.attempt}회차{item.isLatest ? ' (최신)' : ''}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-6">
        {TOGGLES.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options[key]}
              onChange={(event) => onChange({ ...options, [key]: event.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>

      <p>재연습 기록은 이 면접 리포트 안에 회차별로 저장됩니다</p>
    </section>
  )
}
