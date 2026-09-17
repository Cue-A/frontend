import { IconCheck, IconPointFilled, IconX } from '@tabler/icons-react'
import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ROUTES, toInterview } from '@/app/routes'

import { useDeviceCheck } from '../hooks/useDeviceCheck'
import { canStartInterview } from '../lib/canStartInterview'
import type { DeviceCheckState, DeviceFailureReason } from '../types/deviceCheck'

import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import StepIndicator from './StepIndicator'

const SUMMARY_ROW_LABELS = ['직무', '질문 수', '답변 시간', '면접관'] as const

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

  const { camera, mic, videoStream, micLevel, recheckCamera, recheckMic } = useDeviceCheck()

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
  const readyCount = [cameraReady, micReady].filter((status) => status === 'ready').length

  const handleStart = () => {
    if (!sessionId || !canStart) return
    navigate(toInterview(sessionId))
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <StepIndicator current={2} />

        <div className="flex flex-wrap items-start gap-6">
          {/*
            TODO(design-token): Card 컴포넌트에 40px 패딩 프리셋이 없음. 임시로
            padding="lg"(24px) 사용 중. 필요한 값: Figma 673:6 콘텐츠 카드 패딩
            40px — shared/ui/Card 에 xl 프리셋 추가를 검토해주세요.
          */}
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

                {/*
                  TODO(design-token): design-system.md에 없는 값. 임시로
                  neutral-900 사용 중. 필요한 값: 캠 미리보기 빈 상태 배경
                  그라디언트 rgb(53,41,107)→rgb(26,20,64) (Figma 673:13, 문서 미정의)
                */}
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
                  <Button size="sm" onClick={recheckCamera}>
                    다시 시도
                  </Button>
                </div>

                {camera.status === 'failed' && camera.failureReason && (
                  <p className="text-body-sm text-neutral-500">{FAILURE_MESSAGE[camera.failureReason]('카메라')}</p>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-body-lg text-neutral-900">마이크 입력</p>
                  <Badge tone={STATUS_TONE[mic.status]}>{STATUS_LABEL[mic.status]}</Badge>
                </div>

                {/*
                  TODO(design-token): design-system.md에 없는 값. 임시로
                  neutral-50 사용 중. 필요한 값: 마이크 레벨 패널 배경 #f9f8ff
                  (Figma 1377:1462, 문서 미정의)
                */}
                <div className="flex flex-col gap-3 rounded-md bg-neutral-50 p-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div
                      style={{ width: `${Math.round(micLevel * 100)}%` }}
                      className="h-full rounded-full bg-primary-500"
                    />
                  </div>
                  <p className="text-body-sm text-neutral-500">🎤 "안녕하세요, 테스트 중입니다"라고 말해보세요</p>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button size="sm" onClick={recheckMic}>
                    다시 시도
                  </Button>
                </div>

                {mic.status === 'failed' && mic.failureReason && (
                  <p className="text-body-sm text-neutral-500">{FAILURE_MESSAGE[mic.failureReason]('마이크')}</p>
                )}
              </div>
            </div>
          </Card>

          {/*
            TODO(design-token): shared/ui/Card 는 radius 가 rounded-lg(20px)
            고정. 임시로 그대로 사용 중. 필요한 값: 사이드 패널 모서리 16px
            (Figma 1369:1462, 문서엔 radius-md(14px)/radius-lg(20px)만 있고
            16px 없음).
          */}
          <aside className="flex min-w-72 flex-1 flex-col gap-4">
            <Card label="준비 상태" padding="lg" className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-body-lg font-semibold text-neutral-900">준비 상태</h2>
                <span className={`text-body-sm ${readyCount === 2 ? 'text-badge-success-text' : 'text-neutral-500'}`}>
                  {readyCount}/2
                </span>
              </div>

              <div className="flex items-center gap-1">
                <div
                  className={`h-1 flex-1 rounded-full ${cameraReady === 'ready' ? 'bg-semantic-success' : 'bg-neutral-200'}`}
                />
                <div
                  className={`h-1 flex-1 rounded-full ${micReady === 'ready' ? 'bg-semantic-success' : 'bg-neutral-200'}`}
                />
              </div>

              <ul className="flex flex-col gap-3">
                <li className="flex items-center gap-2">
                  <ReadyItemIcon status={cameraReady} />
                  <span className="text-body-sm text-neutral-900">카메라 정상 인식</span>
                </li>
                <li className="flex items-center gap-2">
                  <ReadyItemIcon status={micReady} />
                  <span className="text-body-sm text-neutral-900">마이크 정상 인식</span>
                </li>
                {/*
                  TODO(network-check): 네트워크 확인 로직이 아직 없음(전용
                  API·훅 없음). 실제 측정 로직을 만들지 않고 항상 "확인 중"
                  placeholder 로만 표시한다. 로직이 생기면 이 항목을
                  cameraReady/micReady 와 같은 패턴으로 교체한다.
                */}
                <li className="flex items-center gap-2">
                  <ReadyItemIcon status="pending" />
                  <span className="text-body-sm text-neutral-400">네트워크 상태 확인 중</span>
                </li>
              </ul>
            </Card>

            <Card label="면접 요약" padding="lg" className="flex flex-col gap-4">
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
