import {
  IconAlertTriangle,
  IconBulb,
  IconCheck,
  IconPointFilled,
  IconShield,
  IconVolume,
  IconWifi,
  IconX,
} from '@tabler/icons-react'
import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ROUTES, toInterview } from '@/app/routes'

import { useDeviceCheck } from '../hooks/useDeviceCheck'
import { canStartInterview } from '../lib/canStartInterview'
import type {
  DeviceCheckState,
  DeviceFailureReason,
  LightingCheckState,
  NetworkCheckState,
  NoiseCheckState,
} from '../types/deviceCheck'

import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import StepIndicator from './StepIndicator'

const SUMMARY_ROW_LABELS = ['직무', '질문 수', '답변 시간', '면접관'] as const

/**
 * 환경 체크 4항목입니다. 조명·주변소음·네트워크는 `useDeviceCheck` 의 실측 로직을
 * 그대로 보여주고(이슈 #83), 네트워크는 오른쪽 "준비 상태" 패널과 같은 출처라 두
 * 패널이 서로 다른 말을 하지 않는다 (PR #84 리뷰). 브라우저 권한은 새 API 없이
 * 카메라·마이크 점검 결과(failureReason)를 재사용한다.
 */
const ENV_CHECK_ITEMS = [
  { key: 'lighting', label: '조명', Icon: IconBulb },
  { key: 'noise', label: '주변 소음', Icon: IconVolume },
  { key: 'network', label: '네트워크', Icon: IconWifi },
  { key: 'permission', label: '브라우저 권한', Icon: IconShield },
] as const

type EnvCheckKey = (typeof ENV_CHECK_ITEMS)[number]['key']

type EnvCheckDisplay = {
  value: string
  valueTone: 'placeholder' | 'normal'
  badgeTone: 'neutral' | 'success' | 'warning' | 'danger'
  badgeLabel: string
}

const PLACEHOLDER_DISPLAY: EnvCheckDisplay = {
  value: '측정 준비 중',
  valueTone: 'placeholder',
  badgeTone: 'neutral',
  badgeLabel: '확인 전',
}

/** 해당하는 장치만 짚는다 — 하나만 문제인데 둘 다 문제인 것처럼 보이지 않도록. */
function deviceTarget(camera: boolean, mic: boolean): string {
  if (camera && mic) return '카메라·마이크'
  return camera ? '카메라' : '마이크'
}

function envCheckDisplay(
  key: EnvCheckKey,
  camera: DeviceCheckState,
  mic: DeviceCheckState,
  network: NetworkCheckState,
  lighting: LightingCheckState,
  noise: NoiseCheckState,
): EnvCheckDisplay {
  if (key === 'lighting') {
    if (lighting.level === null) return PLACEHOLDER_DISPLAY
    if (lighting.level === 'good') {
      return { value: '밝기가 적당해요', valueTone: 'normal', badgeTone: 'success', badgeLabel: '양호' }
    }
    if (lighting.level === 'bright') {
      return { value: '너무 밝아요. 조명을 조금 낮춰주세요', valueTone: 'normal', badgeTone: 'warning', badgeLabel: '밝음' }
    }
    return { value: '너무 어두워요. 조명을 켜주세요', valueTone: 'normal', badgeTone: 'warning', badgeLabel: '어두움' }
  }

  if (key === 'noise') {
    if (noise.level === null || noise.decibels === null) return PLACEHOLDER_DISPLAY
    // dB 수치는 기기마다 기준이 달라 사용자에게 의미가 전달되지 않고, 오히려 판정의
    // 신뢰도를 깎을 수 있어 보여주지 않는다 (PR #102 리뷰).
    return noise.level === 'good'
      ? { value: '조용해요', valueTone: 'normal', badgeTone: 'success', badgeLabel: '양호' }
      : { value: '주변이 시끄러워요', valueTone: 'normal', badgeTone: 'warning', badgeLabel: '시끄러움' }
  }

  if (key === 'network') {
    if (network.status === 'offline') {
      return { value: '연결이 끊겼어요', valueTone: 'normal', badgeTone: 'danger', badgeLabel: '끊김' }
    }

    // Network Information API 미지원이면 수치가 없어, 기존처럼 온라인 여부만 말한다.
    const value =
      network.downlinkMbps !== null && network.rttMs !== null
        ? `${network.downlinkMbps}Mbps · 지연 ${network.rttMs}ms`
        : '온라인 상태예요'

    return network.status === 'good'
      ? { value, valueTone: 'normal', badgeTone: 'success', badgeLabel: '양호' }
      : { value, valueTone: 'normal', badgeTone: 'warning', badgeLabel: '불안정' }
  }

  if (key === 'permission') {
    const cameraDenied = camera.failureReason === 'permission-denied'
    const micDenied = mic.failureReason === 'permission-denied'
    // 장치 없음(not-found) · 기타 오류(unknown)는 권한을 묻기 전에 실패할 수 있어서 권한이
    // 허용됐는지 알 수 없다. 여기서 "허용"으로 빠지면 왼쪽 패널의 빨간 "실패"와 어긋난다.
    const cameraFailed = camera.status === 'failed'
    const micFailed = mic.status === 'failed'
    const pending = camera.status === 'unchecked' || mic.status === 'unchecked'

    if (cameraDenied || micDenied) {
      const target = deviceTarget(cameraDenied, micDenied)
      return { value: `${target} 권한이 거부됐어요`, valueTone: 'normal', badgeTone: 'danger', badgeLabel: '거부됨' }
    }
    if (cameraFailed || micFailed) {
      const target = deviceTarget(cameraFailed, micFailed)
      return { value: `${target} 문제로 권한을 확인하지 못했어요`, valueTone: 'normal', badgeTone: 'warning', badgeLabel: '확인 필요' }
    }
    if (pending) {
      return { value: '확인 중이에요', valueTone: 'placeholder', badgeTone: 'neutral', badgeLabel: '확인 중' }
    }
    return { value: '카메라·마이크 허용됨', valueTone: 'normal', badgeTone: 'success', badgeLabel: '허용' }
  }

  // 위 네 분기가 EnvCheckKey 를 전부 다루지만, if 체인이라 TS 가 그걸 못 봐서 타입상 필요한 반환문.
  return PLACEHOLDER_DISPLAY
}

/**
 * 환경 체크 행의 상태별 색입니다. Figma 에는 success(1375:1491 "양호")와 warning
 * (1375:1480 "시끄러움") 두 가지만 있고, 값이 badge 토큰과 거의 같아 새 토큰 없이 쓴다:
 * 행 배경 rgba(231,247,235,0.6) ≈ badge-success-bg/60, 아이콘 칩 #d1f0d9 ≈ badge-success-bg,
 * 아이콘 #1e7e38 = badge-success-text (warning 도 같은 규칙).
 * danger(권한 거부 · 네트워크 끊김)는 Figma 에 없는 상태다. 왼쪽 패널이 장치 실패를 빨간
 * "실패"(STATUS_TONE.failed)로 보여주므로 같은 빨강으로 맞추고, 행 색은 위 규칙을 따랐다.
 * neutral(측정 전 · 확인 중)은 기존 회색 그대로 둔다.
 */
const ENV_ROW_TONE_CLASS: Record<EnvCheckDisplay['badgeTone'], { row: string; chip: string; icon: string }> = {
  neutral: { row: 'bg-surface-muted', chip: 'bg-neutral-200', icon: 'text-neutral-500' },
  success: { row: 'bg-badge-success-bg/60', chip: 'bg-badge-success-bg', icon: 'text-badge-success-text' },
  warning: { row: 'bg-badge-warning-bg/60', chip: 'bg-badge-warning-bg', icon: 'text-badge-warning-text' },
  danger: { row: 'bg-badge-danger-bg/60', chip: 'bg-badge-danger-bg', icon: 'text-badge-danger-text' },
}

type ReadyItemStatus = 'ready' | 'not-ready' | 'pending'

function ReadyItemIcon({ status }: { status: ReadyItemStatus }) {
  if (status === 'ready') return <IconCheck size={16} stroke={2} className="shrink-0 text-semantic-success" aria-hidden />
  if (status === 'not-ready') return <IconX size={16} stroke={2} className="shrink-0 text-semantic-danger" aria-hidden />
  return <IconPointFilled size={16} className="shrink-0 text-neutral-300" aria-hidden />
}

const STATUS_LABEL: Record<DeviceCheckState['status'], string> = {
  unchecked: '확인 중',
  available: '정상',
  failed: '실패',
}

const STATUS_TONE: Record<DeviceCheckState['status'], 'success' | 'danger' | 'neutral'> = {
  unchecked: 'neutral',
  available: 'success',
  failed: 'danger',
}

const FAILURE_MESSAGE: Record<DeviceFailureReason, (deviceLabel: string) => string> = {
  'permission-denied': (deviceLabel) =>
    `${deviceLabel} 권한이 거부됐어요. 브라우저 주소창의 권한 설정에서 허용한 뒤 다시 시도해주세요.`,
  'not-found': (deviceLabel) => `${deviceLabel} 장치를 찾을 수 없어요. 장치가 연결되어 있는지 확인해주세요.`,
  unknown: (deviceLabel) => `${deviceLabel}를 확인하는 중 문제가 발생했어요. 다시 시도해주세요.`,
}

export default function DeviceCheckPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const { camera, mic, network, lighting, noise, videoStream, micLevel, recheckCamera, recheckMic } = useDeviceCheck()

  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = videoStream
    }
  }, [videoStream])

  const canStart = canStartInterview({ camera, mic })
  const allOk = camera.status === 'available' && mic.status === 'available'

  const cameraReady: ReadyItemStatus = camera.status === 'available' ? 'ready' : camera.status === 'failed' ? 'not-ready' : 'pending'
  const micReady: ReadyItemStatus = mic.status === 'available' ? 'ready' : mic.status === 'failed' ? 'not-ready' : 'pending'
  const networkReady: ReadyItemStatus = network.status !== 'offline' ? 'ready' : 'not-ready'
  const readyItems: ReadyItemStatus[] = [cameraReady, micReady, networkReady]
  const readyCount = readyItems.filter((status) => status === 'ready').length
  const readyTotal = readyItems.length

  const handleStart = () => {
    if (!sessionId || !canStart) return
    // 이 화면의 점검 결과(INT-4)를 면접 진행 화면의 시작 값으로 넘긴다 — 스트림 자체는
    // (여기서 만든 스트림은 라우트를 벗어나며 정리돼서) 재사용 못 하고 그쪽에서 새로
    // 받지만, "이미 점검했다" 는 정보는 넘겨서 'unchecked' 로 잠깐 깜빡이지 않게 한다.
    navigate(toInterview(sessionId), { state: { initialDeviceStatus: { camera, mic } } })
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-6">
          <p className="text-body text-neutral-500">
            모의면접<span className="font-semibold text-neutral-900"> / 장치 테스트</span>
          </p>

          {/* STEP 라벨과 Stepper 는 한 묶음이라 Figma 원본 간격(10px)을 그대로 유지한다. */}
          <div className="flex flex-col gap-2.5">
            <span className="text-body-sm font-bold text-primary-500">STEP 2/4</span>
            <StepIndicator current={2} />
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-6">
          {/* Card 는 40px 패딩 프리셋이 없어 가장 가까운 padding="lg"(24px)로 확정했다 (PR #84 리뷰). */}
          <Card padding="lg" className="flex min-w-80 flex-[3] flex-col gap-8">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-h1 text-neutral-900">장치를 확인해주세요</h1>
                {allOk && <Badge tone="success">모든 장치 정상</Badge>}
              </div>
              <p className="text-body-md text-neutral-500">원활한 면접 진행을 위해 카메라와 마이크를 점검합니다</p>
            </div>

            <div className="border-t border-neutral-200" />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <p className="text-body-lg text-neutral-900">캠 미리보기</p>

                <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md bg-neutral-900">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                    hidden={camera.status !== 'available'}
                  />
                  {camera.status !== 'available' && (
                    <p className="text-body-md text-neutral-0">웹캠 화면이 여기에 표시됩니다</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Badge tone={STATUS_TONE[camera.status]}>카메라 {STATUS_LABEL[camera.status]}</Badge>
                </div>

                {camera.status === 'failed' && camera.failureReason && (
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-body-sm text-neutral-500">{FAILURE_MESSAGE[camera.failureReason]('카메라')}</p>
                    <Button size="sm" onClick={recheckCamera} className="shrink-0">
                      다시 시도
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-body-lg text-neutral-900">마이크 입력</p>
                  <Badge tone={STATUS_TONE[mic.status]}>{STATUS_LABEL[mic.status]}</Badge>
                </div>

                {/*
                  카드 안에 한 겹 더 얹는 패널이라 surface 토큰을 씁니다.
                  neutral-50 은 흰 카드 위에서 경계가 거의 안 보여 border 를 덧대야
                  했는데, 이 색이면 테두리 없이도 한 덩어리로 읽힙니다.
                  (docs/design-system.md §2.6)
                */}
                <div className="flex flex-col gap-3 rounded-md bg-surface-muted p-4">
                  <div
                    role="progressbar"
                    aria-valuenow={Math.round(micLevel * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 w-full overflow-hidden rounded-full bg-neutral-200"
                  >
                    <div
                      style={{ width: `${Math.round(micLevel * 100)}%` }}
                      className="h-full rounded-full bg-primary-500"
                    />
                  </div>
                  {/* 소음 보정이 끝나기 전엔 말하지 말라고 안내한다 — 보정 구간에 목소리가
                      섞이면 노이즈 플로어가 올라가 조용한 방에서도 "시끄러움"으로 잘못
                      고정될 수 있다 (PR #102 리뷰). */}
                  <p className="text-body-sm text-neutral-500">
                    {mic.status === 'available' && noise.level === null ? (
                      <>
                        <span aria-hidden="true">🔈</span> 주변 소음을 측정하고 있어요. 잠시만 기다려주세요
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true">🎤</span> "안녕하세요, 테스트 중입니다"라고 말해보세요
                      </>
                    )}
                  </p>
                </div>

                {mic.status === 'failed' && mic.failureReason && (
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-body-sm text-neutral-500">{FAILURE_MESSAGE[mic.failureReason]('마이크')}</p>
                    <Button size="sm" onClick={recheckMic} className="shrink-0">
                      다시 시도
                    </Button>
                  </div>
                )}

                <div className="border-t border-neutral-200" />

                <div className="flex flex-col gap-3">
                  <p className="text-body-lg text-neutral-900">환경 체크</p>

                  {/* 행 모서리 12px, 아이콘 칩 모서리 8px 모두 정확한 토큰이 없어 가장 가까운
                      radius-md(14px)/radius-xs(6px)로 확정했다 (PR #84 리뷰). */}
                  <ul className="flex flex-col gap-2">
                    {ENV_CHECK_ITEMS.map(({ key, label, Icon }) => {
                      const display = envCheckDisplay(key, camera, mic, network, lighting, noise)
                      const tone = ENV_ROW_TONE_CLASS[display.badgeTone]

                      return (
                        <li key={key} className={`flex items-center gap-3 rounded-md px-3.5 py-3 ${tone.row}`}>
                          <span className={`flex size-8 shrink-0 items-center justify-center rounded-xs ${tone.chip}`}>
                            <Icon size={16} stroke={2} className={tone.icon} aria-hidden />
                          </span>

                          <div className="flex flex-1 flex-col gap-0.5">
                            <p className="text-body-sm font-semibold text-neutral-900">{label}</p>
                            {/* 측정·판정이 끝나기 전엔 "면접 요약" 패널과 같은 연한
                                placeholder(text-neutral-300)를 쓰고, 끝나면 본문 톤
                                (text-neutral-500)으로 보여준다. */}
                            <p className={`text-body-sm ${display.valueTone === 'placeholder' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                              {display.value}
                            </p>
                          </div>

                          <Badge tone={display.badgeTone} onTint={display.badgeTone !== 'neutral'}>
                            {display.badgeLabel}
                          </Badge>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 는 radius 가 rounded-lg(20px) 고정이라 그대로 확정했다 (PR #84 리뷰). */}
          <aside className="flex min-w-72 flex-1 flex-col gap-4">
            <Card padding="lg" className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-body-lg font-semibold text-neutral-900">준비 상태</h2>
                <span className={`text-body-sm ${readyCount === readyTotal ? 'text-semantic-success' : 'text-neutral-500'}`}>
                  {readyCount}/{readyTotal}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {readyItems.map((_, index) => (
                  // 어떤 항목이 됐는지가 아니라 몇 개 됐는지만 보여준다 — 카메라·마이크·
                  // 네트워크는 병렬로 체크되어 순서 의미가 없어서, 완료된 항목의 위치와
                  // 상관없이 readyCount 만큼 왼쪽부터 채운다.
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full ${index < readyCount ? 'bg-semantic-success' : 'bg-neutral-200'}`}
                  />
                ))}
              </div>

              <ul className="flex flex-col gap-3">
                <li className="flex items-center gap-2">
                  <ReadyItemIcon status={cameraReady} />
                  <span className="text-body-sm text-neutral-900">카메라 인식</span>
                </li>
                <li className="flex items-center gap-2">
                  <ReadyItemIcon status={micReady} />
                  <span className="text-body-sm text-neutral-900">마이크 인식</span>
                </li>
                <li className="flex items-center gap-2">
                  <ReadyItemIcon status={networkReady} />
                  <span className="text-body-sm text-neutral-900">네트워크 연결</span>
                </li>
              </ul>
            </Card>

            <Card padding="lg" className="flex flex-col gap-4">
              <h2 className="text-body-lg font-semibold text-neutral-900">면접 요약</h2>
              <dl className="flex flex-col">
                {SUMMARY_ROW_LABELS.map((label) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 border-b border-neutral-200 py-2.5 last:border-b-0"
                  >
                    <dt className="text-body-sm text-neutral-500">{label}</dt>
                    {/*
                      TODO(interview-summary-data): 옵션설정 값(jobRole·
                      questionCount·answerSeconds·interviewerStyle)을 이
                      화면까지 전달할 경로가 아직 없음 — SessionSetup 은
                      SessionSetupPage 의 로컬 state 로만 있고 createSession
                      응답은 sessionId 만 돌려준다. GET /api/interviews/
                      :sessionId 신설 또는 응답 echo + 전달 방식 확정이
                      필요하다. 정해지기 전까지 실제 값처럼 보이지 않도록
                      흐린 안내 문구만 둔다.
                    */}
                    <dd className="text-body-sm text-neutral-300">연동 준비 중</dd>
                  </div>
                ))}
              </dl>
            </Card>

            {/* 주변소음이 "시끄러움"일 때만 뜬다 (이슈 #83, 시안 참고). 다른 환경 체크
                항목(조명·네트워크)은 행의 배지로 충분하다고 보고 배너를 따로 안 둔다 —
                소음만 "지금 바로 할 수 있는 행동(이동)"이 있어서 더 눈에 띄어야 한다.
                소음 보정은 마이크 연결 시점에 한 번만 고정되어(useDeviceCheck), 이동한
                뒤에도 배지가 저절로 안 바뀐다 — recheckMic 으로 마이크를 다시 잡으면
                보정도 같이 다시 돈다 (PR #102 리뷰). */}
            {noise.level === 'noisy' && (
              <div className="flex items-start gap-2 rounded-sm bg-badge-warning-bg/60 p-3 text-body-sm text-badge-warning-text">
                <IconAlertTriangle size={16} stroke={2} className="mt-0.5 shrink-0" aria-hidden />
                <div className="flex flex-1 items-center justify-between gap-3">
                  <p>주변 소음이 감지됐어요. 조용한 곳으로 이동한 뒤 다시 측정해보세요.</p>
                  <Button size="sm" onClick={recheckMic} className="shrink-0">
                    다시 측정
                  </Button>
                </div>
              </div>
            )}

            {/*
              INT-4 미확정 사항, 이슈 #9: 카메라 필수 여부 정책이 아직 확정되지 않았습니다.
              canStartInterview 의 임시 정책(마이크만 필수)과 맞춰 카메라 실패는 시작을
              막지 않고 안내만 합니다. 정책이 카메라도 필수로 바뀌면 이 안내를 시작
              차단 사유로 옮겨야 합니다.
            */}
            {camera.status === 'failed' && (
              <p className="text-body-sm text-neutral-500">카메라 없이 진행하면 시선 점수는 나오지 않아요</p>
            )}

            {/* 못 누르는 이유는 툴팁이 아니라 글로 적습니다 (이슈 #32, PR #37 반영). */}
            {!canStart && <p className="text-body-sm text-neutral-400">마이크가 있어야 시작할 수 있어요</p>}

            {/*
              "← 옵션"은 옵션설정 값을 복원해서 돌아가는 경로가 아직 없어(useSessionSetup
              은 SessionSetupPage 로컬 state), 눌러도 항상 빈 옵션설정 화면으로 간다.
              기존 값 복원이 필요해지면 별도 상태/라우팅 설계가 필요하다.
            */}
            <div className="flex items-center gap-3">
              <Button to={ROUTES.SESSION_SETUP} size="lg">
                ← 옵션
              </Button>
              <Button variant="primary" size="lg" disabled={!canStart} onClick={handleStart} className="flex-1">
                면접 시작하기
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
