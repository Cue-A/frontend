import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useBusinessCard } from '../hooks/useBusinessCard'
import { useMe } from '../hooks/useMe'
import { BUSINESS_CARD_COLORS, bgClassOf } from '../lib/businessCardColors'
import type { BusinessCardColor, BusinessCardInput } from '../types/user'

const FIELD_CLASS =
  'w-full rounded-sm border border-neutral-300 px-4 py-2.5 text-body-md text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-500'

const title = (
  <>
    <Link to={ROUTES.MYPAGE} className="transition-colors hover:text-primary-600">
      마이페이지
    </Link>{' '}
    · 나만의 명함 생성
  </>
)

type Props = {
  initial: BusinessCardInput
  saving: boolean
  saveError: string | null
  save: (input: BusinessCardInput) => Promise<boolean>
}

/** 서버 값(또는 새 명함 기본값)으로 한 번만 초기화합니다. 부모가 `key` 로 감싸서 다시 마운트합니다. */
function BusinessCardForm({ initial, saving, saveError, save }: Props) {
  const [input, setInput] = useState(initial)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaved(false)
    const ok = await save(input)
    if (ok) setSaved(true)
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <div
          className={`flex aspect-[16/9] flex-col items-center justify-center rounded-lg ${bgClassOf(input.color)} text-neutral-0`}
        >
          <p className="text-h2 font-bold uppercase">{input.companyName || 'COMPANY'}</p>
          <p className="text-body-sm opacity-80">DIGITAL BUSINESS CARD</p>
        </div>

        <div className="flex aspect-[16/9] flex-col justify-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-6">
          <p className="self-end text-body-sm font-semibold uppercase text-neutral-500">{input.companyName || 'COMPANY'}</p>
          <p className="text-h2 font-bold text-neutral-900">{input.name || '이름'}</p>
          <p className="text-body-sm text-neutral-500">{input.jobTitle || '직무'}</p>
          <p className="mt-2 text-body-sm text-neutral-700">{input.phone || '010-0000-0000'}</p>
          <p className="text-body-sm text-neutral-700">{input.email || 'you@example.com'}</p>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <Button disabled className="flex-1" title="이미지 저장 기능은 준비 중이에요">
              이미지 다운로드
            </Button>
            <Button variant="primary" disabled className="flex-1" title="공유 기능은 준비 중이에요">
              공유하기
            </Button>
          </div>
          <p className="text-center text-body-sm text-neutral-400">이미지 다운로드 · 공유하기는 아직 준비 중이에요</p>
        </div>
      </div>

      <Card padding="lg" label="명함 정보" className="w-full max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-body-sm font-medium text-neutral-700">이름</span>
            <input
              type="text"
              required
              value={input.name}
              onChange={(event) => setInput((prev) => ({ ...prev, name: event.target.value }))}
              className={FIELD_CLASS}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-body-sm font-medium text-neutral-700">기업명</span>
            <input
              type="text"
              required
              placeholder="예: NAVER"
              value={input.companyName}
              onChange={(event) => setInput((prev) => ({ ...prev, companyName: event.target.value }))}
              className={FIELD_CLASS}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-body-sm font-medium text-neutral-700">직무</span>
            <input
              type="text"
              placeholder="프론트엔드 개발자"
              value={input.jobTitle}
              onChange={(event) => setInput((prev) => ({ ...prev, jobTitle: event.target.value }))}
              className={FIELD_CLASS}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-body-sm font-medium text-neutral-700">이메일</span>
            <input
              type="email"
              placeholder="hong@example.com"
              value={input.email}
              onChange={(event) => setInput((prev) => ({ ...prev, email: event.target.value }))}
              className={FIELD_CLASS}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-body-sm font-medium text-neutral-700">전화번호</span>
            <input
              type="tel"
              placeholder="010-1234-5678"
              value={input.phone}
              onChange={(event) => setInput((prev) => ({ ...prev, phone: event.target.value }))}
              className={FIELD_CLASS}
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-body-sm font-medium text-neutral-700">명함 색상</span>
            <div className="flex gap-2">
              {BUSINESS_CARD_COLORS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-label={`${option.label} 선택`}
                  aria-pressed={input.color === option.value}
                  onClick={() => setInput((prev) => ({ ...prev, color: option.value as BusinessCardColor }))}
                  className={`h-8 w-8 rounded-full ${option.bgClass} ${
                    input.color === option.value ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {saveError && <p className="text-body-sm text-semantic-danger">{saveError}</p>}
          {saved && !saveError && <p className="text-body-sm text-semantic-success">저장했어요.</p>}

          <Button type="submit" variant="primary" disabled={saving} className="self-start">
            {saving ? '저장 중…' : '저장'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

/**
 * B-03 마이페이지 / 디지털 명함. 미리보기 · 폼 · 색상 선택을 한 화면에서 합니다.
 *
 * "이미지 다운로드" · "공유하기" 는 PNG 변환 · 공유 링크 발급이 각자 별도 작업이라
 * 아직 안 걸었습니다 — 다른 화면의 "준비 중" 자리표시 규칙을 그대로 따릅니다 (이슈 #32).
 */
export default function BusinessCardPage() {
  const me = useMe()
  const state = useBusinessCard()

  if (state.status === 'loading' || me.status === 'loading') {
    return <p className="p-6 text-body-md text-neutral-500">불러오는 중…</p>
  }
  if (state.status === 'error') {
    return (
      <p role="alert" className="p-6 text-body-md text-neutral-500">
        {state.error}
      </p>
    )
  }

  const initial: BusinessCardInput = state.card ?? {
    companyName: '',
    name: me.status === 'ready' ? me.me.nickname : '',
    jobTitle: me.status === 'ready' ? (me.me.jobTitle ?? '') : '',
    email: me.status === 'ready' ? (me.me.email ?? '') : '',
    phone: '',
    color: 'purple',
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header className="flex flex-col gap-3">
        <h1 className="text-h1 text-neutral-900">{title}</h1>
        <p className="text-body-sm text-neutral-500">명함에 들어갈 정보를 입력하고 색상을 선택해서 나만의 디지털 명함을 만들어보세요.</p>
      </header>

      <BusinessCardForm
        key={state.card ? 'existing' : 'new'}
        initial={initial}
        saving={state.saving}
        saveError={state.saveError}
        save={state.save}
      />
    </div>
  )
}
