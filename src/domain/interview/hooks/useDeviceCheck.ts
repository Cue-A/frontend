import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  DeviceCheckState,
  DeviceFailureReason,
  LightingCheckState,
  NetworkCheckState,
  NetworkQuality,
  NoiseCheckState,
} from '../types/deviceCheck'

const UNCHECKED: DeviceCheckState = { status: 'unchecked', failureReason: null }

function getErrorName(error: unknown): string | undefined {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name
  }
  if (error instanceof Error) {
    return error.name
  }
  return undefined
}

const RESUME_TRIGGER_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const

/**
 * 크롬·사파리는 사용자 제스처 없이 만든 AudioContext 를 'suspended' 로 시작합니다.
 * 마운트 시 자동으로 점검을 시작하므로 제스처가 없을 수 있어, 다음 클릭·키 입력에
 * resume 을 걸어둡니다. 이미 실행 중이면 즉시 resume 만 시도하고 리스너는 달지 않습니다.
 */
function resumeOnNextUserGesture(audioContext: AudioContext): () => void {
  audioContext.resume().catch(() => {})

  if (audioContext.state !== 'suspended') {
    return () => {}
  }

  const handleGesture = () => {
    audioContext.resume().catch(() => {})
  }

  for (const eventName of RESUME_TRIGGER_EVENTS) {
    document.addEventListener(eventName, handleGesture)
  }

  return () => {
    for (const eventName of RESUME_TRIGGER_EVENTS) {
      document.removeEventListener(eventName, handleGesture)
    }
  }
}

function classifyFailure(error: unknown): DeviceFailureReason {
  const name = getErrorName(error)

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return 'permission-denied'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
    return 'not-found'
  }
  return 'unknown'
}

/** `enumerateDevices` 결과 중 화면이 실제로 쓰는 필드만 추려둔 모양입니다 (이슈 #97). */
export type MediaDeviceOption = {
  deviceId: string
  label: string
}

function toDeviceOptions(devices: MediaDeviceInfo[], kind: MediaDeviceKind): MediaDeviceOption[] {
  return devices
    .filter((device) => device.kind === kind)
    .map((device) => ({ deviceId: device.deviceId, label: device.label }))
}

// 조명 임계값(이슈 #83). 캔버스 평균 밝기(0~255) 기준입니다 — 80~170 을 적정 구간으로
// 보고, 그 아래는 어두움, 위는 역광·직광 등으로 인한 과다노출(밝음)로 판정합니다.
// 상한은 원래 200 이었는데, 자동노출 때문에 후레쉬를 비춰도 실측 밝기가 200을 못 넘고
// 190대 초반에서 막혀서(실측 데이터: 평상시 127~140, 후레쉬 166~193) 170으로 낮췄습니다.
const LIGHTING_DIM_BELOW = 80
const LIGHTING_BRIGHT_ABOVE = 170

function classifyLighting(brightness: number): LightingCheckState['level'] {
  if (brightness < LIGHTING_DIM_BELOW) return 'dim'
  if (brightness > LIGHTING_BRIGHT_ABOVE) return 'bright'
  return 'good'
}

const LIGHTING_SAMPLE_INTERVAL_MS = 1000
// 분석 비용을 줄이려고 작게 줄여서 그립니다 — 판정에 색상 디테일은 필요 없습니다.
const LIGHTING_SAMPLE_SIZE = 32
// 프레임 전체를 재면 옷·배경 벽지 색이 평균을 끌어내려, 얼굴이 밝아도 "어두움"으로
// 오판정될 수 있다 (이슈 #83 리뷰). 카메라 구도상 얼굴이 보통 중앙에 오는 걸 가정하고,
// 가로·세로 각각 중앙 50% 만 잘라서 잰다.
const LIGHTING_CENTER_CROP_RATIO = 0.5

/**
 * 카메라 스트림 프레임을 주기적으로 작은 캔버스에 그려 평균 밝기를 잽니다.
 * `videoStream` 을 화면에 그리는 `<video>` 와는 별개로, 분석 전용 비표시(off-DOM)
 * `<video>` 를 하나 더 만들어 씁니다 — 화면의 `<video>` 는 DeviceCheckPage 가 소유하고
 * 있어서 훅이 거길 건드리면 "카메라·마이크 접근은 훅에서만" 원칙이 깨집니다.
 *
 * DOM 에 붙이지 않은 `<video>` 는 Safari/WebKit 에서 디코딩이 지연되거나 멈춰 `readyState`
 * 가 `HAVE_CURRENT_DATA` 에 못 미칠 수 있다 (PR #102 리뷰). 화면엔 안 보여야 하므로
 * `display:none` 대신 레이아웃 밖으로 밀어내는 방식으로 `document.body` 에 붙인다 —
 * `display:none` 도 일부 브라우저에서 디코딩을 멈출 수 있어 피한다.
 */
function startLightingMeter(stream: MediaStream, onSample: (state: LightingCheckState) => void): () => void {
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.setAttribute('aria-hidden', 'true')
  video.style.position = 'fixed'
  video.style.top = '0'
  video.style.left = '0'
  video.style.width = '1px'
  video.style.height = '1px'
  video.style.opacity = '0'
  video.style.pointerEvents = 'none'
  video.srcObject = stream
  document.body.appendChild(video)
  video.play().catch(() => {})

  const canvas = document.createElement('canvas')
  canvas.width = LIGHTING_SAMPLE_SIZE
  canvas.height = LIGHTING_SAMPLE_SIZE
  const context = canvas.getContext('2d', { willReadFrequently: true })

  const sample = () => {
    if (!context || video.readyState < video.HAVE_CURRENT_DATA) return
    if (video.videoWidth === 0 || video.videoHeight === 0) return

    const cropWidth = video.videoWidth * LIGHTING_CENTER_CROP_RATIO
    const cropHeight = video.videoHeight * LIGHTING_CENTER_CROP_RATIO
    const sourceX = (video.videoWidth - cropWidth) / 2
    const sourceY = (video.videoHeight - cropHeight) / 2

    context.drawImage(video, sourceX, sourceY, cropWidth, cropHeight, 0, 0, LIGHTING_SAMPLE_SIZE, LIGHTING_SAMPLE_SIZE)
    const { data } = context.getImageData(0, 0, LIGHTING_SAMPLE_SIZE, LIGHTING_SAMPLE_SIZE)

    let sum = 0
    let pixelCount = 0
    for (let i = 0; i < data.length; i += 4) {
      // ITU-R BT.601 휘도 가중치
      sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      pixelCount += 1
    }
    const brightness = sum / pixelCount
    onSample({ level: classifyLighting(brightness), brightness })
  }

  const intervalId = window.setInterval(sample, LIGHTING_SAMPLE_INTERVAL_MS)
  sample()

  return () => {
    window.clearInterval(intervalId)
    video.pause()
    video.srcObject = null
    video.remove()
  }
}

// 소음 임계값. dBFS 근사치 기준입니다 — 더 클수록(0에 가까울수록) 시끄럽습니다.
// 노이즈 억제를 끈 뒤 실측해보니 타이핑·생활소음만으로도 -39~-51dB 가 나와서(이슈 #83),
// -45 였던 기준이 그 범위 한가운데를 갈라 들쭉날쭉했다. 관찰된 최대치(-39)보다 여유를 두고
// -30 으로 올렸다 — 진짜 시끄러운 상황(대화·TV 등) 데이터로 추가 검증 필요.
const NOISE_WARNING_THRESHOLD_DB = -30
const NOISE_CALIBRATION_MS = 1500
const MIN_RMS = 1e-6

function rmsToDecibels(rms: number): number {
  return 20 * Math.log10(Math.max(rms, MIN_RMS))
}

function classifyNoise(decibels: number): NoiseCheckState['level'] {
  return decibels >= NOISE_WARNING_THRESHOLD_DB ? 'noisy' : 'good'
}

// 네트워크 품질 판정(PR #102 리뷰 반영, heejoo11 제안). downlink(Mbps)·rtt(ms) 수치를
// 직접 비교하는 대신 Network Information API 의 effectiveType 을 씁니다 — 브라우저가
// RTT·대역폭을 이미 4g/3g/2g/slow-2g 로 분류해서 주는 값이라(WHATWG 표준이 정의한
// 버킷: 대략 rtt<270ms·downlink>700Kbps 면 4g), "몇 Mbps 가 적당한가"를 우리가 임의로
// 정할 필요가 없습니다.
//
// 이전엔 downlink·rtt 를 직접 비교했는데(>= 10Mbps && <= 200ms), 실측해보니 LTE
// 핫스팟처럼 실제로 빠른 회선도 Chrome 이 downlink 를 최대 10 으로 캡해 보고해서(제보:
// MDN content 이슈 #18277 — 사용자 경험담, 공식 확인은 아님) "브라우저가 보고 가능한
// 상한에 닿았을 때만 양호" 가 되는 문제가 있었습니다. heejoo11 이 에뮬레이션으로 재확인:
// 20Mbps 를 걸어도 downlink 는 10 으로 캡됐고, 1.15Mbps(학교 wifi 실측)·5Mbps 둘 다
// effectiveType 은 `4g` 로 나와 캡과 무관하게 "양호"로 분류할 수 있음을 확인했습니다.
//
// 참고로 면접 진행 화면은 실시간 화상/음성 스트리밍을 하지 않습니다(WebRTC 없음,
// 웹소켓은 질문·진행률 JSON만 내려받고 녹화는 로컬 후 답변마다 한 번씩 업로드) — 그래서
// 애초에 화상통화급 대역폭 기준(Zoom·Meet 등)이 이 화면엔 안 맞았습니다. effectiveType
// 기준(`4g`)은 "일반적인 웹 사용에 충분한 수준"이라 이 화면의 가벼운 트래픽에 더 맞습니다.
/** 표준에 아직 없는 실험적 API라 타입을 직접 좁혀 씁니다. 지원 브라우저(Chrome·Edge 등)만 값이 옵니다. */
type NetworkInformationLike = {
  effectiveType?: string
  downlink?: number
  rtt?: number
  addEventListener?: (type: 'change', listener: () => void) => void
  removeEventListener?: (type: 'change', listener: () => void) => void
}

function getConnection(): NetworkInformationLike | null {
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection ?? null
}

/**
 * effectiveType 이 없는 브라우저는 품질을 판정할 수 없습니다 — "불안정"으로 비관적으로
 * 단정하지 않고 `good`으로 둡니다(이슈 #83: onLine 폴백과 같은 방침).
 */
function classifyNetworkQuality(effectiveType: string | undefined): NetworkQuality {
  return effectiveType === undefined || effectiveType === '4g' ? 'good' : 'unstable'
}

function readNetworkState(online: boolean): NetworkCheckState {
  if (!online) return { status: 'offline', downlinkMbps: null, rttMs: null }

  const connection = getConnection()
  if (!connection) {
    return { status: 'good', downlinkMbps: null, rttMs: null }
  }

  // downlink·rtt 는 더 이상 판정에 안 쓰지만, 행에 참고 수치로 보여주는 용도로는
  // 여전히 쓴다(DeviceCheckPage) — 값이 있으면 그대로 담고 없으면 null 로 둔다.
  const downlinkMbps = connection.downlink ?? null
  const rttMs = connection.rtt ?? null
  return { status: classifyNetworkQuality(connection.effectiveType), downlinkMbps, rttMs }
}

export type UseDeviceCheckResult = {
  camera: DeviceCheckState
  mic: DeviceCheckState
  network: NetworkCheckState
  lighting: LightingCheckState
  noise: NoiseCheckState
  videoStream: MediaStream | null
  /** 0(무음) ~ 1(최대) 범위로 정규화된 마이크 입력 레벨 */
  micLevel: number
  recheckCamera: () => void
  recheckMic: () => void
  cameraDevices: MediaDeviceOption[]
  micDevices: MediaDeviceOption[]
  selectedCameraId: string | null
  selectedMicId: string | null
  selectCamera: (deviceId: string) => void
  selectMic: (deviceId: string) => void
  /** 점검 중 고른 장치가 코드 뽑힘 등으로 목록에서 사라졌는지. 스트림은 그대로 두고 안내만 띄운다 (이슈 #97). */
  cameraDeviceMissing: boolean
  micDeviceMissing: boolean
}

/**
 * 카메라·마이크 접근과 마이크 입력 레벨 측정을 전담합니다.
 * 화면은 이 훅이 주는 상태만 그리고, getUserMedia·AudioContext 는 여기서만 다룹니다.
 */
export function useDeviceCheck(): UseDeviceCheckResult {
  const [camera, setCamera] = useState<DeviceCheckState>(UNCHECKED)
  const [mic, setMic] = useState<DeviceCheckState>(UNCHECKED)
  const [network, setNetwork] = useState<NetworkCheckState>(() => readNetworkState(navigator.onLine))
  const [lighting, setLighting] = useState<LightingCheckState>({ level: null, brightness: null })
  const [noise, setNoise] = useState<NoiseCheckState>({ level: null, decibels: null })
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [micLevel, setMicLevel] = useState(0)
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceOption[]>([])
  const [micDevices, setMicDevices] = useState<MediaDeviceOption[]>([])
  // 실제로 잡힌 스트림의 트랙 설정에서 읽은 값입니다(이슈 #97) — enumerateDevices 목록의
  // 첫 번째를 임의로 "선택됨"으로 보지 않고, 브라우저가 실제로 연 장치를 그대로 반영합니다.
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [selectedMicId, setSelectedMicId] = useState<string | null>(null)

  const videoStreamRef = useRef<MediaStream | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const stopLightingMeterRef = useRef<(() => void) | null>(null)
  // 요청을 보낼 때마다 하나씩 늘려서, 응답이 왔을 때 "지금도 유효한 요청인지" 를 봅니다.
  // 카메라·마이크가 각각 따로 재점검되므로 카운터도 따로 둡니다 — 하나로 묶으면
  // 마이크만 재점검해도 카메라의 진행 중인 요청까지 낡은 것으로 취급됩니다.
  const cameraRequestIdRef = useRef(0)
  const micRequestIdRef = useRef(0)
  const removeResumeListenersRef = useRef<(() => void) | null>(null)

  // 권한을 주기 전엔 label 이 빈 문자열이라(이슈 #97), camera·mic 중 하나라도 허용된
  // 뒤부터 부릅니다 — 그 전엔 목록이 있어도 쓸모가 없어 비워둡니다.
  const refreshDeviceLists = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setCameraDevices(toDeviceOptions(devices, 'videoinput'))
      setMicDevices(toDeviceOptions(devices, 'audioinput'))
    } catch (error) {
      console.error('장치 목록 조회 실패', error)
    }
  }, [])

  const stopCamera = useCallback(() => {
    stopLightingMeterRef.current?.()
    stopLightingMeterRef.current = null
    setLighting({ level: null, brightness: null })
    videoStreamRef.current?.getTracks().forEach((track) => track.stop())
    videoStreamRef.current = null
    setVideoStream(null)
  }, [])

  const stopMic = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    removeResumeListenersRef.current?.()
    removeResumeListenersRef.current = null
    if (audioContextRef.current) {
      audioContextRef.current.onstatechange = null
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    audioStreamRef.current?.getTracks().forEach((track) => track.stop())
    audioStreamRef.current = null
    setMicLevel(0)
    setNoise({ level: null, decibels: null })
  }, [])

  const startMicMeter = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    audioContextRef.current = audioContext
    removeResumeListenersRef.current = resumeOnNextUserGesture(audioContext)

    const buffer = new Uint8Array(analyser.fftSize)

    // 배경 잡음을 0으로 접어두고, 그 위 구간만 증폭해 평소 대화 음량에서도
    // 막대가 눈에 띄게 움직이도록 합니다.
    const NOISE_FLOOR = 0.01
    const GAIN = 6

    // 주변소음 판정(이슈 #83)용 보정 구간입니다. "말하기 전" 구간의 RMS 평균을 노이즈
    // 플로어로 보고, NOISE_CALIBRATION_MS 가 지나면 한 번만 dB 로 환산해 고정합니다.
    // 계속 갱신하면 사용자가 말할 때마다 RMS 가 올라가 "시끄러움"으로 잘못 뜹니다.
    //
    // AudioContext 가 'suspended' 로 시작하면(resumeOnNextUserGesture) 그동안은 분석기에
    // 무음만 들어와, 경과 시간을 그대로 재면 그 무음 구간이 "조용함" 으로 고정될 수
    // 있다 (PR #102 리뷰). 'running' 이 된 뒤부터만 경과 시간을 잽니다.
    const meterStartedAt = performance.now()
    let calibrationStartedAt: number | null = null
    const calibrationSamples: number[] = []
    let calibrated = false
    // 폴백(데드라인 초과)으로 마감했는지 표시합니다. 폴백 마감은 suspended 상태의 무음을
    // 근거로 한 "잠정값" 이라, 이후 실제로 running 이 되면 처음부터 다시 재야 합니다 —
    // 그렇지 않으면 진짜 시끄러운 방에서도 "양호"로 세션 끝까지 고정됩니다 (PR #102 리뷰).
    let calibratedViaFallback = false

    // 위 타이밍 수정이 새로 만드는 경계 상황들을 마무리합니다 (PR #102 뒷정리 코드리뷰):
    //
    // 1) 제스처 없이 들어온 뒤(새로고침·직접 진입 등) 끝까지 제스처가 한 번도 없으면
    //    state 가 계속 'suspended' 에 머물러 calibrationStartedAt 이 null 로 남고, 보정이
    //    영원히 끝나지 않는다. meterStartedAt 기준 데드라인을 넘기면 그때까지 모인
    //    샘플(하나도 없으면 그 순간의 rms)로 그냥 마감한다(= 폴백 마감).
    // 2) 보정 도중 AudioContext 가 다시 'suspended' 로 빠지면(탭 백그라운드 등)
    //    calibrationStartedAt 이 과거 시점에 멈춰 있어, 복귀 즉시 몇 개 안 되는 샘플만으로
    //    데드라인을 넘긴 것처럼 보여 너무 일찍 마감된다. 'running' 이 아니게 되는 순간
    //    calibrationStartedAt 을 리셋해 다음 'running' 구간에서 다시 NOISE_CALIBRATION_MS
    //    만큼 잰다 — 이미 모은 샘플은 버리지 않고 이어서 평균한다.
    // 3) 폴백 마감 뒤에 뒤늦게 running 이 되면(예: 사용자가 나중에 아무 키나 누름), 잠정값을
    //    그대로 둔 채 끝내지 않고 처음부터 다시 보정한다.
    const CALIBRATION_FALLBACK_DEADLINE_MS = NOISE_CALIBRATION_MS * 4

    // stopMic 에서 close() 직전에 null 로 비워 해제합니다 — 이 훅의 다른 리스너
    // (removeResumeListenersRef) 와 같은 "달면 반드시 떼는" 관례를 따릅니다.
    audioContext.onstatechange = () => {
      if (audioContext.state === 'running' && calibratedViaFallback) {
        calibrated = false
        calibratedViaFallback = false
        calibrationStartedAt = null
        calibrationSamples.length = 0
        // 재보정이 시작됐다고 화면에도 알립니다 — 안 알리면 noise.level 이 폴백 때
        // 잠긴 값(good/noisy)에 그대로 머물러, DeviceCheckPage 의 안내 문구가 "측정
        // 중이니 기다려주세요"로 안 돌아가고 "말해보세요"인 채로 남습니다. 그러면
        // 재보정 구간에 사용자가 말을 하게 되어 choitjddn0311 의 원래 지적(보정 중
        // 목소리가 노이즈 플로어에 섞이는 문제)이 이 경로에서 재현됩니다.
        setNoise({ level: null, decibels: null })
        return
      }
      if (!calibrated && audioContext.state !== 'running') {
        calibrationStartedAt = null
      }
    }

    const finalizeCalibration = (samples: number[], viaFallback: boolean) => {
      calibrated = true
      calibratedViaFallback = viaFallback
      const averageRms = samples.reduce((sum, sample) => sum + sample, 0) / samples.length
      const decibels = Math.round(rmsToDecibels(averageRms))
      setNoise({ level: classifyNoise(decibels), decibels })
    }

    const tick = () => {
      analyser.getByteTimeDomainData(buffer)

      let sumSquares = 0
      for (let i = 0; i < buffer.length; i++) {
        const normalized = (buffer[i] - 128) / 128
        sumSquares += normalized * normalized
      }
      const rms = Math.sqrt(sumSquares / buffer.length)
      const level = rms <= NOISE_FLOOR ? 0 : Math.min(1, (rms - NOISE_FLOOR) * GAIN)

      if (!calibrated) {
        if (audioContext.state === 'running') {
          if (calibrationStartedAt === null) {
            calibrationStartedAt = performance.now()
          }
          calibrationSamples.push(rms)
          if (performance.now() - calibrationStartedAt >= NOISE_CALIBRATION_MS) {
            finalizeCalibration(calibrationSamples, false)
          }
        } else if (performance.now() - meterStartedAt >= CALIBRATION_FALLBACK_DEADLINE_MS) {
          finalizeCalibration(calibrationSamples.length > 0 ? calibrationSamples : [rms], true)
        }
      }

      setMicLevel(level)
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
  }, [])

  // 마운트 시엔 초기값이 이미 'unchecked' 이므로 리셋 없이 바로 요청만 보내는
  // acquire* 를 쓰고, 재점검(버튼 클릭)에서만 즉시 리셋합니다.
  //
  // StrictMode 는 effect 를 두 번 돌립니다. 첫 번째 getUserMedia 요청이 (언마운트로)
  // 낡아진 뒤에도 두 번째 마운트 이후에 응답이 도착할 수 있는데, 예전엔 "마운트
  // 여부"만 봐서 이걸 그냥 통과시켰습니다. 그러면 낡은 스트림이 videoStreamRef 에
  // 들어갔다가 최신 스트림에 덮어써져서 stopCamera 가 그 트랙을 못 찾고, 카메라가
  // 꺼지지 않은 채 남았습니다. requestId 는 "이 응답이 지금 보낸 가장 최신 요청의
  // 응답인지" 를 보므로 재점검 중 빠르게 두 번 누른 경우의 경쟁 상태도 같이 막습니다.
  const acquireCamera = useCallback(async (deviceId?: string) => {
    const requestId = ++cameraRequestIdRef.current

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      })

      if (requestId !== cameraRequestIdRef.current) {
        // 이 사이 재점검이 돌았거나 언마운트됐습니다. ref 에 넣지 말고 바로 반납합니다.
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      videoStreamRef.current = stream
      setVideoStream(stream)
      setCamera({ status: 'available', failureReason: null })
      stopLightingMeterRef.current = startLightingMeter(stream, setLighting)
      // 요청한 deviceId 가 아니라 브라우저가 실제로 연 장치를 따릅니다 — 처음 마운트 시
      // deviceId 없이 불러 브라우저 기본값이 뭔지 아직 모를 때도 이 값으로 알 수 있습니다.
      setSelectedCameraId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? null)
      void refreshDeviceLists()
    } catch (error) {
      const failureReason = classifyFailure(error)
      if (requestId === cameraRequestIdRef.current) {
        setCamera({ status: 'failed', failureReason })
      }
      console.error('카메라 점검 실패 reason=%s', failureReason)
    }
  }, [refreshDeviceLists])

  const acquireMic = useCallback(async (deviceId?: string) => {
    const requestId = ++micRequestIdRef.current

    try {
      // 주변소음 판정(이슈 #83)엔 노이즈 억제가 걸리지 않은 원음이 필요하다. `audio: true`
      // 만 주면 브라우저가 기본으로 noiseSuppression·echoCancellation·autoGainControl 을
      // 켜서, 실제론 시끄러워도 억제된(깨끗해진) 신호만 분석기에 들어와 "양호"로 잘못
      // 판정된다 (실제 테스트로 확인됨). 세 옵션을 꺼서 원음을 그대로 받는다.
      //
      // 이 설정은 면접 진행 화면(useMediaStream)의 실제 녹음 스트림과는 다르다 — 그쪽은
      // `audio: true` 로 세 옵션이 기본값(켜짐)인 채로 녹음한다. 즉 여기서 재는 "조용함/
      // 시끄러움" 은 녹음에 실제로 들어갈 노이즈 억제된 신호 기준이 아니다 (PR #102 리뷰).
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          noiseSuppression: false,
          echoCancellation: false,
          autoGainControl: false,
        },
      })

      if (requestId !== micRequestIdRef.current) {
        // startMicMeter 를 부르기 전에 걸러서, 낡은 요청을 위한 AudioContext 자체를
        // 만들지 않습니다. 트랙만 정리하면 되고 닫을 AudioContext 가 없습니다.
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      audioStreamRef.current = stream
      setMic({ status: 'available', failureReason: null })
      startMicMeter(stream)
      setSelectedMicId(stream.getAudioTracks()[0]?.getSettings().deviceId ?? null)
      void refreshDeviceLists()
    } catch (error) {
      const failureReason = classifyFailure(error)
      if (requestId === micRequestIdRef.current) {
        setMic({ status: 'failed', failureReason })
      }
      console.error('마이크 점검 실패 reason=%s', failureReason)
    }
  }, [startMicMeter, refreshDeviceLists])

  const recheckCamera = useCallback(() => {
    stopCamera()
    setCamera(UNCHECKED)
    acquireCamera(selectedCameraId ?? undefined)
  }, [stopCamera, acquireCamera, selectedCameraId])

  const recheckMic = useCallback(() => {
    stopMic()
    setMic(UNCHECKED)
    acquireMic(selectedMicId ?? undefined)
  }, [stopMic, acquireMic, selectedMicId])

  // 사용자가 드롭다운에서 다른 장치를 고르면(이슈 #97) 재점검과 똑같이 멈췄다 새로 잡되,
  // 고른 장치로 바로 요청합니다. selectedCameraId/selectedMicId 를 먼저 낙관적으로
  // 바꿔두는 이유는, <select> 가 이 값으로 제어되는 controlled 컴포넌트라 여기서 안
  // 바꾸면 acquire 가 끝날 때까지 드롭다운이 고른 걸 보여주지 못하고 이전 값으로
  // 잠깐(혹은 실패 시 계속) 되돌아가 보이기 때문입니다. 성공하면 acquireCamera/
  // acquireMic 이 실제 트랙 값으로 다시 한번 맞춥니다(보통 같은 값).
  const selectCamera = useCallback(
    (deviceId: string) => {
      setSelectedCameraId(deviceId)
      stopCamera()
      setCamera(UNCHECKED)
      acquireCamera(deviceId)
    },
    [stopCamera, acquireCamera],
  )

  const selectMic = useCallback(
    (deviceId: string) => {
      setSelectedMicId(deviceId)
      stopMic()
      setMic(UNCHECKED)
      acquireMic(deviceId)
    },
    [stopMic, acquireMic],
  )

  useEffect(() => {
    const updateNetwork = () => setNetwork(readNetworkState(navigator.onLine))

    window.addEventListener('online', updateNetwork)
    window.addEventListener('offline', updateNetwork)

    // Network Information API 지원 브라우저는 onLine 이 그대로인 채 품질만 바뀔 수
    // 있어서(예: wifi 에서 LTE 로 전환), online/offline 이벤트만으론 못 잡습니다.
    const connection = getConnection()
    connection?.addEventListener?.('change', updateNetwork)

    return () => {
      window.removeEventListener('online', updateNetwork)
      window.removeEventListener('offline', updateNetwork)
      connection?.removeEventListener?.('change', updateNetwork)
    }
  }, [])

  // 장치가 꽂히거나 빠지면(이슈 #97) 목록만 새로 받습니다. 지금 쓰고 있는 스트림은
  // 여기서 건드리지 않습니다 — 고른 장치가 빠졌는지는 cameraDeviceMissing/micDeviceMissing
  // 로 알리고, 안내만 할 뿐 스트림을 끊거나 다른 장치로 자동 전환하지 않습니다.
  useEffect(() => {
    navigator.mediaDevices.addEventListener('devicechange', refreshDeviceLists)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDeviceLists)
    }
  }, [refreshDeviceLists])

  useEffect(() => {
    void (async () => {
      await Promise.all([acquireCamera(), acquireMic()])
    })()

    return () => {
      // 아직 응답하지 않은 요청을 낡은 것으로 만듭니다. 언마운트 뒤에 응답이 와도
      // acquire* 안의 requestId 비교에서 걸러져 ref 에 들어가지 않습니다.
      cameraRequestIdRef.current += 1
      micRequestIdRef.current += 1
      stopCamera()
      stopMic()
    }
  }, [acquireCamera, acquireMic, stopCamera, stopMic])

  // 목록이 아직 비어 있는(권한 전 · 첫 enumerate 전) 동안은 "사라짐"으로 오판하지 않습니다.
  const cameraDeviceMissing =
    selectedCameraId !== null && cameraDevices.length > 0 && !cameraDevices.some((device) => device.deviceId === selectedCameraId)
  const micDeviceMissing =
    selectedMicId !== null && micDevices.length > 0 && !micDevices.some((device) => device.deviceId === selectedMicId)

  return {
    camera,
    mic,
    network,
    lighting,
    noise,
    videoStream,
    micLevel,
    recheckCamera,
    recheckMic,
    cameraDevices,
    micDevices,
    selectedCameraId,
    selectedMicId,
    selectCamera,
    selectMic,
    cameraDeviceMissing,
    micDeviceMissing,
  }
}
