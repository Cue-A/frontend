import type { SessionSetup } from '../types/sessionSetup'

import { parseSavedSessionSetup } from './savedSessionSetup'

/**
 * 재연습 화면에서 장치 테스트로 넘길 때 같이 보내는 값입니다. (이슈 #152)
 *
 * 장치 테스트의 "면접 요약" 은 서버에 만들어진 세션의 값으로 채우는데(DeviceCheckSummaryCard), 재연습은 이 화면이
 * 넘긴 조건을 그대로 보여줍니다. 세션을 다시 읽으면 빈 표시("-")가 보일 수 있어서입니다. 그래서 재연습 조건을
 * 화면 이동 값(history state)으로 넘깁니다 — 새로고침해도 남고, 다른 탭과 섞이지 않습니다.
 * "← 옵션" 도 옵션 설정이 아니라 재연습 화면으로 돌아가게 돌아갈 곳을 같이 넘깁니다.
 */
export type ReplayDeviceCheckState = {
  replaySetup: SessionSetup
  /** "← 옵션" 이 돌아갈 곳 (재연습 화면 주소) */
  backTo: string
}

/** 화면 이동 값에서 재연습 조건을 꺼냅니다. 재연습이 아니거나 모양이 맞지 않으면 null 입니다 */
export function readReplayDeviceCheckState(state: unknown): ReplayDeviceCheckState | null {
  if (typeof state !== 'object' || state === null) return null

  const { replaySetup, backTo } = state as Partial<Record<keyof ReplayDeviceCheckState, unknown>>
  const setup = parseSavedSessionSetup(replaySetup)
  if (!setup || typeof backTo !== 'string' || !backTo.startsWith('/')) return null

  return { replaySetup: setup, backTo }
}
