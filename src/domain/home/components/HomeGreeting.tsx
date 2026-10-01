import { IconPlayerPlayFilled } from '@tabler/icons-react'

import { ROUTES } from '@/app/routes'
import type { UseMeResult } from '@/domain/user/hooks/useMe'
import Button from '@/shared/ui/Button'

import SkeletonBlock from './SkeletonBlock'

type Props = {
  me: UseMeResult
  /** 아직 연습 기록이 하나도 없는 사람인지. "오늘도" 라고 하면 어색해서 문구를 바꿉니다 */
  isNewUser: boolean
}

/** 인사말과 "바로 연습 시작" 버튼. 버튼은 옵션 설정(A-05)으로 갑니다 */
export default function HomeGreeting({ me, isNewUser }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="flex flex-wrap items-center gap-x-2 text-display text-neutral-900">
          안녕하세요{me.status === 'ready' ? ',' : ''}
          {me.status === 'ready' && <span className="text-primary-500">{me.me.nickname}님</span>}
          {me.status === 'loading' && <SkeletonBlock className="h-8 w-28" />}
        </h1>
        <p className="mt-2 text-body-md text-neutral-500">
          {isNewUser
            ? '첫 연습은 5분이면 충분해요. 가볍게 시작해 보세요'
            : '오늘도 5분만 투자해서 면접 감각을 유지해보세요'}
        </p>
      </div>

      <Button variant="primary" size="lg" to={ROUTES.SESSION_SETUP}>
        <IconPlayerPlayFilled size={16} aria-hidden />
        바로 연습 시작
      </Button>
    </div>
  )
}
