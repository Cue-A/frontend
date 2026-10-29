import type { RefObject } from 'react'

import LiveCaptionPanel from './LiveCaptionPanel'
import SelfCameraPreview from './SelfCameraPreview'

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>
  hasStream: boolean
  cameraFailureMessage?: string | null
  caption: string | null
}

export default function SessionSidePanel({ videoRef, hasStream, cameraFailureMessage = null, caption }: Props) {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-6">
      <SelfCameraPreview videoRef={videoRef} hasStream={hasStream} failureMessage={cameraFailureMessage} />
      <LiveCaptionPanel caption={caption} />
    </div>
  )
}
