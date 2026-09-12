import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { toInterview } from '@/app/routes'

import { useDeviceCheck } from '../hooks/useDeviceCheck'
import { canStartInterview } from '../lib/canStartInterview'
import type { DeviceCheckState, DeviceFailureReason } from '../types/deviceCheck'

const STATUS_LABEL: Record<DeviceCheckState['status'], string> = {
  unchecked: '확인 중',
  available: '정상',
  failed: '실패',
}

const FAILURE_MESSAGE: Record<DeviceFailureReason, (deviceLabel: string) => string> = {
  'permission-denied': (deviceLabel) =>
    `${deviceLabel} 권한이 거부됐어요. 브라우저 주소창의 권한 설정에서 허용한 뒤 다시 시도해주세요.`,
  'not-found': (deviceLabel) => `${deviceLabel} 장치를 찾을 수 없어요. 장치가 연결되어 있는지 확인해주세요.`,
  unknown: (deviceLabel) => `${deviceLabel}를 확인하는 중 문제가 발생했어요. 다시 시도해주세요.`,
}

type DeviceStatusRowProps = {
  label: string
  state: DeviceCheckState
  onRetry: () => void
}

function DeviceStatusRow({ label, state, onRetry }: DeviceStatusRowProps) {
  return (
    <li className="flex flex-col gap-2 border p-3">
      <div className="flex items-center justify-between gap-4">
        <span>{label}</span>
        <span>{STATUS_LABEL[state.status]}</span>
      </div>

      {state.status === 'failed' && state.failureReason && (
        <div className="flex items-center justify-between gap-4">
          <p>{FAILURE_MESSAGE[state.failureReason](label)}</p>
          <button type="button" onClick={onRetry} className="shrink-0 border px-4 py-2">
            다시 시도
          </button>
        </div>
      )}
    </li>
  )
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

  const handleStart = () => {
    if (!sessionId || !canStart) return
    navigate(toInterview(sessionId))
  }

  return (
    <section className="p-6">
      <h1>장치를 확인해주세요</h1>
      <p className="mt-2">원활한 면접 진행을 위해 카메라와 마이크를 점검합니다</p>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2>캠 미리보기</h2>
          <div className="mt-3 aspect-video w-full border">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          </div>
        </div>

        <div>
          <h2>마이크 입력</h2>
          <div className="mt-3 h-8 w-full border">
            {/* 색 토큰이 아직 없어 bg-current 로 임시 채움 처리 — 토큰 도입 시 교체 */}
            <div style={{ width: `${Math.round(micLevel * 100)}%` }} className="h-full bg-current" />
          </div>
        </div>
      </div>

      <div className="mt-6 border-t pt-4">
        <h2>점검 결과</h2>
        <ul className="mt-3 flex flex-col gap-2">
          <DeviceStatusRow label="카메라" state={camera} onRetry={recheckCamera} />
          <DeviceStatusRow label="마이크" state={mic} onRetry={recheckMic} />
        </ul>
      </div>

      <div className="mt-6 flex flex-col items-end gap-2">
        {/*
          INT-4 미확정 사항, 이슈 #9: 카메라 필수 여부 정책이 아직 확정되지 않았습니다.
          canStartInterview 의 임시 정책(마이크만 필수)과 맞춰 카메라 실패는 시작을
          막지 않고 안내만 합니다. 정책이 카메라도 필수로 바뀌면 이 안내를 시작
          차단 사유로 옮겨야 합니다.
        */}
        {camera.status === 'failed' && <p>카메라 없이 진행하면 시선 점수는 나오지 않아요</p>}

        <button type="button" disabled={!canStart} onClick={handleStart} className="border px-6 py-3">
          면접 시작하기
        </button>
      </div>
    </section>
  )
}
