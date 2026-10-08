import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useMe } from '../hooks/useMe'
import { useUpdateProfile } from '../hooks/useUpdateProfile'
import type { Me } from '../types/user'

const FIELD_CLASS =
  'w-full rounded-sm border border-neutral-300 px-4 py-2.5 text-body-md text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-500'

/** 시안의 직무 선택지입니다. 자유 입력이 아니라 고정 목록입니다 (면접 옵션 설정과 같은 목록). */
const JOB_TITLES = ['프론트엔드 개발자', '백엔드 개발자', '풀스택 개발자', 'AI/ML 엔지니어', '디자이너', '기획자', '기타']

const title = (
  <>
    <Link to={ROUTES.MYPAGE} className="transition-colors hover:text-primary-600">
      마이페이지
    </Link>{' '}
    · 프로필
  </>
)

/** 서버 값으로 한 번만 초기화합니다. 부모가 `key={me.userId}` 로 감싸서, 사용자가 바뀌면 새로 마운트됩니다. */
function ProfileForm({ me }: { me: Me }) {
  const { submit, saving, error } = useUpdateProfile()

  const [nickname, setNickname] = useState(me.nickname)
  const [email, setEmail] = useState(me.email ?? '')
  const [jobTitle, setJobTitle] = useState(me.jobTitle ?? '')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaved(false)

    const result = await submit({ nickname: nickname.trim(), email: email.trim(), jobTitle: jobTitle || null })
    if (result) setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-neutral-700">이름</span>
        <input
          type="text"
          required
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          className={FIELD_CLASS}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-neutral-700">이메일</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="hong@example.com"
          className={FIELD_CLASS}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-neutral-700">직무</span>
        <select value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} className={FIELD_CLASS}>
          <option value="">선택 안 함</option>
          {JOB_TITLES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-body-sm text-semantic-danger">{error}</p>}
      {saved && !error && <p className="text-body-sm text-semantic-success">저장했어요.</p>}

      <Button type="submit" variant="primary" disabled={saving} className="self-start">
        {saving ? '저장 중…' : '저장'}
      </Button>
    </form>
  )
}

/**
 * B-03 마이페이지/프로필. 이름 · 이메일 · 직무를 고칩니다.
 *
 * `PATCH /users/me/profile` 은 아직 백엔드에 없습니다(목업). 실제 계약이 생기면 이메일도 이 API 가
 * 받을지, 계정 설정의 `PATCH /api/users/me/email` 로 따로 뺄지 다시 맞춰야 합니다. (userApi.ts 주석)
 */
export default function ProfilePage() {
  const me = useMe()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header className="flex flex-col gap-3">
        <h1 className="text-h1 text-neutral-900">{title}</h1>
      </header>

      <Card padding="lg" label="프로필" className="w-full max-w-2xl">
        {me.status === 'loading' && <p className="text-body-md text-neutral-500">불러오는 중…</p>}
        {me.status === 'error' && (
          <p role="alert" className="text-body-md text-neutral-500">
            프로필을 불러오지 못했어요.
          </p>
        )}
        {me.status === 'ready' && <ProfileForm key={me.me.userId} me={me.me} />}
      </Card>
    </div>
  )
}
