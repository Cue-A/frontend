/**
 * 카메라·마이크 점검 상태를 나타냅니다.
 * 권한 미부여를 'available' 로 처리하지 않기 위해 'unchecked' 를 별도로 둡니다.
 */
export type DeviceCheckStatus = 'unchecked' | 'available' | 'failed'

/**
 * 실패 사유. 권한 거부와 장치 없음은 사용자가 취할 행동이 달라 구분합니다.
 * - permission-denied: 브라우저 권한 설정에서 허용 필요
 * - not-found: 장치 연결 확인 필요
 * - unknown: 그 외 오류
 */
export type DeviceFailureReason = 'permission-denied' | 'not-found' | 'unknown'

export type DeviceCheckState = {
  status: DeviceCheckStatus
  failureReason: DeviceFailureReason | null
}
