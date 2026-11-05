import { IconLink, IconPhoto } from '@tabler/icons-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'

import type { ReportShare } from '../hooks/useReportShare'

type Props = {
  share: ReportShare
}

function Option({
  icon,
  title,
  badge,
  detail,
  children,
}: {
  icon: ReactNode
  title: string
  badge?: string
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
          <p className="flex flex-wrap items-center gap-2 text-body-md font-semibold text-neutral-900">
            {title}
            {badge && <Badge onTint>{badge}</Badge>}
          </p>
          <p className="mt-1 break-keep text-body-sm text-neutral-500">{detail}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

/**
 * 리포트 공유하기 창입니다. (이슈 #32 · #168)
 *
 * 이미지로 공유는 실제로 동작하고, 링크 복사는 공유 링크 API 가 없어 목업 링크(지금 리포트 주소)를 줍니다. 링크가 내 계정에서만
 * 열린다는 걸 글로 적습니다 — 남에게 보냈는데 안 열리면 고장으로 읽힙니다. 공유 방식은 `useReportShare` 에 있습니다.
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

  return (
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
          title="링크 복사"
          badge="준비 중"
          detail="지금 링크는 내 계정으로 로그인해야 열려요. 다른 사람이 보는 공유 화면은 준비 중이에요."
        >
          <div className="flex gap-2">
            <input
              readOnly
              aria-label="공유 링크"
              value={link.status === 'ready' ? link.value : ''}
              placeholder={link.status === 'preparing' ? '링크 만드는 중…' : ''}
              onFocus={(event) => event.currentTarget.select()}
              className="h-9 min-w-0 flex-1 rounded-sm border border-neutral-300 bg-neutral-0 px-3 text-body-sm text-neutral-700 focus-visible:outline-2 focus-visible:outline-primary-500"
            />
            <Button size="sm" onClick={share.copyLink} disabled={link.status !== 'ready'}>
              {share.copied ? '복사했어요' : '링크 복사'}
            </Button>
          </div>
          {link.status === 'error' && (
            <p role="alert" className="text-body-sm text-semantic-danger">
              {link.message}
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
  )
}
