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
 * 조명 판정 3단계입니다 (이슈 #83). 캔버스로 구한 평균 밝기(0~255)가 적정 구간(80~170) 안에
 * 있으면 양호, 너무 밝거나(역광·직광) 너무 어두우면 각각 bright·dim 입니다 — "조금 어두운
 * 정도"를 따로 두지 않고, 문제가 있는 두 구간과 괜찮은 구간으로만 나눕니다. Figma 환경 체크
 * 행엔 success·warning 두 톤만 있어서, bright·dim 모두 warning 톤을 쓰고 라벨 글자로만
 * 구분합니다 (DeviceCheckPage.tsx ENV_ROW_TONE_CLASS 주석 참고).
 */
export type LightingLevel = 'dim' | 'good' | 'bright'

export type LightingCheckState = {
  /** 측정 전엔 null. 카메라가 꺼지면(재점검 포함) 다시 null 로 돌아갑니다. */
  level: LightingLevel | null
  /** 0(검정)~255(흰색) 평균 밝기. 화면엔 안 보이고 level 판정에만 씁니다. */
  brightness: number | null
}

/**
 * 주변소음 판정 2단계입니다 (이슈 #83). 마이크를 잡은 뒤 1.5초간(말하기 전 구간으로
 * 가정) RMS 평균을 노이즈 플로어로 잡아 dB 로 근사 환산하고, 그 뒤로는 고정값입니다 —
 * 말하는 동안 RMS 가 올라갈 때마다 "시끄러움"으로 깜빡이면 안 되기 때문입니다.
 */
export type NoiseLevel = 'good' | 'noisy'

export type NoiseCheckState = {
  /** 보정(calibration)이 끝나기 전엔 null. */
  level: NoiseLevel | null
  /** dBFS 근사치(음수, 작을수록 조용함). 보정 전엔 null. */
  decibels: number | null
}

/**
 * 네트워크 상태입니다. `offline` 은 `navigator.onLine`/online·offline 이벤트 기준이고,
 * `good`/`unstable` 은 Network Information API(`navigator.connection`)의 downlink·rtt
 * 기준 품질 판정입니다 (이슈 #83). 미지원 브라우저는 온라인이기만 하면 `good` 으로 두고
 * (판정할 수치가 없어 비관적으로 "불안정"이라 하지 않습니다) downlinkMbps·rttMs 를 null 로 둡니다.
 */
export type NetworkQuality = 'good' | 'unstable'
export type NetworkCheckStatus = 'offline' | NetworkQuality

export type NetworkCheckState = {
  status: NetworkCheckStatus
  /** Network Information API 미지원이면 null. */
  downlinkMbps: number | null
  /** Network Information API 미지원이면 null. */
  rttMs: number | null
}
