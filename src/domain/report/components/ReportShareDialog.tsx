import { IconLink, IconPhoto } from '@tabler/icons-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

import { formatDate } from '@/shared/lib/formatDate'
import Button from '@/shared/ui/Button'

import type { ReportShare } from '../hooks/useReportShare'

import ReportUnshareDialog from './ReportUnshareDialog'

type Props = {
  share: ReportShare
}

function Option({
  icon,
  title,
  detail,
  children,
}: {
  icon: ReactNode
  title: string
  detail: string
  children: ReactNode
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded-md bg-neutral-50 p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-body-md font-semibold text-neutral-900">{title}</p>
          <p className="mt-1 break-keep text-body-sm text-neutral-500">{detail}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

/**
 * 리포트 공유하기 창입니다. (이슈 #32 · #168 · #199)
 *
 * - 이미지로 공유 — 리포트를 이미지 한 장으로 만들어 보냅니다
 * - 링크로 공유 — 로그인 없이 보는 공개 리포트 링크를 만들고 · 복사하고 · 해제합니다. 링크는 [링크 만들기] 를 눌러야
 *   생깁니다. 링크를 아는 사람은 누구나 답변 내용까지 볼 수 있어서 그 사실을 창 안에 적습니다
 * - 해제는 확인 창(`ReportUnshareDialog`)을 거칩니다. 이미 보낸 링크가 바로 막힙니다
 *
 * 공유 방식은 `useReportShare` 에 있습니다.
 */
export default function ReportShareDialog({ share }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    dialog.showModal()
    // 처음엔 이미지 버튼이 잠겨 있어 브라우저가 링크 칸에 포커스를 줍니다. 칸이 선택된 것처럼 보여서 창 자체에 둡니다
    dialog.focus()
  }, [])

  const { image, link } = share
  const [unshareOpen, setUnshareOpen] = useState(false)

  return (
    <>
      <dialog
        ref={dialogRef}
        onClose={share.close}
        tabIndex={-1}
        aria-labelledby={headingId}
        className="m-auto w-full max-w-md rounded-lg bg-neutral-0 p-0 shadow-float outline-none backdrop:bg-neutral-900/40 print:hidden"
      >
        <div className="flex flex-col gap-1 px-6 pt-5">
          <p id={headingId} className="text-h2 text-neutral-900">
            리포트 공유하기
          </p>
          <p className="text-body-md text-neutral-500">이미지로 보내거나 링크를 복사해요.</p>
        </div>

        <div className="flex flex-col gap-3 px-6 py-5">
          <Option
            icon={<IconPhoto size={18} stroke={2} />}
            title="이미지로 공유"
            detail="리포트를 이미지 한 장으로 만들어 메신저 · 메일로 보내요. 답변 영상은 빠져요."
          >
            <Button
              variant="primary"
              size="sm"
              onClick={share.shareImage}
              disabled={image.status !== 'ready'}
              className="self-start"
            >
              {image.status === 'preparing'
                ? '이미지 만드는 중…'
                : share.canShareImage || image.status !== 'ready'
                  ? '공유 창 열기'
                  : '이미지 내려받기'}
            </Button>
            {image.status === 'error' && (
              <p role="alert" className="text-body-sm text-semantic-danger">
                {image.message}
              </p>
            )}
            {image.status === 'ready' && !share.canShareImage && (
              <p className="break-keep text-body-sm text-neutral-500">
                이 브라우저는 공유 창을 열 수 없어서 이미지를 내려받아요.
              </p>
            )}
          </Option>

          <Option
            icon={<IconLink size={18} stroke={2} />}
            title="링크로 공유"
            detail="링크를 아는 사람은 누구나 로그인 없이 볼 수 있고, 답변 내용도 함께 보여요. 녹음 · 영상은 공유되지 않아요."
          >
            {link ? (
              <>
                <div className="flex gap-2">
                  <input
                    readOnly
                    aria-label="공유 링크"
                    value={link.url}
                    onFocus={(event) => event.currentTarget.select()}
                    className="h-9 min-w-0 flex-1 rounded-sm border border-neutral-300 bg-neutral-0 px-3 text-body-sm text-neutral-700 focus-visible:outline-2 focus-visible:outline-primary-500"
                  />
                  <Button size="sm" onClick={share.copyLink}>
                    {share.copied ? '복사했어요' : '링크 복사'}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-body-sm text-neutral-500">
                    {link.sharedAt ? `${formatDate(link.sharedAt)}부터 공유 중` : '공유 중'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setUnshareOpen(true)}
                    className="rounded-xs text-body-sm font-semibold text-semantic-danger underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary-500"
                  >
                    공유 해제
                  </button>
                </div>
              </>
            ) : (
              <Button size="sm" onClick={share.createLink} disabled={share.creating} className="self-start">
                {share.creating ? '링크 만드는 중…' : '링크 만들기'}
              </Button>
            )}
            {share.linkError && (
              <p role="alert" className="break-keep text-body-sm text-semantic-danger">
                {share.linkError}
              </p>
            )}
          </Option>

          {share.notice && (
            <p role="status" className="break-keep text-body-sm text-neutral-700">
              {share.notice}
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-neutral-200 px-6 py-4">
          <Button size="sm" onClick={() => dialogRef.current?.close()}>
            닫기
          </Button>
        </div>
      </dialog>

      {/*
        해제 확인 창은 공유 창 **바깥**(형제)에 그립니다. 안쪽에 두면 확인 창의 close 이벤트가 React 트리를 타고 공유 창의
        onClose 까지 올라가서, 확인 창에서 Esc · 취소를 눌러도 공유 창까지 같이 닫힙니다. 나중에 띄워서 화면에서는 위에 뜹니다
      */}
      {unshareOpen && <ReportUnshareDialog onUnshare={share.unshare} onClose={() => setUnshareOpen(false)} />}
    </>
  )
}
