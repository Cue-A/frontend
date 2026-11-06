import type { RefObject } from 'react'

import SelfCameraPreview from './SelfCameraPreview'

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>
  hasStream: boolean
  cameraFailureMessage?: string | null
}

/**
 * 우측 상단 내 카메라 영역. 폭은 화면 폭에 비례해 커지되(22vw) 너무 작거나 크지 않게 묶는다.
 * 기존 w-72(288px) 고정보다 큰 화면에서 더 크게 보인다. 자막은 여기가 아니라 질문 카드 안 한 줄로 보여준다.
 */
export default function SessionSidePanel({ videoRef, hasStream, cameraFailureMessage = null }: Props) {
  return (
    <div className="w-[clamp(20rem,22vw,26rem)] shrink-0">
      <SelfCameraPreview videoRef={videoRef} hasStream={hasStream} failureMessage={cameraFailureMessage} />
    </div>
  )
}
