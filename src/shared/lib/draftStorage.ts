/**
 * 로그인한 사람이 고르던 값을 **이 탭에** 잠깐 남겨 두는 자리입니다 (sessionStorage).
 *
 * 화면을 옮겼다 돌아와도 값이 남아 있어야 할 때 씁니다. 예) 옵션 설정 → 장치 테스트 → "← 옵션".
 * 화면의 `useState` 는 화면을 떠나는 순간 사라져서, 돌아오면 처음 값으로 돌아갔습니다.
 *
 * - 탭을 닫으면 사라집니다. 며칠 뒤에 들어왔는데 예전 값이 채워져 있으면 오히려 헷갈립니다
 * - 로그아웃 · 재발급 실패로 토큰을 지울 때 **같이 지웁니다** (`clearTokens` 가 `clearDrafts` 를 부릅니다).
 *   같은 탭에서 다른 계정으로 들어왔을 때 앞 사람이 고른 문서 같은 값이 남으면 안 됩니다
 * - 저장소를 막아둔 브라우저(사생활 보호 모드 등)에서는 조용히 저장만 안 됩니다. 화면은 그대로 동작합니다
 */
const PREFIX = 'cue-a:draft:'

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

/** 이 자리에 남긴 값을 전부 지웁니다. 토큰을 지울 때 같이 부릅니다 */
export function clearDrafts() {
  try {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(PREFIX)) keys.push(key)
    }
    keys.forEach((key) => sessionStorage.removeItem(key))
  } catch {
    // 위와 같습니다.
  }
}
