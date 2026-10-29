/**
 * 로그인한 사람이 고르던 값을 **이 탭에** 잠깐 남겨 두는 자리입니다 (sessionStorage).
 *
 * 화면을 옮겼다 돌아와도 값이 남아 있어야 할 때 씁니다. 예) 옵션 설정 → 장치 테스트 → "← 옵션".
 * 화면의 `useState` 는 화면을 떠나는 순간 사라져서, 돌아오면 처음 값으로 돌아갔습니다.
 *
 * - 탭을 닫으면 사라집니다. 며칠 뒤에 들어왔는데 예전 값이 채워져 있으면 오히려 헷갈립니다
 * - **사용자가 로그아웃하면 같이 지웁니다** (`clearTokens` 가 `clearDrafts` 를 부릅니다)
 * - 재발급 실패로 **강제 로그아웃될 때는 남겨 둡니다.** 사용자가 나가기로 한 게 아니라서(네트워크가 잠깐 끊긴 경우 등),
 *   다시 로그인했을 때 고르던 값이 그대로 있어야 합니다 (PR #90 리뷰)
 * - 대신 **다른 계정이 로그인하면 지웁니다** (`claimDrafts`). 같은 탭에서 다른 사람이 들어왔을 때 앞 사람이 고른
 *   문서 같은 값이 남으면 안 됩니다
 * - 저장소를 막아둔 브라우저(사생활 보호 모드 등)에서는 조용히 저장만 안 됩니다. 화면은 그대로 동작합니다
 */
const PREFIX = 'cue-a:draft:'

/** 지금 남아 있는 값이 누구 것인지. 값과 같은 탭 저장소에 둡니다 */
const OWNER_KEY = 'cue-a:draftOwner'

/** 저장해 둔 값. 없거나 읽을 수 없으면 null 입니다. 모양은 쓰는 쪽이 확인합니다 */
export function loadDraft(name: string): unknown {
  try {
    const raw = sessionStorage.getItem(PREFIX + name)
    return raw === null ? null : (JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function saveDraft(name: string, value: unknown) {
  try {
    sessionStorage.setItem(PREFIX + name, JSON.stringify(value))
  } catch (cause) {
    console.error('임시 저장 실패 name=%s', name, cause)
  }
}

export function removeDraft(name: string) {
  try {
    sessionStorage.removeItem(PREFIX + name)
  } catch {
    // 저장소를 못 쓰는 브라우저면 지울 것도 없습니다.
  }
}

/** 이 자리에 남긴 값을 전부 지웁니다. 사용자가 로그아웃할 때 부릅니다 */
export function clearDrafts() {
  try {
    const keys: string[] = [OWNER_KEY]
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(PREFIX)) keys.push(key)
    }
    keys.forEach((key) => sessionStorage.removeItem(key))
  } catch {
    // 위와 같습니다.
  }
}

/**
 * 남아 있는 값의 주인을 확인합니다. 토큰을 새로 받을 때마다 부릅니다 (`storeTokens`).
 *
 * 앞에 남긴 사람과 **다른 사람**이면 값을 전부 지우고 새 주인을 적습니다. 같은 사람이면 아무것도 안 합니다 —
 * 강제 로그아웃 뒤 다시 로그인한 경우가 여기입니다.
 *
 * `owner` 를 알 수 없으면(null) 지우지 않습니다. 목업 토큰처럼 사용자 id 를 읽을 수 없는 경우인데, 이때 지우면
 * 재발급 때마다 값이 사라집니다.
 */
export function claimDrafts(owner: string | null) {
  if (owner === null) return

  try {
    const previous = sessionStorage.getItem(OWNER_KEY)
    if (previous !== null && previous !== owner) clearDrafts()
    sessionStorage.setItem(OWNER_KEY, owner)
  } catch {
    // 위와 같습니다.
  }
}
