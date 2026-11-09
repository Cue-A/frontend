import { useEffect, useState } from 'react'

import { loadDraft, saveDraft } from '@/shared/lib/draftStorage'

const DRAFT_NAME = 'bookmarkHintSeen'

/** 안내를 보여주는 시간. 질문 음성이 없거나 짧아도 읽을 틈은 있어야 해서 제시 구간보다 길게 잡았다. */
const HINT_DURATION_MS = 6000

export type UseBookmarkHintResult = {
  visible: boolean
  /** 안내를 더 보여주지 않는다 — 북마크를 눌러 본 사용자에게는 설명이 필요 없다. */
  dismiss: () => void
}

/**
 * 첫 질문에서 "북마크로 질문을 저장할 수 있다"는 안내를 한 번만 보여주는 상태입니다.
 *
 * `eligible` 이 true 가 되면 보이기 시작해 6초 뒤, 북마크를 누르면, 또는 `eligible` 이 false 가 되면(답변 제출 등)
 * 사라지고 이 화면에서는 다시 안 뜬다(되묻기로 같은 질문이 다시 와도). 한 번 보여준 기록은 `draftStorage`(이 탭의
 * sessionStorage)에 남겨 새로고침해도 다시 뜨지 않게 한다. 탭을 닫거나 로그아웃하면 지워져 다음 면접에서 다시
 * 보인다 — 영구 저장이 필요해지면 그때 바꾼다.
 *
 * "봤음" 처리를 effect cleanup 에 두면 개발 모드(StrictMode)의 마운트 직후 정리 때 바로 숨겨져서, `eligible` 이
 * 바뀌는 순간을 렌더 중에 알아챈다.
 */
export function useBookmarkHint(eligible: boolean): UseBookmarkHintResult {
  const [seen, setSeen] = useState(() => loadDraft(DRAFT_NAME) === true)
  const [wasEligible, setWasEligible] = useState(false)

  if (eligible !== wasEligible) {
    setWasEligible(eligible)
    if (!eligible) setSeen(true)
  }

  useEffect(() => {
    if (!eligible || seen) return

    saveDraft(DRAFT_NAME, true)
    const timer = setTimeout(() => setSeen(true), HINT_DURATION_MS)
    return () => clearTimeout(timer)
  }, [eligible, seen])

  return { visible: eligible && !seen, dismiss: () => setSeen(true) }
}
