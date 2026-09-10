import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'

/**
 * 리포트를 다 본 다음에 갈 곳입니다. (C-01 "다음 단계")
 *
 * "리포트 저장하기"는 아직 넣지 않았습니다. 저장 API 가 정해지지 않아서
 * 눌러도 아무 일도 안 하는 버튼이 되기 때문입니다. 계약이 나오면 여기에 붙입니다.
 */
export default function ReportActions() {
  return (
    <section aria-label="다음 단계" className="flex flex-col gap-4 border p-6">
      <p>
        다시 연습하기를 누르면 이번 회차와 동일한 설정이 입력된 상태로 면접 옵션 설정 페이지로
        이동합니다
      </p>

      <nav className="flex flex-wrap gap-3">
        <Link to={ROUTES.LANDING} className="flex-1 border px-4 py-3 text-center">
          홈으로 이동
        </Link>

        <Link to={ROUTES.SESSION_SETUP} className="flex-1 border px-4 py-3 text-center">
          다시 연습하기
        </Link>
      </nav>
    </section>
  )
}
