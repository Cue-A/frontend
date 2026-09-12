import { registerMock } from '@/shared/api/mock'

import type { Company } from '../types/sessionSetup'

/**
 * 기업 목록 목업입니다. 시안에 "약 30개 기업의 인재상 데이터가 등록되어 있어요"
 * 라고 되어 있는데, 실제 목록은 백엔드가 가지고 있습니다. 여기서는 드롭다운이
 * 그려지는지 확인할 만큼만 넣어둡니다.
 */
const COMPANIES: Company[] = [
  { companyId: 'naver', name: '네이버' },
  { companyId: 'kakao', name: '카카오' },
  { companyId: 'line', name: '라인' },
  { companyId: 'coupang', name: '쿠팡' },
  { companyId: 'baemin', name: '우아한형제들' },
  { companyId: 'toss', name: '토스' },
  { companyId: 'danggeun', name: '당근' },
]

registerMock('GET', '/api/companies', () => COMPANIES)

/**
 * 면접 세션 생성 목업입니다.
 * 실제로는 보낸 옵션에 따라 세션이 만들어지지만, 화면은 sessionId 만 있으면
 * 다음 단계로 넘어갈 수 있어서 고정 값을 돌려줍니다.
 */
registerMock('POST', '/api/interviews', () => ({ sessionId: 's1' }))
