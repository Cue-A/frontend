import { IconDownload, IconShare } from '@tabler/icons-react'
import { type FormEvent, useId, useRef, useState } from 'react'

import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useBusinessCard } from '../hooks/useBusinessCard'
import { useBusinessCardImage } from '../hooks/useBusinessCardImage'
import { useMe } from '../hooks/useMe'
import { useProfile } from '../hooks/useProfile'
import { BUSINESS_CARD_COLORS, colorOf } from '../lib/businessCardColors'
import type { BusinessCardInput } from '../types/user'

import MyPageHeader from './MyPageHeader'
import MyPageTitle from './MyPageTitle'

const FIELD_CLASS =
  'w-full rounded-sm border border-neutral-300 px-4 py-2.5 text-body-md text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-500'

const LABEL_CLASS = 'text-body-sm font-medium text-neutral-700'

/** 글자를 넣는 칸들. 순서대로 그립니다 */
const TEXT_FIELDS: {
  key: Exclude<keyof BusinessCardInput, 'color'>
  label: string
  placeholder: string
  type: 'text' | 'email' | 'tel'
  required?: boolean
}[] = [
  { key: 'name', label: '이름', placeholder: '홍길동', type: 'text', required: true },
  { key: 'companyName', label: '기업명', placeholder: '예) NAVER', type: 'text', required: true },
  { key: 'jobTitle', label: '직무', placeholder: '프론트엔드 개발자', type: 'text' },
  { key: 'email', label: '이메일', placeholder: 'hong@example.com', type: 'email' },
  { key: 'phone', label: '전화번호', placeholder: '010-1234-5678', type: 'tel' },
]

/** 명함 앞 · 뒷면 미리보기. 이미지 다운로드가 이 판을 그대로 찍습니다 */
function CardPreview({ input }: { input: BusinessCardInput }) {
  const color = colorOf(input.color)
  const company = input.companyName.trim() || 'COMPANY'

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className={`flex aspect-video flex-col items-center justify-center gap-1 rounded-sm shadow-card ${color.bgClass}`}>
        <p className="max-w-full truncate px-6 text-h1 uppercase text-neutral-0">{company}</p>
        <p className="text-micro tracking-widest text-neutral-0/80">DIGITAL BUSINESS CARD</p>
      </div>

      <div className="flex aspect-video flex-col justify-end gap-0.5 rounded-sm border border-neutral-200 bg-neutral-50 p-6 shadow-card">
        <p className={`mb-auto self-end text-body-lg font-semibold uppercase ${color.textClass}`}>{company}</p>
        <p className="text-h2 text-neutral-900">{input.name.trim() || '이름'}</p>
        <p className="text-body-sm text-neutral-500">{input.jobTitle.trim() || '직무'}</p>
        <p className="mt-3 text-body-sm text-neutral-700">{input.phone.trim() || '010-0000-0000'}</p>
        <p className="text-body-sm text-neutral-700">{input.email.trim() || 'you@example.com'}</p>
      </div>
    </div>
  )
}

type FormProps = {
  initial: BusinessCardInput
  saving: boolean
  saveError: string | null
  save: (input: BusinessCardInput) => Promise<boolean>
}

/**
 * 명함 미리보기 · 저장 버튼 · 입력 칸입니다. 서버 값(또는 새 명함 기본값)으로 한 번만 초기화합니다.
 *
 * 부모가 **key 를 바꾸지 않습니다.** 전에는 명함이 있고 없음으로 key 를 나눠서, 처음 저장한 직후 폼이 새로 마운트되며
 * "저장했어요." 가 사라졌습니다. 폼은 명함을 다 불러온 뒤에만 그려서 key 없이도 첫 값이 맞습니다. (PR #112 리뷰)
 */
function BusinessCardForm({ initial, saving, saveError, save }: FormProps) {
  const [input, setInput] = useState(initial)
  const [saved, setSaved] = useState(false)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const image = useBusinessCardImage(previewRef, input.name.trim())
  const fieldId = useId()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaved(false)
    if (await save(input)) setSaved(true)
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div ref={previewRef}>
          <CardPreview input={input} />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2">
            <Button onClick={image.save} disabled={image.saving}>
              <IconDownload size={16} stroke={2} aria-hidden />
              {image.saving ? '이미지 만드는 중…' : '이미지 다운로드'}
            </Button>
            <Button variant="primary" disabled>
              <IconShare size={16} stroke={2} aria-hidden />
              공유하기
            </Button>
          </div>
          {image.error ? (
            <p role="alert" className="text-body-sm text-semantic-danger">
              {image.error}
            </p>
          ) : (
            <p className="text-center text-body-sm text-neutral-400">
              PNG 이미지로 저장돼요 · 공유하기는 아직 준비 중이에요
            </p>
          )}
        </div>
      </div>

      <Card padding="lg" label="명함 정보" className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <h2 className="text-body-lg font-semibold text-neutral-900">명함 정보</h2>

          {TEXT_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-2">
              <label htmlFor={`${fieldId}-${field.key}`} className={LABEL_CLASS}>
                {field.label}
              </label>
              <input
                id={`${fieldId}-${field.key}`}
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                value={input[field.key]}
                onChange={(event) => setInput((prev) => ({ ...prev, [field.key]: event.target.value }))}
                className={FIELD_CLASS}
              />
            </div>
          ))}

          <fieldset className="flex flex-col gap-2">
            <legend className={`${LABEL_CLASS} mb-2`}>명함 색상</legend>
            <div className="flex gap-3">
              {BUSINESS_CARD_COLORS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-label={option.label}
                  aria-pressed={input.color === option.value}
                  onClick={() => setInput((prev) => ({ ...prev, color: option.value }))}
                  className={`h-8 w-8 rounded-full ${option.bgClass} ${
                    input.color === option.value ? 'ring-2 ring-neutral-900 ring-offset-2' : ''
                  }`}
                />
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {saveError && (
              <p role="alert" className="text-body-sm text-semantic-danger">
                {saveError}
              </p>
            )}
            {saved && !saveError && (
              <p role="status" className="text-body-sm text-semantic-success">
                저장했어요.
              </p>
            )}
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

/**
 * 마이페이지 > 나만의 명함 생성 — 미리보기 · 입력 · 색상 선택 · 이미지 다운로드. (B-03 마이페이지/디지털 명함 시안)
 *
 * - 처음 만들 때는 이름 · 직무 · 이메일을 내 프로필(`GET /api/users/me/profile`)로 채워 둡니다. 프로필을 못 불러오면 빈 칸입니다.
 * - "이미지 다운로드" 는 지금 보이는 미리보기(앞 · 뒷면)를 PNG 한 장으로 내려받습니다. 저장하지 않은 수정도 그대로 들어갑니다.
 * - "공유하기" 는 공유 링크를 만들어 줄 API 가 없어 비활성입니다. 못 누르는 이유는 툴팁이 아니라 글로 적습니다 (이슈 #32).
 * - 시안에는 저장 버튼이 없지만, 명함을 서버에 남기려면 필요해서 입력 칸 아래에 둡니다.
 *
 * 명함 API(`POST · GET · PATCH /api/users/me/business-card`)는 아직 백엔드에 없어 목업이 답합니다. (Q16)
 */
export default function BusinessCardPage() {
  const me = useMe()
  const profileState = useProfile()
  const state = useBusinessCard()

  const body = (() => {
    // 처음 만들 때만 프로필을 쓰지만, 폼은 첫 값으로 한 번만 초기화해서 프로필도 기다립니다
    if (state.status === 'loading' || (state.status === 'ready' && !state.card && profileState.status === 'loading')) {
      return <p className="text-body-md text-neutral-500">불러오는 중…</p>
    }
    if (state.status === 'error') {
      return (
        <p role="alert" className="text-body-md text-neutral-500">
          {state.error}
        </p>
      )
    }

    const mine = profileState.status === 'ready' ? profileState.profile : null
    const initial: BusinessCardInput = state.card ?? {
      companyName: '',
      name: mine?.userName ?? '',
      jobTitle: mine?.targetJobRole ?? '',
      email: mine?.email ?? '',
      phone: '',
      color: 'purple',
    }

    return <BusinessCardForm initial={initial} saving={state.saving} saveError={state.saveError} save={state.save} />
  })()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <MyPageHeader title={<MyPageTitle current="나만의 명함 생성" />} me={me} />
      <p className="text-body-sm text-neutral-500">
        명함에 들어갈 정보를 입력하고 색상을 선택해서 나만의 디지털 명함을 만들어보세요.
      </p>
      {body}
    </div>
  )
}
