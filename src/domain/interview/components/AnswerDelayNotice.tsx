import { IconInfoCircle } from '@tabler/icons-react'

import LoadingLine from './LoadingLine'

type Props = {
  /** 지금 진행 단계 문구("음성 만드는 중" 등). 지연돼도 단계는 그대로 보여준다. */
  label: string
}

/**
 * 답변을 제출한 뒤 처리가 60초 넘게 걸릴 때 `LoadingLine` 자리에 대신 들어가는 인라인 안내입니다.
 * 단계 문구는 그대로 두고 그 아래에 지연 안내(중립 톤)와 주의 문구(정보 아이콘)를 두 줄로 덧붙인다.
 * 사용자 잘못이 아닌 지연이라 경고색은 쓰지 않고 중립 톤만 쓴다. 종료 경로는 따로 두지 않는다 —
 * 상단 X 버튼의 종료 확인 흐름을 그대로 쓴다.
 */
export default function AnswerDelayNotice({ label }: Props) {
  return (
    <div>
      <LoadingLine label={label} />

      <p className="pt-2 text-center text-body-sm text-neutral-500">
        평소보다 오래 걸리고 있어요. 잠시만 더 기다려 주세요.
      </p>

      <p className="flex items-center justify-center gap-1 text-body-sm text-neutral-500">
        <IconInfoCircle size={16} stroke={2} aria-hidden className="shrink-0" />
        새로고침하면 진행 중인 면접이 사라져요
      </p>
    </div>
  )
}
