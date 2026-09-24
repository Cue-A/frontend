import { useEffect, useState } from 'react'

import { USE_MOCK } from '@/shared/api/mock'

import { ANALYSIS_STAGES, WAITING_TIPS } from '../types/analysis'

/** 목업에서 한 단계가 넘어가는 데 걸리는 시간(ms) */
const MOCK_STAGE_MS = 2000

/** 팁이 바뀌는 간격(ms) */
const TIP_ROTATE_MS = 5000

/**
 * 이만큼 기다려도 끝나지 않으면 기다림을 멈추고 안내로 바꿉니다.
 *
 * AI 가 리포트 생성 폴링 상한으로 **10분**을 권장합니다 (답변 영상 다운로드 + 시선 처리 포함,
 * `Cue-A/AI` `docs/리포트생성_API계약_백엔드전달용.md`). 면접의 90초 · 60초와 다릅니다.
 * 이보다 짧으면 정상적으로 도는 분석을 실패처럼 보여주고, 상한이 없으면 무한 스피너가 됩니다.
 * (이슈 #54 3-3, Q6a "하지 말 것")
 */
export const ANALYSIS_TIMEOUT_MS = 10 * 60 * 1000

export type AnalysisProgress = {
  /** 0부터 셉니다. ANALYSIS_STAGES 의 몇 번째인지 */
  stageIndex: number
  /** 전부 끝났으면 true */
  isDone: boolean
  /** 끝나지 않은 채로 `ANALYSIS_TIMEOUT_MS` 가 지났으면 true */
  isTimedOut: boolean
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
  const [isTimedOut, setIsTimedOut] = useState(false)

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

  useEffect(() => {
    const timer = window.setTimeout(() => setIsTimedOut(true), ANALYSIS_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const isDone = stageIndex >= ANALYSIS_STAGES.length

  return {
    stageIndex: Math.min(stageIndex, ANALYSIS_STAGES.length - 1),
    isDone,
    // 끝난 뒤에 상한이 지나도 늦었다고 하지 않습니다. 끝났으면 리포트로 넘어갑니다.
    isTimedOut: isTimedOut && !isDone,
    tip: WAITING_TIPS[tipIndex],
  }
}
