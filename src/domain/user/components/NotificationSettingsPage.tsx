import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import Card from '@/shared/ui/Card'
import Switch from '@/shared/ui/Switch'

import { useNotificationSettings } from '../hooks/useNotificationSettings'

const title = (
  <>
    <Link to={ROUTES.MYPAGE} className="transition-colors hover:text-primary-600">
      마이페이지
    </Link>{' '}
    · 알림설정
  </>
)

/** B-03 마이페이지/알림설정. 이메일 · 푸시 알림을 켜고 끕니다. */
export default function NotificationSettingsPage() {
  const state = useNotificationSettings()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header className="flex flex-col gap-3">
        <h1 className="text-h1 text-neutral-900">{title}</h1>
      </header>

      <Card padding="none" label="알림설정" className="w-full max-w-2xl divide-y divide-neutral-200">
        {state.status === 'loading' && <p className="p-5 text-body-md text-neutral-500">불러오는 중…</p>}
        {state.status === 'error' && (
          <p role="alert" className="p-5 text-body-md text-neutral-500">
            {state.error}
          </p>
        )}
        {state.status === 'ready' && (
          <>
            <Switch
              checked={state.settings.emailAlerts}
              onChange={(value) => state.toggle('emailAlerts', value)}
              labelFirst
              className="p-5 text-body-md text-neutral-900"
            >
              이메일 알림
            </Switch>
            <Switch
              checked={state.settings.pushAlerts}
              onChange={(value) => state.toggle('pushAlerts', value)}
              labelFirst
              className="p-5 text-body-md text-neutral-900"
            >
              푸시 알림
            </Switch>
          </>
        )}
      </Card>
    </div>
  )
}
