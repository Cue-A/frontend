import type { RefObject } from 'react'

import LiveCaptionPanel from './LiveCaptionPanel'
import SelfCameraPreview from './SelfCameraPreview'

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>
  hasStream: boolean
  caption: string | null
}

export default function SessionSidePanel({ videoRef, hasStream, caption }: Props) {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-6">
      <SelfCameraPreview videoRef={videoRef} hasStream={hasStream} />
      <LiveCaptionPanel caption={caption} />
    </div>
  )
}
