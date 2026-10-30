import { useEffect, useState } from 'react'

/**
 * 값이 `delayMs` 동안 바뀌지 않았을 때만 따라 바뀌는 값을 돌려줍니다.
 *
 * 검색 칸처럼 칠 때마다 서버에 다시 물으면 글자 하나에 요청 하나가 나가는 곳에 씁니다. 화면에 보이는 입력값은
 * 원래 값을 그대로 쓰고, 요청에만 이 값을 씁니다.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
