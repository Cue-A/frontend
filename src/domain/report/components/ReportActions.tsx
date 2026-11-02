import { ROUTES, toReplay } from '@/app/routes'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

/**
 * 리포트를 다 본 다음에 갈 곳입니다. (C-01 "다음 단계")
 *
 * 세 버튼 모두 시안에 있는 자리인데, 지금 실제로 되는 건 화면 이동 두 개뿐입니다.
 * 문구는 **지금 실제로 일어나는 일**에 맞춰 적습니다 (이슈 #20).
 *
 * - "홈으로 이동" — 홈 대시보드(A-04)로 갑니다. 홈이 생기기 전에는 "처음 화면으로" 라는
 *   이름으로 랜딩에 보냈습니다. 시안 문구로 되돌렸습니다.
 * - "다시 연습하기" — 이 면접의 재연습 설정 화면으로 갑니다(이슈 #152). 첫 면접과 같은 질문 · 조건으로 다시
 *   봅니다. 전에는 재연습 API 가 없어 빈 옵션 설정 화면으로만 갔습니다. 리포트를 못 불러온 화면은 어느 면접인지
 *   몰라서(`sessionId` 없음) 지금처럼 새 면접 설정으로 보냅니다.
 * - "리포트 저장하기" — 저장 API 가 없어 비활성입니다. 못 누르는 이유는
 *   툴팁이 아니라 글로 적습니다. 브라우저가 비활성 요소에 마우스 이벤트를
 *   안 보내서 툴팁이 아예 안 뜹니다 (이슈 #32).
 */
type Props = {
  /** 이 리포트의 면접. 있으면 "다시 연습하기" 가 재연습으로, 없으면(리포트를 못 불러옴) 새 면접 설정으로 갑니다 */
  sessionId?: string
  /**
   * 분석이 실패한 리포트의 면접을 아직 찾는 중인지. 그동안 "다시 연습하기" 를 잠급니다 — 찾기 전후로 목적지가
   * 바뀌어서, 먼저 누르면 재연습 대신 새 면접 설정으로 가게 됩니다 (PR #153 리뷰)
   */
  checking?: boolean
}

function guideOf(sessionId: string | undefined, checking: boolean) {
  if (checking) return '다시 연습할 수 있는지 확인하는 중이에요…'
  return sessionId
    ? '다시 연습하기를 누르면 이번 면접과 같은 질문으로 재연습해요. 꼬리질문은 새 답변에 맞춰 새로 나와요.'
    : '다시 연습하기를 누르면 면접 옵션 설정 화면으로 갑니다.'
}

export default function ReportActions({ sessionId, checking = false }: Props) {
  return (
    <Card label="다음 단계" padding="lg">
      <div className="flex flex-col gap-4">
        <p className="text-body-sm text-neutral-500">{guideOf(sessionId, checking)}</p>

        <nav className="flex flex-wrap gap-3">
          <Button to={ROUTES.HOME} className="flex-1">
            홈으로 이동
          </Button>

          <Button disabled className="flex-1">
            리포트 저장하기
          </Button>

          <Button
            variant="primary"
            to={sessionId ? toReplay(sessionId) : ROUTES.SESSION_SETUP}
            disabled={checking}
            className="flex-1"
          >
            다시 연습하기
          </Button>
        </nav>

        <p className="text-body-sm text-neutral-400">리포트 저장은 아직 준비 중이에요</p>
      </div>
    </Card>
  )
}
