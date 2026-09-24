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

/**
 * 네트워크 연결 상태입니다. `navigator.onLine` 은 동기 값이라(카메라·마이크처럼
 * 권한 응답을 기다릴 필요가 없어) 'unchecked' 없이 바로 available/failed 로 시작합니다.
 */
export type NetworkCheckStatus = 'available' | 'failed'
