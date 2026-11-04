import type { RefObject } from 'react'

import LiveCaptionPanel from './LiveCaptionPanel'
import SelfCameraPreview from './SelfCameraPreview'

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>
  hasStream: boolean
  cameraFailureMessage?: string | null
  caption: string | null
  captionSupported?: boolean
  /** 카메라 아래에 자막 박스를 둘지. 자막을 질문 카드 안 한 줄로 보여주는 배치에서는 false. */
  showCaptionPanel?: boolean
}

/**
 * 우측 상단 내 카메라 영역. 폭은 화면 폭에 비례해 커지되(20vw) 너무 작거나 크지 않게 묶는다.
 * 기존 w-72(288px) 고정보다 큰 화면에서 더 크게 보인다.
 */
export default function SessionSidePanel({
  videoRef,
  hasStream,
  cameraFailureMessage = null,
  caption,
  captionSupported = true,
  showCaptionPanel = false,
}: Props) {
  return (
    <div className="flex w-[clamp(20rem,22vw,26rem)] shrink-0 flex-col gap-4">
      <SelfCameraPreview videoRef={videoRef} hasStream={hasStream} failureMessage={cameraFailureMessage} />
      {showCaptionPanel && <LiveCaptionPanel caption={caption} isSupported={captionSupported} />}
    </div>
  )
}
