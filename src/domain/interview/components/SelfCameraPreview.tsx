import type { RefObject } from 'react'

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>
  /** 스트림 연결 여부. getUserMedia 는 B-01-3 몫이라 상위에서 내려받기만 한다. */
  hasStream: boolean
  /**
   * 실패 이유 문구(권한 거부 · 장치 없음 · 트랙 중단). hasStream 이 false 일 때만
   * 쓰인다. 안 주면 기존처럼 일반 placeholder(아이콘 + "내 카메라")만 보여준다 —
   * 기존 호출부(InterviewSessionPreview 등)를 그대로 두기 위한 추가 prop이다.
   */
  failureMessage?: string | null
}

export default function SelfCameraPreview({ videoRef, hasStream, failureMessage = null }: Props) {
  return (
    // TODO(design-token): design-system.md에 없는 값. 임시로 neutral-300 / radius-md(14px) 사용 중.
    // 필요한 값: 셀프 카메라 프리뷰(PIP) placeholder 배경색 #d8d8e1, 모서리 16px (Figma 847:708, 문서 미정의)
    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-neutral-300 shadow-card">
      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" hidden={!hasStream} />

      {!hasStream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-neutral-400">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="2" y="6" width="14" height="12" rx="2" />
            <path d="M16 10l6-3v10l-6-3" strokeLinejoin="round" />
          </svg>
          <span className="text-body-sm">{failureMessage ?? '내 카메라'}</span>
        </div>
      )}
    </div>
  )
}
