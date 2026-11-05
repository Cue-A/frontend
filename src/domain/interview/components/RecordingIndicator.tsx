/** "● REC" — 녹화 중 표시. 경과 시간은 보여주지 않는다(리뷰 피드백). */
export default function RecordingIndicator() {
  return (
    <div className="flex items-center gap-2 text-body-md text-semantic-danger">
      <span className="h-2.5 w-2.5 motion-safe:animate-pulse rounded-full bg-semantic-danger" aria-hidden="true" />
      <span>REC</span>
    </div>
  )
}
