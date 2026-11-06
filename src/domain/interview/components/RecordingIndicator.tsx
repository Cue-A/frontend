/** "● REC" — 녹화 중 표시. 경과 시간은 보여주지 않는다(리뷰 피드백). */
export default function RecordingIndicator() {
  return (
    <div className="flex h-11 items-center gap-2 rounded-full bg-stage-surface/70 px-4 text-body-md text-stage-text">
      <span className="h-2.5 w-2.5 motion-safe:animate-pulse rounded-full bg-semantic-danger" aria-hidden="true" />
      <span>REC</span>
    </div>
  )
}
