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

// 네트워크 임계값. 여전히 임시값입니다 — PR #102 에서 실측했지만 기준을 못 정하고
// 팀 논의로 넘겼습니다. Network Information API 의 downlink(Mbps)·rtt(ms) 기준입니다.
//
// 실측 결과: 개인 핫스팟(LTE)에서 downlink 가 정확히 10.0 으로 나와, Chrome 이
// downlink 를 최대 10 으로 캡해 보고한다는 제보(MDN content 이슈 #18277)와 일치했습니다.
// ">= 10" 은 사실상 "브라우저가 보고 가능한 상한에 닿았을 때만 양호" 였던 셈이라,
// 캡에 안 걸리면서도 충분히 쓸만한 보통 네트워크가 "불안정"으로 묶일 수 있습니다.
//
// 그런데 "몇 Mbps 가 적당한가" 는 이 화면만 봐서는 못 정합니다 — 면접 진행 화면은
// 실시간 화상/음성 스트리밍을 하지 않습니다(WebRTC 없음, 웹소켓은 질문·진행률 JSON만
// 내려받음). 녹화는 전부 로컬에서 하고 답변마다 한 번씩 presigned URL 로 업로드할
// 뿐이라, 화상통화급 대역폭 기준(Zoom·Meet 등)은 이 앱 트래픽과 안 맞습니다. 게다가
// `downlink` 는 다운로드 추정치라 정작 중요한 업로드 속도는 애초에 이 값으로 못 잽니다.
// 기준을 낮춘다면 "업로드가 과하게 느려 멈추지 않을 정도" 가 목표가 되어야 하는데,
// 그 기준을 세울 실측 데이터(답변 영상 업로드 소요 시간 등)가 아직 없습니다.
//
// 참고: 네트워크를 바꾼 직후엔 downlink 추정치가 바로 안 갱신되고 이전 값이 한동안
// 남아있을 수 있습니다(실측으로 확인) — 페이지가 떠 있는 동안의 'change' 이벤트는
// 구독하지만(아래 useEffect), 탭을 새로고침하지 않은 채 운영체제 수준에서만 네트워크를
// 바꾸면 브라우저의 재추정이 늦게 따라올 수 있습니다.
const NETWORK_GOOD_DOWNLINK_MBPS = 10
const NETWORK_GOOD_RTT_MS = 200

/** 표준에 아직 없는 실험적 API라 타입을 직접 좁혀 씁니다. 지원 브라우저(Chrome·Edge 등)만 값이 옵니다. */
type NetworkInformationLike = {
  downlink?: number
  rtt?: number
  addEventListener?: (type: 'change', listener: () => void) => void
  removeEventListener?: (type: 'change', listener: () => void) => void
}

function getConnection(): NetworkInformationLike | null {
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection ?? null
}

function classifyNetworkQuality(downlinkMbps: number, rttMs: number): NetworkQuality {
  return downlinkMbps >= NETWORK_GOOD_DOWNLINK_MBPS && rttMs <= NETWORK_GOOD_RTT_MS ? 'good' : 'unstable'
}

/**
 * 미지원 브라우저는 수치가 없어 품질을 판정할 수 없습니다 — "불안정"으로 비관적으로
 * 단정하지 않고, 연결만 됐으면 `good`(이슈 #83: onLine 폴백)으로 둡니다.
 */
function readNetworkState(online: boolean): NetworkCheckState {
  if (!online) return { status: 'offline', downlinkMbps: null, rttMs: null }

  const connection = getConnection()
  if (!connection || connection.downlink === undefined || connection.rtt === undefined) {
    return { status: 'good', downlinkMbps: null, rttMs: null }
  }

  const downlinkMbps = connection.downlink
  const rttMs = connection.rtt
  return { status: classifyNetworkQuality(downlinkMbps, rttMs), downlinkMbps, rttMs }
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
    let calibrationStartedAt: number | null = null
    const calibrationSamples: number[] = []
    let calibrated = false

    const tick = () => {
      analyser.getByteTimeDomainData(buffer)

      let sumSquares = 0
      for (let i = 0; i < buffer.length; i++) {
        const normalized = (buffer[i] - 128) / 128
        sumSquares += normalized * normalized
      }
      const rms = Math.sqrt(sumSquares / buffer.length)
      const level = rms <= NOISE_FLOOR ? 0 : Math.min(1, (rms - NOISE_FLOOR) * GAIN)

      if (!calibrated && audioContext.state === 'running') {
        if (calibrationStartedAt === null) {
          calibrationStartedAt = performance.now()
        }
        calibrationSamples.push(rms)
        if (performance.now() - calibrationStartedAt >= NOISE_CALIBRATION_MS) {
          calibrated = true
          const averageRms = calibrationSamples.reduce((sum, sample) => sum + sample, 0) / calibrationSamples.length
          const decibels = Math.round(rmsToDecibels(averageRms))
          setNoise({ level: classifyNoise(decibels), decibels })
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
  const acquireCamera = useCallback(async () => {
    const requestId = ++cameraRequestIdRef.current

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      if (requestId !== cameraRequestIdRef.current) {
        // 이 사이 재점검이 돌았거나 언마운트됐습니다. ref 에 넣지 말고 바로 반납합니다.
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      videoStreamRef.current = stream
      setVideoStream(stream)
      setCamera({ status: 'available', failureReason: null })
      stopLightingMeterRef.current = startLightingMeter(stream, setLighting)
    } catch (error) {
      const failureReason = classifyFailure(error)
      if (requestId === cameraRequestIdRef.current) {
        setCamera({ status: 'failed', failureReason })
      }
      console.error('카메라 점검 실패 reason=%s', failureReason)
    }
  }, [])

  const acquireMic = useCallback(async () => {
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
        audio: { noiseSuppression: false, echoCancellation: false, autoGainControl: false },
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
    } catch (error) {
      const failureReason = classifyFailure(error)
      if (requestId === micRequestIdRef.current) {
        setMic({ status: 'failed', failureReason })
      }
      console.error('마이크 점검 실패 reason=%s', failureReason)
    }
  }, [startMicMeter])

  const recheckCamera = useCallback(() => {
    stopCamera()
    setCamera(UNCHECKED)
    acquireCamera()
  }, [stopCamera, acquireCamera])

  const recheckMic = useCallback(() => {
    stopMic()
    setMic(UNCHECKED)
    acquireMic()
  }, [stopMic, acquireMic])

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
  }
}
