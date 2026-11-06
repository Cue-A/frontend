import LoadingLine from './LoadingLine'

/**
 * 답변을 제출한 뒤 처리가 60초 넘게 걸릴 때 `LoadingLine` 자리에 대신 들어가는 인라인 안내입니다.
 * 스피너 · 구분선은 `LoadingLine` 을 그대로 쓰고, 그 아래에 보조 문구만 덧붙인다.
 * 사용자 잘못이 아닌 지연이라 경고색은 쓰지 않고 중립 톤만 쓴다. 종료 경로는 따로 두지 않는다 —
 * 상단 X 버튼의 종료 확인 흐름을 그대로 쓴다.
 */
export default function AnswerDelayNotice() {
  return (
    <div>
      <LoadingLine label="분석이 평소보다 오래 걸리고 있어요" />

      <p className="pt-2 text-center text-body-sm text-neutral-500">
        잠시만 더 기다려 주세요. 새로고침하면 진행 중인 면접이 사라질 수 있어요.
      </p>
    </div>
  )
}
