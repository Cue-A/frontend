import { useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useMe } from '../hooks/useMe'
import { WITHDRAW_DETAIL_MAX, WITHDRAW_REASONS } from '../lib/withdrawReasons'
import type { WithdrawReason, WithdrawRequest } from '../types/user'

import MyPageHeader from './MyPageHeader'
import WithdrawConfirmDialog from './WithdrawConfirmDialog'

/**
 * 회원 탈퇴 — 이유 고르기 → 최종 확인(창) → 완료. (마이페이지 > 계정 설정 > 계정 탈퇴하기)
 *
 * 프레시코드 탈퇴 화면을 참고한 임시 흐름입니다(시안 없음). 한 화면에서 **이유를 왜 묻는지** 먼저 적고 이유를
 * 고르게 한 뒤, "탈퇴하기" 를 누르면 확인 창(WithdrawConfirmDialog)에서 한 번 더 묻습니다.
 *
 * 이유는 꼭 하나 골라야 합니다. 탈퇴 요청에 같이 보냅니다 (docs/90-open-questions.md Q14).
 */
export default function WithdrawPage() {
  const me = useMe()
  const navigate = useNavigate()
  const detailId = useId()
  const hintId = useId()

  const [reason, setReason] = useState<WithdrawReason | null>(null)
  const [detail, setDetail] = useState('')
  const [confirming, setConfirming] = useState<WithdrawRequest | null>(null)

  const nickname = me.status === 'ready' ? me.me.nickname : null

  const openConfirm = () => {
    if (!reason) return
    const trimmed = detail.trim()
    setConfirming({ reason, ...(reason === 'OTHER' && trimmed ? { detail: trimmed } : {}) })
  }

  const title = (
    <>
      <Link to={ROUTES.MYPAGE} className="transition-colors hover:text-primary-600">
        마이페이지
      </Link>{' '}
      ·{' '}
      <Link to={ROUTES.MYPAGE_ACCOUNT} className="transition-colors hover:text-primary-600">
        계정 설정
      </Link>{' '}
      · 회원 탈퇴
    </>
  )

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <MyPageHeader title={title} me={me} />

      <Card padding="lg" label="회원 탈퇴" className="w-full max-w-4xl">
        <div className="flex flex-col gap-1">
          <h2 className="break-keep text-h2 text-neutral-900">
            {nickname ? `${nickname}님, ` : ''}그동안 Cue&amp;A 와 함께해 주셔서 고마워요
          </h2>
          <p className="break-keep text-body-md text-neutral-500">
            떠나시는 이유를 알려주시면, 다른 분들이 같은 불편을 겪지 않도록 면접 질문 · 리포트 · 연습 환경을 고치는 데
            참고할게요.
          </p>
        </div>

        <hr className="my-4 border-neutral-200" />

        <fieldset aria-describedby={reason ? undefined : hintId}>
          <legend className="mb-2 text-body-lg text-neutral-900">탈퇴하시는 이유를 골라주세요</legend>
          <div className="flex flex-col">
            {WITHDRAW_REASONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-sm px-2 py-1.5 text-body-md text-neutral-700 transition-colors hover:bg-neutral-50 has-[:checked]:text-neutral-900"
              >
                <input
                  type="radio"
                  name="withdraw-reason"
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => setReason(option.value)}
                  className="h-4 w-4 shrink-0 accent-primary-500"
                />
                {option.label}
              </label>
            ))}
          </div>

          {reason === 'OTHER' && (
            <div className="mt-2 flex flex-col gap-1 pl-2">
              <label htmlFor={detailId} className="text-body-sm text-neutral-500">
                어떤 점이 불편하셨는지 적어주세요 (선택)
              </label>
              <textarea
                id={detailId}
                value={detail}
                maxLength={WITHDRAW_DETAIL_MAX}
                onChange={(event) => setDetail(event.target.value)}
                rows={3}
                className="resize-none rounded-sm border border-neutral-300 px-3 py-2 text-body-md text-neutral-900 outline-none focus:border-primary-500"
              />
              <p className="self-end text-micro text-neutral-500">
                {detail.length} / {WITHDRAW_DETAIL_MAX}
              </p>
            </div>
          )}
        </fieldset>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button to={ROUTES.MYPAGE_ACCOUNT}>이전</Button>
          <div className="flex items-center gap-3">
            {!reason && (
              <p id={hintId} className="text-body-sm text-neutral-500">
                이유를 하나 골라주세요
              </p>
            )}
            <Button variant="primary" onClick={openConfirm} disabled={!reason}>
              탈퇴하기
            </Button>
          </div>
        </div>
      </Card>

      {confirming && (
        <WithdrawConfirmDialog
          request={confirming}
          onWithdrawn={() => navigate(ROUTES.LANDING, { replace: true })}
          onClose={() => setConfirming(null)}
        />
      )}
    </div>
  )
}
