import { useCallback, useRef, useState, type RefObject } from 'react'

import { toSharedReportUrl } from '@/app/routes'
import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'
import { downloadBlob } from '@/shared/lib/downloadFile'

import { createReportShare, deleteReportShare } from '../api/reportShareApi'
import { toReportShare } from '../api/reportResponse'
import type { ReportShare as ReportShareLink } from '../types/report'

type Prepared<T> =
  { status: 'idle' | 'preparing' } | { status: 'ready'; value: T } | { status: 'error'; message: string }

/** 공유할 리포트. 리포트를 아직 못 불러왔으면 null */
type ShareTarget = { reportId: string; share: ReportShareLink | null } | null

export type ReportShare = {
  isOpen: boolean
  /** 공유 창을 열고 이미지를 미리 만들어 둡니다. 링크는 만들지 않습니다 */
  open: () => void
  close: () => void
  image: Prepared<File>
  /** 이 브라우저가 이미지 파일을 공유 창으로 보낼 수 있는지. 안 되면 "이미지로 공유" 가 내려받기로 바뀝니다 */
  canShareImage: boolean
  shareImage: () => void

  /** 지금 열려 있는 공유 링크. 공유하지 않았으면 null */
  link: { url: string; sharedAt: string | null } | null
  /** 링크를 만드는 중인지 */
  creating: boolean
  /** 링크를 만듭니다. 이미 공유 중이면 서버가 같은 링크를 줍니다 */
  createLink: () => void
  copyLink: () => void
  /** 방금 링크를 복사했는지 */
  copied: boolean
  /** 공유를 해제합니다. 실패하면 사용자에게 보여줄 문구를, 성공하면 null 을 돌려줍니다 (확인 창이 씁니다) */
  unshare: () => Promise<string | null>
  /** 공유 · 복사 · 해제 결과 안내 */
  notice: string | null
  /** 링크를 만들지 못했을 때 안내 */
  linkError: string | null
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

function errorCodeOf(cause: unknown) {
  return cause instanceof ApiError ? cause.code : 'UNKNOWN'
}

/**
 * 리포트 공유하기입니다. (이슈 #32 · #168 · #199)
 *
 * - **이미지로 공유** — 리포트 본문을 PNG 로 찍어 기기의 공유 창(메신저 · 메일 등)으로 보냅니다. 서버가 필요 없습니다.
 *   공유 창을 못 여는 브라우저(데스크톱 Firefox 등)는 이미지를 내려받습니다. 공유 창은 **누른 그 순간**에만 열리는 브라우저가
 *   있어서(Safari), 창을 열 때 이미지를 미리 만들어 둡니다.
 * - **링크로 공유** — 로그인 없이 보는 공개 리포트 링크입니다(Cue-A/backend#137). 공유 상태는 리포트 응답의 `share` 에서 옵니다.
 *   - **창을 열기만 해서는 링크를 만들지 않습니다.** 링크가 생기면 답변 내용까지 누구나 볼 수 있어서, [링크 만들기] 를 눌렀을 때만 만듭니다
 *   - 만든 직후 자동으로 복사하지 않습니다. 클립보드도 누른 순간에만 열리는 브라우저가 있어서, 요청이 끝난 뒤 복사하면 거절됩니다.
 *     [링크 복사] 를 한 번 더 누르게 하고, 그래도 막히면 링크 칸을 눌러 직접 복사하도록 안내합니다
 *   - 해제하면 그 링크는 바로 막히고, 다시 만들면 새 링크입니다
 *
 * 만들기 · 해제한 결과는 리포트를 다시 불러오지 않고 이 훅이 들고 있습니다. 리포트를 다시 부르면 회차 비교 · 타임라인까지
 * 따라서 다시 부르는데, 공유 상태는 공유 창 말고는 쓰는 곳이 없습니다. 다른 회차로 옮기면(`reportId` 가 바뀌면) 버리고
 * 그 회차 응답의 `share` 를 따릅니다.
 */
export function useReportShare(
  sheetRef: RefObject<HTMLElement | null>,
  fileBaseName: string,
  target: ShareTarget,
): ReportShare {
  const [isOpen, setIsOpen] = useState(false)
  const [image, setImage] = useState<Prepared<File>>({ status: 'idle' })
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  /** 이 화면에서 만들거나 해제한 결과. 어느 리포트의 결과인지 같이 둡니다 */
  const [changed, setChanged] = useState<{ reportId: string; share: ReportShareLink | null } | null>(null)
  /** 몇 번째로 연 창인지. 닫았다 다시 열면, 늦게 끝난 지난번 이미지를 버립니다 */
  const openCount = useRef(0)

  const reportId = target?.reportId ?? null
  const current = target ? (changed?.reportId === target.reportId ? changed.share : target.share) : null

  const open = useCallback(() => {
    const sheet = sheetRef.current
    if (!sheet || !reportId) return
    openCount.current += 1
    const count = openCount.current
    setIsOpen(true)
    setCopied(false)
    setNotice(null)
    setLinkError(null)
    setImage({ status: 'preparing' })

    import('../lib/reportCapture')
      .then(({ captureReportPng }) => captureReportPng(sheet))
      .then((blob) => {
        if (count !== openCount.current) return
        setImage({ status: 'ready', value: new File([blob], `${fileBaseName}.png`, { type: 'image/png' }) })
      })
      .catch((cause: unknown) => {
        console.error('리포트 공유 이미지 만들기 실패 reason=%s', cause instanceof Error ? cause.name : typeof cause)
        if (count === openCount.current) setImage({ status: 'error', message: IMAGE_FAILED })
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

  const createLink = () => {
    if (!reportId || creating) return
    setCreating(true)
    setNotice(null)
    setLinkError(null)
    setCopied(false)

    createReportShare(reportId)
      .then((response) => {
        setChanged({ reportId, share: toReportShare(response) })
        setNotice('링크를 만들었어요. 복사해서 보내 주세요.')
      })
      .catch((cause: unknown) => {
        const code = errorCodeOf(cause)
        console.error('리포트 공유 링크 만들기 실패 reportId=%s code=%s', reportId, code)
        setLinkError(`링크를 만들지 못했어요. ${toUserMessage(code)}`)
      })
      .finally(() => setCreating(false))
  }

  const copyLink = () => {
    if (!current) return
    setNotice(null)
    if (!navigator.clipboard) {
      setNotice('이 브라우저는 자동 복사를 지원하지 않아요. 링크 칸을 눌러 직접 복사해 주세요.')
      return
    }
    navigator.clipboard.writeText(toSharedReportUrl(current.shareId)).then(
      () => setCopied(true),
      () => setNotice('복사하지 못했어요. 링크 칸을 눌러 직접 복사해 주세요.'),
    )
  }

  const unshare = async (): Promise<string | null> => {
    if (!reportId) return null
    try {
      await deleteReportShare(reportId)
      setChanged({ reportId, share: null })
      setCopied(false)
      setNotice('공유를 해제했어요. 보낸 링크는 이제 열리지 않아요.')
      return null
    } catch (cause) {
      const code = errorCodeOf(cause)
      console.error('리포트 공유 해제 실패 reportId=%s code=%s', reportId, code)
      return `공유를 해제하지 못했어요. ${toUserMessage(code)}`
    }
  }

  return {
    isOpen,
    open,
    close,
    image,
    canShareImage,
    shareImage,
    link: current ? { url: toSharedReportUrl(current.shareId), sharedAt: current.sharedAt } : null,
    creating,
    createLink,
    copyLink,
    copied,
    unshare,
    notice,
    linkError,
  }
}
