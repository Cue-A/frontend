import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { toReport } from '@/app/routes'

import { useAnalysisProgress } from '../hooks/useAnalysisProgress'
import { ANALYSIS_STAGES } from '../types/analysis'

/**
 * 시안의 로고 원입니다. 점선 링이 천천히 돌아 "멈춘 게 아니다"를 알려줍니다.
 * 로고 이미지는 아직 내보내지 않아서 글자로 둡니다.
 */
function AnalyzingMark() {
  return (
    <div
      aria-hidden
      className="flex h-36 w-36 animate-spin items-center justify-center rounded-full border-2 border-dashed border-primary-200 [animation-duration:12s]"
    >
      <div className="flex h-28 w-28 animate-spin items-center justify-center rounded-full bg-neutral-0 text-display text-primary-500 shadow-card [animation-direction:reverse] [animation-duration:12s]">
        C
      </div>
    </div>
  )
}

/** 지난 단계는 꽉 찬 점, 지금 단계는 속 빈 링, 남은 단계는 회색 점입니다. (시안) */
function StageDot({ state }: { state: 'done' | 'current' | 'upcoming' }) {
  if (state === 'current') {
    return <span aria-hidden className="h-3 w-3 rounded-full border-2 border-primary-500" />
  }

  return (
    <span
      aria-hidden
      className={`h-2.5 w-2.5 rounded-full ${state === 'done' ? 'bg-primary-500' : 'bg-neutral-300'}`}
    />
  )
}

/**
 * 면접이 끝나고 리포트가 만들어지기를 기다리는 화면입니다. (B-02)
 *
 * 시안대로 가운데 정렬 한 덩어리입니다. 사이드바 없이 혼자 그립니다. (router.tsx)
 * 몇 단계 중 몇 번째인지, 지금 무슨 작업을 하는지 보여줍니다. 그냥 도는
 * 스피너만 두면 얼마나 더 기다려야 하는지 알 수 없어서 사람들이 새로고침합니다.
 */
export default function AnalyzingPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { stageIndex, isDone, tip } = useAnalysisProgress()

  useEffect(() => {
    if (!isDone || !sessionId) return

    // 리포트 id 는 분석이 끝날 때 백엔드가 알려줍니다. 아직 그 메시지 형식이
    // 정해지지 않아서, 목업에서는 세션 id 를 그대로 씁니다.
    navigate(toReport(sessionId), { replace: true })
  }, [isDone, sessionId, navigate])

  const current = ANALYSIS_STAGES[stageIndex]
  const percent = Math.round(((stageIndex + 1) / ANALYSIS_STAGES.length) * 100)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 p-6 text-center">
      <AnalyzingMark />

      <h1 className="text-h1 text-neutral-900">분석중입니다…</h1>

      <p className="text-body-md text-neutral-500">
        면접 답변을 분석해서 리포트를 준비하고 있어요. 잠시만 기다려주세요.
      </p>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={ANALYSIS_STAGES.length}
        aria-valuenow={stageIndex + 1}
        aria-valuetext={`${ANALYSIS_STAGES.length}단계 중 ${stageIndex + 1}단계 · ${current.label}`}
        className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-neutral-200"
      >
        {/* 너비는 계산값이라 인라인 style 을 씁니다 (docs/01-conventions.md "스타일" 절) */}
        <div
          className="h-full rounded-full bg-primary-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-body-sm font-semibold text-neutral-900 tabular-nums">
        {stageIndex + 1}/{ANALYSIS_STAGES.length} 단계 진행 중 · {current.label}
      </p>

      <ol className="flex flex-wrap justify-center gap-6">
        {ANALYSIS_STAGES.map((stage, index) => {
          const state = index < stageIndex ? 'done' : index === stageIndex ? 'current' : 'upcoming'

          return (
            <li
              key={stage.key}
              aria-current={state === 'current' ? 'step' : undefined}
              className="flex w-16 flex-col items-center gap-2"
            >
              <StageDot state={state} />

              <span
                className={
                  'text-body-sm ' + (state === 'upcoming' ? 'text-neutral-400' : 'text-neutral-700')
                }
              >
                {stage.label}
              </span>
            </li>
          )
        })}
      </ol>

      <p className="text-body-sm text-neutral-400">면접 Tip · {tip}</p>
    </main>
  )
}
