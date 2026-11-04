import Card from '@/shared/ui/Card'

import type { ImprovedAnswer } from '../types/report'

type Props = {
  improvedAnswer: ImprovedAnswer
}

/**
 * 답변 개선 방향입니다. (C-01 "개선 답변 예시" 자리)
 *
 * AI 가 주는 값(`suggestion`)은 고쳐 쓴 예시 답변이 아니라 **개선 방향 1~2문장**이라, 시안의 "개선 답변 예시 · 개선 예시"
 * 대신 "답변 개선 방향 · 개선 방향" 으로 적습니다. 예시라고 적으면 그대로 외워 말할 답안으로 읽힙니다.
 * 내 답변과 개선 방향을 나란히 놓아야 무엇을 바꾸면 되는지 바로 보입니다.
 */
export default function ImprovedAnswerSection({ improvedAnswer }: Props) {
  return (
    <Card label="답변 개선 방향" padding="lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-h2 text-neutral-900">답변 개선 방향</h2>
          <p className="text-body-sm text-neutral-500">
            {improvedAnswer.turnTitle} · 실제 답변을 기반으로 한 개선 방향입니다
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-64 flex-1 flex-col gap-2 rounded-sm bg-neutral-50 p-5">
            <h3 className="text-body-lg text-neutral-700">내 답변</h3>
            <p className="text-body-md text-neutral-700">{improvedAnswer.myAnswer}</p>
          </div>

          <div className="flex min-w-64 flex-1 flex-col gap-2 rounded-sm bg-primary-100 p-5">
            <h3 className="text-body-lg text-primary-700">개선 방향</h3>
            <p className="text-body-md text-neutral-900">{improvedAnswer.example}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
