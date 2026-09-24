import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ROUTES, toReport } from '@/app/routes'
import Button from '@/shared/ui/Button'

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
  const { stageIndex, isDone, isTimedOut, tip } = useAnalysisProgress()

  useEffect(() => {
    if (!isDone || !sessionId) return

    // 리포트 id 는 분석이 끝날 때 백엔드가 알려줍니다. 아직 그 메시지 형식이
    // 정해지지 않아서, 목업에서는 세션 id 를 그대로 씁니다.
    navigate(toReport(sessionId), { replace: true })
  }, [isDone, sessionId, navigate])

  if (isTimedOut) {
    return <AnalysisTimedOut />
  }

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

/**
 * 기다림 상한(`ANALYSIS_TIMEOUT_MS`)을 넘겼을 때입니다.
 *
 * 스피너를 계속 돌리지 않고 멈춰서 상황을 말합니다. 실패라고 단정하지 않습니다 — 분석이 뒤에서
 * 아직 돌고 있을 수 있고, 우리는 그걸 확인할 통로가 아직 없습니다(Q6b). 그래서 "실패했어요" 가
 * 아니라 "오래 걸리고 있어요" 로 적고, 다시 기다리거나 빠져나갈 길을 둘 다 둡니다.
 *
 * 이 창에 머무는 동안 만들어진 리포트로 옮겨 갈 방법(리포트 목록 · 알림)이 아직 없다는 것도
 * 숨기지 않습니다. 없는 길을 있는 것처럼 적으면 사용자가 찾으러 헤맵니다.
 */
function AnalysisTimedOut() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 p-6 text-center">
      <div role="status" className="flex max-w-md flex-col items-center gap-3">
        <h1 className="text-h1 text-neutral-900">분석이 오래 걸리고 있어요</h1>
        <p className="break-keep text-body-md text-neutral-500">
          10분이 넘도록 분석이 끝나지 않았어요. 서버가 바쁘거나 문제가 생겼을 수 있어요.
        </p>
        <p className="break-keep text-body-sm text-neutral-400">
          지난 리포트를 모아 보는 화면은 아직 준비 중이라, 이 창을 벗어나면 이번 리포트로 돌아올 길이
          없어요.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button to={ROUTES.LANDING}>처음 화면으로</Button>
        <Button variant="primary" onClick={() => window.location.reload()}>
          다시 기다리기
        </Button>
      </div>
    </main>
  )
}
