import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { initialOf } from '@/shared/lib/initialOf'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useMe, type UseMeResult } from '../hooks/useMe'
import { useProfile } from '../hooks/useProfile'
import { useUpdateProfile } from '../hooks/useUpdateProfile'
import { JOB_TITLE_MAX_LENGTH, NICKNAME_MAX_LENGTH } from '../lib/profileLimits'
import type { Profile, ProfileUpdateInput } from '../types/user'

import AccountSection from './AccountSection'
import MyPageHeader from './MyPageHeader'
import MyPageTitle from './MyPageTitle'
import NotificationSection from './NotificationSection'

const FIELD_CLASS =
  'w-full rounded-sm border border-neutral-300 px-4 py-2.5 text-body-md text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-500'

/** 고칠 수 없는 값이라 입력창 모양을 빌리되 바탕을 깔아 "읽기 전용" 으로 보이게 합니다 */
const READONLY_FIELD_CLASS = 'rounded-sm border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-body-md'

const LABEL_CLASS = 'text-body-sm font-medium text-neutral-700'

/**
 * 처음 값과 견줘 **바뀐 칸만** 담습니다. 서버는 보낸 칸만 고치고, 빈 본문은 `EMPTY_UPDATE_REQUEST`(400) 입니다.
 * 직무를 비우면 null 을 보내서 지웁니다.
 */
function changedFields(profile: Profile, userName: string, targetJobRole: string): ProfileUpdateInput {
  const changes: ProfileUpdateInput = {}
  if (userName !== profile.userName) changes.userName = userName
  const job = targetJobRole || null
  if (job !== profile.targetJobRole) changes.targetJobRole = job
  return changes
}

type FormProps = {
  profile: Profile
  /** 저장이 끝나면 고친 뒤의 프로필을 넘깁니다. 화면 머리의 이름을 바꾸는 데 씁니다 */
  onSaved: (profile: Profile) => void
}

/** 서버 값으로 한 번만 초기화합니다. 부모가 `key={profile.userId}` 로 감싸서, 사용자가 바뀌면 새로 마운트됩니다. */
function ProfileForm({ profile, onSaved }: FormProps) {
  const { submit, saving, error } = useUpdateProfile()
  const nameId = useId()
  const jobId = useId()

  // 저장할 때마다 기준을 서버가 돌려준 값으로 옮겨서, 다음 저장도 그 뒤에 바뀐 칸만 보냅니다
  const [saved, setSaved] = useState<Profile>(profile)
  const [userName, setUserName] = useState(profile.userName)
  const [targetJobRole, setTargetJobRole] = useState(profile.targetJobRole ?? '')
  const [justSaved, setJustSaved] = useState(false)

  const changes = changedFields(saved, userName.trim(), targetJobRole.trim())
  const dirty = Object.keys(changes).length > 0

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!dirty) return
    setJustSaved(false)

    const result = await submit(changes)
    if (!result) return

    setSaved(result)
    setJustSaved(true)
    onSaved(result)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor={nameId} className={LABEL_CLASS}>
          이름
        </label>
        <input
          id={nameId}
          type="text"
          required
          maxLength={NICKNAME_MAX_LENGTH}
          value={userName}
          onChange={(event) => {
            setUserName(event.target.value)
            setJustSaved(false)
          }}
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className={LABEL_CLASS}>이메일</span>
        <p className={`${READONLY_FIELD_CLASS} ${profile.email ? 'text-neutral-900' : 'text-neutral-500'}`}>
          {/* 카카오에서 이메일 제공에 동의하지 않으면 null 입니다 */}
          {profile.email ?? '카카오에서 이메일을 받지 않았어요'}
        </p>
        <p className="text-body-sm text-neutral-400">이메일은 여기서 바꿀 수 없어요.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={jobId} className={LABEL_CLASS}>
          직무
        </label>
        <input
          id={jobId}
          type="text"
          maxLength={JOB_TITLE_MAX_LENGTH}
          value={targetJobRole}
          onChange={(event) => {
            setTargetJobRole(event.target.value)
            setJustSaved(false)
          }}
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
        {justSaved && !error && (
          <p role="status" className="text-body-sm text-semantic-success">
            저장했어요.
          </p>
        )}
        <Button type="submit" variant="primary" disabled={saving || !dirty || !userName.trim()}>
          {saving ? '저장 중…' : '저장'}
        </Button>
      </div>
    </form>
  )
}

/**
 * 마이페이지 > 프로필 — 이름 · 직무를 고칩니다. 이메일은 보기만 합니다. (B-03 마이페이지/프로필 시안)
 *
 * 프로필 아래에 계정(로그인 방식 · 로그아웃 · 탈퇴, `AccountSection`)과 알림 설정(`NotificationSection`)을 차례로 붙였습니다.
 * 전에는 마이페이지 메뉴 목록에서 각각 들어가는 화면이었는데, 셋 다 짧아서 한 화면으로 합쳤습니다 (이슈 #185).
 * 옛 주소(`/mypage/account` · `/mypage/notifications`)와 홈 톱니바퀴는 `#account` · `#notifications` 로 그 칸에 내려옵니다.
 *
 * - 값은 프로필 조회(`GET /api/users/me/profile`)에서 읽고, 저장(`PATCH`)은 **바꾼 칸만** 보냅니다. 바뀐 게 없으면 저장 버튼이
 *   잠깁니다 — 빈 본문은 서버가 `EMPTY_UPDATE_REQUEST` 로 거절합니다. (API 명세서 "프로필 수정")
 * - 직무는 시안의 고정 목록이 아니라 옵션 설정처럼 **직접 적습니다**(50자). 고정 목록이면 목록에 없는 값이 "선택 안 함" 으로
 *   보여 실제 값과 어긋납니다. (PR #112 리뷰)
 * - 이메일 변경(`PATCH /api/users/me/email`)은 명세만 받았고 화면은 아직입니다. 카카오 로그인은 이메일이 없을 수 있습니다.
 * - 시안의 "사진 변경" 은 사진을 올릴 API 가 없어(프로필은 주소만 받음) 넣지 않았습니다. 원 안에는 이름 첫 글자를 씁니다.
 * - 시안의 프로필 판 안 "계정 탈퇴하기" 링크는 뺐습니다. 탈퇴는 아래 계정 칸에서만 합니다 (API 명세서 "프로필 수정" 의 화면 피드백).
 * - 저장하면 화면 머리(오른쪽 위 프로필)의 이름도 바로 바꿉니다. 다른 화면은 들어갈 때 다시 불러와서 새 이름이 보입니다.
 *
 * 프로필 API 는 아직 백엔드에 없어 목업이 답합니다(명세서 "시작 전"). 프로필의 자기소개 · 경력 · 학교 칸은 시안이 없어
 * 아직 그리지 않았습니다. (docs/90-open-questions.md Q16)
 */
export default function ProfilePage() {
  const loaded = useMe()
  const profileState = useProfile()
  // 저장한 이름을 머리에 바로 반영합니다. 프로필 이름(userName)과 머리의 닉네임은 같은 값으로 봅니다 (Q16)
  const [savedName, setSavedName] = useState<string | null>(null)
  const me: UseMeResult =
    savedName && loaded.status === 'ready' ? { status: 'ready', me: { ...loaded.me, nickname: savedName } } : loaded

  const initialName = profileState.status === 'ready' ? (savedName ?? profileState.profile.userName) : null

  /*
    `#account` · `#notifications` 로 들어왔으면 그 칸으로 내려갑니다. 라우터는 주소의 # 로 스크롤해 주지 않습니다.
    프로필을 다 받은 뒤에 한 번만 내려갑니다 — 불러오는 동안은 프로필 판이 짧아서, 먼저 내려가면 판이 채워지며 칸이 아래로 밀립니다.
  */
  const { hash } = useLocation()
  const scrolledToSection = useRef(false)
  useEffect(() => {
    if (!hash || profileState.status === 'loading' || scrolledToSection.current) return
    scrolledToSection.current = true
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash, profileState.status])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <MyPageHeader title={<MyPageTitle current="프로필" />} me={me} />

      <div className="flex w-full max-w-4xl flex-col gap-6">
        <Card padding="lg" label="프로필" className="w-full">
          <span
            aria-hidden
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-h2 text-neutral-0 ${
              initialName === null ? 'animate-pulse bg-neutral-200' : 'bg-[image:var(--gradient-brand)]'
            }`}
          >
            {initialName === null ? null : initialOf(initialName)}
          </span>

          <hr className="my-5 border-neutral-200" />

          {profileState.status === 'loading' && <p className="text-body-md text-neutral-500">불러오는 중…</p>}
          {profileState.status === 'error' && (
            <p role="alert" className="text-body-md text-neutral-500">
              프로필을 불러오지 못했어요. {profileState.error}
            </p>
          )}
          {profileState.status === 'ready' && (
            <ProfileForm
              key={profileState.profile.userId}
              profile={profileState.profile}
              onSaved={(next) => setSavedName(next.userName)}
            />
          )}
        </Card>

        <AccountSection me={me} />
        <NotificationSection />
      </div>
    </div>
  )
}
