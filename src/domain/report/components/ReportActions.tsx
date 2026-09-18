import { ROUTES } from '@/app/routes'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

/**
 * 리포트를 다 본 다음에 갈 곳입니다. (C-01 "다음 단계")
 *
 * 세 버튼 모두 시안에 있는 자리인데, 지금 실제로 되는 건 화면 이동 두 개뿐입니다.
 * 문구는 **지금 실제로 일어나는 일**에 맞춰 적습니다 (이슈 #20).
 *
 * - "처음 화면으로" — 시안 문구는 "홈으로 이동"이지만 홈 대시보드 화면이 아직
 *   없어서 랜딩으로 갑니다. 그 화면이 생기면 문구와 목적지를 같이 바꿉니다.
 * - "다시 연습하기" — 이번 회차 설정을 그대로 불러오려면
 *   `POST /sessions/{id}/retry` 가 필요한데 P1 이라 아직 없습니다. 지금은
 *   빈 옵션 설정 화면으로만 갑니다. 설정을 채워준다고 적으면 거짓말이 됩니다.
 * - "리포트 저장하기" — 저장 API 가 없어 비활성입니다. 못 누르는 이유는
 *   툴팁이 아니라 글로 적습니다. 브라우저가 비활성 요소에 마우스 이벤트를
 *   안 보내서 툴팁이 아예 안 뜹니다 (이슈 #32).
 */
export default function ReportActions() {
  return (
    <Card label="다음 단계" padding="lg">
      <div className="flex flex-col gap-4">
        <p className="text-body-sm text-neutral-500">
          다시 연습하기를 누르면 면접 옵션 설정 화면으로 갑니다. 이번 회차의 설정을 그대로
          불러오는 기능은 아직 없어서 옵션은 다시 골라주세요.
        </p>

        <nav className="flex flex-wrap gap-3">
          <Button to={ROUTES.LANDING} className="flex-1">
            처음 화면으로
          </Button>

          <Button disabled className="flex-1">
            리포트 저장하기
          </Button>

          <Button variant="primary" to={ROUTES.SESSION_SETUP} className="flex-1">
            다시 연습하기
          </Button>
        </nav>

        <p className="text-body-sm text-neutral-400">리포트 저장은 아직 준비 중이에요</p>
      </div>
    </Card>
  )
}
