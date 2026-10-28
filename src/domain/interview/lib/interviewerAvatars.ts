export type AvatarId = 'A' | 'B' | 'C' | 'D'

export type AvatarHairStyle = 'short' | 'long' | 'bun'

/**
 * 면접관 아바타 프리셋. 피부·머리·옷 색은 디자인 전달 문서(프론트 전달 — 면접관 아바타)의 값
 * 그대로이고, 일러스트 색이라 디자인 토큰 대신 여기서 관리한다.
 * 다섯 번째 아바타는 이 배열에 한 줄 추가하면 된다.
 */
export type AvatarPreset = {
  id: AvatarId
  skin: string
  /** 귀 안쪽 · 턱 밑 그림자 · 코에 쓰는 피부 음영색 */
  skinShade: string
  hair: string
  shirt: string
  hairStyle: AvatarHairStyle
  glasses: boolean
  beard: boolean
  /** 눈 깜빡임 시작 지연(초). 아바타마다 달라서 여러 명이 동시에 깜빡이지 않는다. */
  blinkDelaySec: number
}

export const AVATAR_PRESETS: readonly AvatarPreset[] = [
  { id: 'A', skin: '#F0997B', skinShade: '#D98A70', hair: '#2C2C2A', shirt: '#85B7EB', hairStyle: 'short', glasses: false, beard: false, blinkDelaySec: 0 },
  { id: 'B', skin: '#F5C4B3', skinShade: '#E3AE9C', hair: '#5F5E5A', shirt: '#B4B2A9', hairStyle: 'short', glasses: true, beard: true, blinkDelaySec: -1.4 },
  { id: 'C', skin: '#F0997B', skinShade: '#D98A70', hair: '#4A1B0C', shirt: '#AFA9EC', hairStyle: 'long', glasses: false, beard: false, blinkDelaySec: -2.7 },
  { id: 'D', skin: '#FAECE7', skinShade: '#E3D3CC', hair: '#2C2C2A', shirt: '#9FE1CB', hairStyle: 'bun', glasses: true, beard: false, blinkDelaySec: -3.6 },
]

/**
 * 세션 id 로 아바타를 고른다. 무작위가 아니라 id 해시라서 면접 중 새로고침해도 같은 얼굴이
 * 나오고, 세션이 다르면 (대체로) 다른 얼굴이 나온다.
 */
export function pickAvatarPreset(sessionId: string): AvatarPreset {
  let hash = 0
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) >>> 0
  }
  return AVATAR_PRESETS[hash % AVATAR_PRESETS.length]
}
