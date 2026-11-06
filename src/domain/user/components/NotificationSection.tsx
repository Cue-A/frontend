import { MYPAGE_NOTIFICATIONS_ID } from '@/app/routes'
import Card from '@/shared/ui/Card'
import Switch from '@/shared/ui/Switch'

import { useNotificationSettings } from '../hooks/useNotificationSettings'

const ROW_CLASS = 'justify-between px-6 py-5 text-body-md font-semibold text-neutral-900'

/**
 * 프로필 화면의 알림 설정 칸 — 이메일 · 푸시 알림을 켜고 끕니다. (B-03 마이페이지/알림설정 시안)
 *
 * 전에는 마이페이지 > 알림 설정 화면이었는데, 스위치 두 개뿐이라 프로필 아래로 합쳤습니다 (이슈 #185).
 * 옛 주소(`/mypage/notifications`)는 이 칸(`#notifications`)으로 바로 내려옵니다.
 *
 * 알림 도메인이 API 명세서에 없어 경로를 임시로 정했고 목업이 답합니다. 실제로 알림을 보내는 곳도 아직 없습니다. (Q16)
 */
export default function NotificationSection() {
  const state = useNotificationSettings()

  return (
    <div id={MYPAGE_NOTIFICATIONS_ID} className="flex scroll-mt-6 flex-col gap-2">
      <Card padding="none" label="알림 설정" className="w-full divide-y divide-neutral-200">
        <h2 className="px-6 pb-4 pt-6 text-h2 text-neutral-900">알림 설정</h2>

        {state.status === 'loading' && <p className="px-6 py-5 text-body-md text-neutral-500">불러오는 중…</p>}
        {state.status === 'error' && (
          <p role="alert" className="px-6 py-5 text-body-md text-neutral-500">
            알림 설정을 불러오지 못했어요. {state.error}
          </p>
        )}
        {state.status === 'ready' && (
          <>
            <Switch
              checked={state.settings.emailAlerts}
              onChange={(value) => state.toggle('emailAlerts', value)}
              labelFirst
              className={ROW_CLASS}
            >
              이메일 알림
            </Switch>
            <Switch
              checked={state.settings.pushAlerts}
              onChange={(value) => state.toggle('pushAlerts', value)}
              labelFirst
              className={ROW_CLASS}
            >
              푸시 알림
            </Switch>
          </>
        )}
      </Card>

      {state.status === 'ready' && state.actionError && (
        <p role="alert" className="text-body-sm text-semantic-danger">
          {state.actionError}
        </p>
      )}
    </div>
  )
}
