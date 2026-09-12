import type { DeviceCheckState } from '../types/deviceCheck'

export type DeviceCheckSnapshot = {
  camera: DeviceCheckState
  mic: DeviceCheckState
}

/**
 * INT-4 미확정 사항, 이슈 #9: 마이크·카메라 실패 시 면접 시작을 막을지 여부가
 * 아직 정책으로 확정되지 않았습니다 (마이크는 필수 가능성이 높고, 카메라는 필수/선택 미정).
 * 정책이 정해지면 이 함수 안의 판정 로직만 고치면 됩니다 — 호출부는 바꿀 필요 없습니다.
 *
 * 임시 판정: 마이크가 사용 가능할 때만 시작을 허용합니다.
 */
export function canStartInterview(devices: DeviceCheckSnapshot): boolean {
  return devices.mic.status === 'available'
}
