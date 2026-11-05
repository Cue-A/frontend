import { useEffect, useState } from 'react'

/**
 * `startedAt`(epoch ms)부터 지난 초를 돌려줍니다. 매초 `Date.now()` 와의 차이로 계산해서
 * 백그라운드 탭처럼 타이머가 늦게 도는 경우에도 값이 어긋나지 않는다.
 *
 * `startedAt` 이 null 이면 0 이다. `stopped` 가 true 가 되면 마지막 갱신 값으로 멈춘다(최대 1초 이내 오차).
 * 매초 리렌더가 이 훅을 쓰는 컴포넌트에만 머물도록, 화면 전체가 아니라 숫자를 그리는
 * 작은 컴포넌트에서 호출한다.
 */
export function useElapsedSec(startedAt: number | null, stopped = false): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null || stopped) return

    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [startedAt, stopped])

  if (startedAt === null) return 0
  return Math.max(0, Math.floor((now - startedAt) / 1000))
}
