import Card from '@/shared/ui/Card'

import type { ImprovedAnswer } from '../types/report'

type Props = {
  improvedAnswer: ImprovedAnswer
}

/**
 * 개선 답변 예시입니다. (C-01 "개선 답변 예시")
 * 내 답변과 예시를 나란히 놓아야 뭐가 달라졌는지 바로 보입니다.
 */
export default function ImprovedAnswerSection({ improvedAnswer }: Props) {
  return (
    <Card label="개선 답변 예시" padding="lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-h2 text-neutral-900">개선 답변 예시</h2>
          <p className="text-body-sm text-neutral-500">
            {improvedAnswer.turnTitle} · 실제 답변을 기반으로 재구성한 예시입니다
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-64 flex-1 flex-col gap-2 rounded-sm bg-neutral-50 p-5">
            <h3 className="text-body-lg text-neutral-700">내 답변</h3>
            <p className="text-body-md text-neutral-700">{improvedAnswer.myAnswer}</p>
          </div>

          <div className="flex min-w-64 flex-1 flex-col gap-2 rounded-sm bg-primary-100 p-5">
            <h3 className="text-body-lg text-primary-700">개선 예시</h3>
            <p className="text-body-md text-neutral-900">{improvedAnswer.example}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
