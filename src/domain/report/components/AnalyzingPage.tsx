import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { toReport } from '@/app/routes'

import { useAnalysisProgress } from '../hooks/useAnalysisProgress'
import { ANALYSIS_STAGES } from '../types/analysis'

/**
 * 면접이 끝나고 리포트가 만들어지기를 기다리는 화면입니다. (B-02)
 *
 * 시안대로 가운데 정렬 한 덩어리입니다. 사이드바 없이 혼자 그립니다. (router.tsx)
 * 몇 단계 중 몇 번째인지, 지금 무슨 작업을 하는지 보여줍니다. 그냥 도는
 * 스피너만 두면 얼마나 더 기다려야 하는지 알 수 없어서 사람들이 새로고침합니다.
 *
 * 색 · 타이포는 토큰이 dev 에 들어온 뒤에 한 번에 입힙니다.
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <h1>분석중입니다…</h1>
      <p>면접 답변을 분석해서 리포트를 준비하고 있어요. 잠시만 기다려주세요.</p>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={ANALYSIS_STAGES.length}
        aria-valuenow={stageIndex + 1}
        aria-valuetext={`${ANALYSIS_STAGES.length}단계 중 ${stageIndex + 1}단계 · ${current.label}`}
        className="h-2 w-full max-w-md border"
      >
        {/* 너비는 계산값이라 인라인 style 을 씁니다 (docs/01-conventions.md "스타일" 절) */}
        <div className="h-full bg-current" style={{ width: `${percent}%` }} />
      </div>

      <p className="tabular-nums">
        {stageIndex + 1}/{ANALYSIS_STAGES.length} 단계 진행 중 · {current.label}
      </p>

      <ol className="flex flex-wrap justify-center gap-4">
        {ANALYSIS_STAGES.map((stage, index) => (
          <li
            key={stage.key}
            aria-current={index === stageIndex ? 'step' : undefined}
            className="flex flex-col items-center gap-1"
          >
            <span aria-hidden="true">{index <= stageIndex ? '●' : '○'}</span>
            <span>{stage.label}</span>
          </li>
        ))}
      </ol>

      <p>면접 Tip · {tip}</p>
    </main>
  )
}
