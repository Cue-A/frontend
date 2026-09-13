import { useEffect, useState } from 'react'

import { USE_MOCK } from '@/shared/api/mock'

import { ANALYSIS_STAGES, WAITING_TIPS } from '../types/analysis'

/** 목업에서 한 단계가 넘어가는 데 걸리는 시간(ms) */
const MOCK_STAGE_MS = 2000

/** 팁이 바뀌는 간격(ms) */
const TIP_ROTATE_MS = 5000

export type AnalysisProgress = {
  /** 0부터 셉니다. ANALYSIS_STAGES 의 몇 번째인지 */
  stageIndex: number
  /** 전부 끝났으면 true */
  isDone: boolean
  tip: string
}

/**
 * 분석 진행 상태입니다.
 *
 * 실제 진행 상태는 백엔드가 WebSocket 으로 밀어줍니다. 프론트가 폴링하지
 * 않는다는 건 정해져 있지만, 분석 단계 메시지 형식은 아직 미확정입니다.
 * (docs/90-open-questions.md Q6b)
 *
 * 그래서 지금은 목업일 때만 단계가 시간에 따라 넘어갑니다. 실제 연결이
 * 붙으면 이 훅 안만 바꾸면 되고, 화면은 건드릴 필요가 없습니다.
 * 목업이 아니면 첫 단계에 머뭅니다. 없는 진행률을 지어내지 않기 위해서입니다.
 */
export function useAnalysisProgress(): AnalysisProgress {
  const [stageIndex, setStageIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    if (!USE_MOCK) return

    const timer = window.setInterval(() => {
      setStageIndex((previous) => Math.min(previous + 1, ANALYSIS_STAGES.length))
    }, MOCK_STAGE_MS)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTipIndex((previous) => (previous + 1) % WAITING_TIPS.length)
    }, TIP_ROTATE_MS)

    return () => window.clearInterval(timer)
  }, [])

  return {
    stageIndex: Math.min(stageIndex, ANALYSIS_STAGES.length - 1),
    isDone: stageIndex >= ANALYSIS_STAGES.length,
    tip: WAITING_TIPS[tipIndex],
  }
}
