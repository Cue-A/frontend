import Card from '@/shared/ui/Card'
import Switch from '@/shared/ui/Switch'

import { useMe } from '../hooks/useMe'
import { useNotificationSettings } from '../hooks/useNotificationSettings'

import MyPageHeader from './MyPageHeader'
import MyPageTitle from './MyPageTitle'

/**
 * 마이페이지 > 알림 설정 — 이메일 · 푸시 알림을 켜고 끕니다. (B-03 마이페이지/알림설정 시안)
 *
 * 알림 도메인이 API 명세서에 없어 경로를 임시로 정했고 목업이 답합니다. 실제로 알림을 보내는 곳도 아직 없습니다. (Q16)
 */
export default function NotificationSettingsPage() {
  const me = useMe()
  const state = useNotificationSettings()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <MyPageHeader title={<MyPageTitle current="알림 설정" />} me={me} />

      <Card padding="none" label="알림 설정" className="w-full max-w-4xl divide-y divide-neutral-200">
        {state.status === 'loading' && <p className="p-5 text-body-md text-neutral-500">불러오는 중…</p>}
        {state.status === 'error' && (
          <p role="alert" className="p-5 text-body-md text-neutral-500">
            알림 설정을 불러오지 못했어요. {state.error}
          </p>
        )}
        {state.status === 'ready' && (
          <>
            <Switch
              checked={state.settings.emailAlerts}
              onChange={(value) => state.toggle('emailAlerts', value)}
              labelFirst
              className="justify-between p-5 text-body-md font-semibold text-neutral-900"
            >
              이메일 알림
            </Switch>
            <Switch
              checked={state.settings.pushAlerts}
              onChange={(value) => state.toggle('pushAlerts', value)}
              labelFirst
              className="justify-between p-5 text-body-md font-semibold text-neutral-900"
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
