import { type FormEvent, useId, useState } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import { initialOf } from '@/shared/lib/initialOf'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useMe, type UseMeResult } from '../hooks/useMe'
import { useUpdateProfile } from '../hooks/useUpdateProfile'
import { JOB_TITLE_MAX_LENGTH, NICKNAME_MAX_LENGTH } from '../lib/profileLimits'
import type { Me } from '../types/user'

import MyPageHeader from './MyPageHeader'
import MyPageTitle from './MyPageTitle'

const FIELD_CLASS =
  'w-full rounded-sm border border-neutral-300 px-4 py-2.5 text-body-md text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-500'

/** 고칠 수 없는 값이라 입력창 모양을 빌리되 바탕을 깔아 "읽기 전용" 으로 보이게 합니다 (계정 설정과 같은 모양) */
const READONLY_FIELD_CLASS = 'rounded-sm border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-body-md'

const LABEL_CLASS = 'text-body-sm font-medium text-neutral-700'

type FormProps = {
  me: Me
  /** 저장이 끝나면 수정된 사용자를 넘깁니다. 화면 머리의 이름을 바꾸는 데 씁니다 */
  onSaved: (me: Me) => void
}

/** 서버 값으로 한 번만 초기화합니다. 부모가 `key={me.userId}` 로 감싸서, 사용자가 바뀌면 새로 마운트됩니다. */
function ProfileForm({ me, onSaved }: FormProps) {
  const { submit, saving, error } = useUpdateProfile()
  const nicknameId = useId()
  const jobTitleId = useId()

  const [nickname, setNickname] = useState(me.nickname)
  const [jobTitle, setJobTitle] = useState(me.jobTitle ?? '')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaved(false)

    const trimmedJob = jobTitle.trim()
    const result = await submit({ nickname: nickname.trim(), jobTitle: trimmedJob || null })
    if (!result) return

    setSaved(true)
    onSaved(result)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor={nicknameId} className={LABEL_CLASS}>
          이름
        </label>
        <input
          id={nicknameId}
          type="text"
          required
          maxLength={NICKNAME_MAX_LENGTH}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className={LABEL_CLASS}>이메일</span>
        <p className={`${READONLY_FIELD_CLASS} ${me.email ? 'text-neutral-900' : 'text-neutral-500'}`}>
          {/* 카카오에서 이메일 제공에 동의하지 않으면 null 입니다 */}
          {me.email ?? '카카오에서 이메일을 받지 않았어요'}
        </p>
        <p className="text-body-sm text-neutral-400">이메일은 여기서 바꿀 수 없어요.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={jobTitleId} className={LABEL_CLASS}>
          직무
        </label>
        <input
          id={jobTitleId}
          type="text"
          maxLength={JOB_TITLE_MAX_LENGTH}
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
          placeholder="예) 프론트엔드 개발자"
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {error && (
          <p role="alert" className="text-body-sm text-semantic-danger">
            {error}
          </p>
        )}
        {saved && !error && (
          <p role="status" className="text-body-sm text-semantic-success">
            저장했어요.
          </p>
        )}
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? '저장 중…' : '저장'}
        </Button>
      </div>
    </form>
  )
}

/**
 * 마이페이지 > 프로필 — 이름 · 직무를 고칩니다. 이메일은 보기만 합니다. (B-03 마이페이지/프로필 시안)
 *
 * - 직무는 시안의 고정 목록이 아니라 옵션 설정처럼 **직접 적습니다**. 옵션 설정이 직무를 직접 입력으로 바꿨고(#90),
 *   고정 목록이면 목록에 없는 값이 "선택 안 함" 으로 보여 실제 값과 어긋납니다. (PR #112 리뷰)
 * - 이메일은 명세서에 변경 API(`PATCH /api/users/me/email`)가 따로 있고, 카카오 로그인은 이메일이 없을 수 있어 보기만 합니다.
 * - 시안의 "사진 변경" 은 프로필 사진 필드가 없어 넣지 않았습니다. 원 안에는 이름 첫 글자를 씁니다.
 * - 저장하면 화면 머리(오른쪽 위 프로필)의 이름도 바로 바꿉니다. 다른 화면은 들어갈 때 다시 불러와서 새 이름이 보입니다.
 *
 * 저장 API(`PATCH /api/users/me/profile`)는 아직 백엔드에 없어 목업이 답합니다. (docs/90-open-questions.md Q16)
 */
export default function ProfilePage() {
  const loaded = useMe()
  const [savedMe, setSavedMe] = useState<Me | null>(null)
  const me: UseMeResult = savedMe ? { status: 'ready', me: savedMe } : loaded

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <MyPageHeader title={<MyPageTitle current="프로필" />} me={me} />

      <div className="flex max-w-4xl flex-col items-center gap-4">
        <Card padding="lg" label="프로필" className="w-full">
          <span
            aria-hidden
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-h2 text-neutral-0 ${
              me.status === 'loading' ? 'animate-pulse bg-neutral-200' : 'bg-[image:var(--gradient-brand)]'
            }`}
          >
            {me.status === 'ready' ? initialOf(me.me.nickname) : null}
          </span>

          <hr className="my-5 border-neutral-200" />

          {me.status === 'loading' && <p className="text-body-md text-neutral-500">불러오는 중…</p>}
          {me.status === 'error' && (
            <p role="alert" className="text-body-md text-neutral-500">
              프로필을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
            </p>
          )}
          {me.status === 'ready' && <ProfileForm key={me.me.userId} me={me.me} onSaved={setSavedMe} />}
        </Card>

        <Link
          to={ROUTES.MYPAGE_WITHDRAW}
          className="text-body-sm text-semantic-danger underline-offset-2 hover:underline"
        >
          계정 탈퇴하기
        </Link>
      </div>
    </div>
  )
}
