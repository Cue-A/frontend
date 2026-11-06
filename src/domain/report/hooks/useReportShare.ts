import { useCallback, useRef, useState, type RefObject } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'
import { downloadBlob } from '@/shared/lib/downloadFile'

import { createReportShareLink } from '../api/reportShareApi'

type Prepared<T> =
  { status: 'idle' | 'preparing' } | { status: 'ready'; value: T } | { status: 'error'; message: string }

export type ReportShare = {
  isOpen: boolean
  /** 공유 창을 열고, 이미지 · 링크를 미리 만들어 둡니다 */
  open: () => void
  close: () => void
  image: Prepared<File>
  link: Prepared<string>
  /** 이 브라우저가 이미지 파일을 공유 창으로 보낼 수 있는지. 안 되면 "이미지로 공유" 가 내려받기로 바뀝니다 */
  canShareImage: boolean
  shareImage: () => void
  copyLink: () => void
  /** 방금 링크를 복사했는지 */
  copied: boolean
  /** 공유 · 복사 결과 안내 */
  notice: string | null
}

const IMAGE_FAILED = '이미지를 만들지 못했어요. 창을 닫았다가 다시 열어 주세요.'
const SHARE_TITLE = '큐앤에이 결과 리포트'

function canShareFile(file: File) {
  return (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  )
}

/**
 * 리포트 공유하기입니다. (이슈 #32 · #168)
 *
 * - **이미지로 공유** — 리포트 본문을 PNG 로 찍어 기기의 공유 창(메신저 · 메일 등)으로 보냅니다. 서버가 필요 없어 실제로 동작합니다.
 *   공유 창을 못 여는 브라우저(데스크톱 Firefox 등)는 이미지를 내려받습니다.
 * - **링크 복사** — 공유 링크 API 가 아직 없어 목업이 지금 리포트 주소를 줍니다(`reportShareMock.ts`). 내 계정에서만 열립니다.
 *
 * 창을 열 때 둘 다 미리 만듭니다. 공유 창 · 클립보드는 **누른 그 순간**에만 열리는 브라우저가 있어서(Safari), 누르고 나서 몇 초
 * 걸려 찍으면 공유가 거절됩니다. 미리 만들어 두면 버튼을 누를 때 바로 엽니다.
 */
export function useReportShare(
  sheetRef: RefObject<HTMLElement | null>,
  fileBaseName: string,
  reportId: string | null,
): ReportShare {
  const [isOpen, setIsOpen] = useState(false)
  const [image, setImage] = useState<Prepared<File>>({ status: 'idle' })
  const [link, setLink] = useState<Prepared<string>>({ status: 'idle' })
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  /** 몇 번째로 연 창인지. 닫았다 다시 열면, 늦게 끝난 지난번 결과를 버립니다 */
  const openCount = useRef(0)

  const open = useCallback(() => {
    const sheet = sheetRef.current
    if (!sheet || !reportId) return
    openCount.current += 1
    const current = openCount.current
    setIsOpen(true)
    setCopied(false)
    setNotice(null)
    setImage({ status: 'preparing' })
    setLink({ status: 'preparing' })

    import('../lib/reportCapture')
      .then(({ captureReportPng }) => captureReportPng(sheet))
      .then((blob) => {
        if (current !== openCount.current) return
        setImage({ status: 'ready', value: new File([blob], `${fileBaseName}.png`, { type: 'image/png' }) })
      })
      .catch((cause: unknown) => {
        console.error('리포트 공유 이미지 만들기 실패 reason=%s', cause instanceof Error ? cause.name : typeof cause)
        if (current === openCount.current) setImage({ status: 'error', message: IMAGE_FAILED })
      })

    createReportShareLink(reportId)
      .then(({ shareUrl }) => {
        if (current === openCount.current) setLink({ status: 'ready', value: shareUrl })
      })
      .catch((cause: unknown) => {
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        console.error('리포트 공유 링크 발급 실패 code=%s', code)
        if (current === openCount.current)
          setLink({ status: 'error', message: `링크를 만들지 못했어요. ${toUserMessage(code)}` })
      })
  }, [sheetRef, fileBaseName, reportId])

  const close = useCallback(() => {
    openCount.current += 1
    setIsOpen(false)
  }, [])

  const canShareImage = image.status === 'ready' && canShareFile(image.value)

  const shareImage = () => {
    if (image.status !== 'ready') return
    const file = image.value
    setNotice(null)
    if (!canShareFile(file)) {
      downloadBlob(file, file.name)
      setNotice('이미지를 내려받았어요. 메신저나 메일에 직접 올려 주세요.')
      return
    }
    navigator.share({ files: [file], title: SHARE_TITLE }).catch((cause: unknown) => {
      // 공유 창에서 닫은 것은 실패가 아닙니다
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      console.error('리포트 이미지 공유 실패 reason=%s', cause instanceof Error ? cause.name : typeof cause)
      setNotice('공유 창을 열지 못했어요. 리포트 저장의 "이미지로 저장" 으로 내려받아 보내 주세요.')
    })
  }

  const copyLink = () => {
    if (link.status !== 'ready') return
    setNotice(null)
    if (!navigator.clipboard) {
      setNotice('이 브라우저는 자동 복사를 지원하지 않아요. 링크 칸을 눌러 직접 복사해 주세요.')
      return
    }
    navigator.clipboard.writeText(link.value).then(
      () => setCopied(true),
      () => setNotice('복사하지 못했어요. 링크 칸을 눌러 직접 복사해 주세요.'),
    )
  }

  return { isOpen, open, close, image, link, canShareImage, shareImage, copyLink, copied, notice }
}
