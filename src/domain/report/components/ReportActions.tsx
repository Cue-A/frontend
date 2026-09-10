import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'

/**
 * 리포트를 다 본 다음에 갈 곳입니다.
 *
 * "리포트 저장"은 아직 넣지 않았습니다. 저장 API 가 정해지지 않아서
 * 눌러도 아무 일도 안 하는 버튼이 되기 때문입니다. 계약이 나오면 여기에 붙입니다.
 */
export default function ReportActions() {
  return (
    <nav aria-label="다음 할 일" className="flex flex-wrap gap-3">
      <Link to={ROUTES.SESSION_SETUP} className="border px-4 py-2">
        다시 연습하기
      </Link>

      <Link to={ROUTES.LANDING} className="border px-4 py-2">
        홈으로
      </Link>
    </nav>
  )
}
