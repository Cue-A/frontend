import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'

/**
 * 리포트를 다 본 다음에 갈 곳입니다. (C-01 "다음 단계")
 *
 * "리포트 저장하기"는 저장 API 가 아직 없어서 비활성 상태입니다.
 * 눌러도 아무 일이 없는 것보다, 왜 못 누르는지 보이는 편이 낫습니다.
 * 계약이 나오면 disabled 를 떼고 onClick 만 붙이면 됩니다.
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

        <button
          type="button"
          disabled
          title="저장 기능은 준비 중이에요"
          className="flex-1 border px-4 py-3 text-center"
        >
          리포트 저장하기
        </button>

        <Link to={ROUTES.SESSION_SETUP} className="flex-1 border px-4 py-3 text-center">
          다시 연습하기
        </Link>
      </nav>
    </section>
  )
}
