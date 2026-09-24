import { useCallback, useRef, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { getDocument } from '../api/documentApi'
import type { DocumentDetail, DocumentSummary } from '../types/document'

export type UseOpenDocumentResult = {
  /** 문서를 엽니다. 파일은 새 탭, 직접 작성한 문서는 `viewing` 으로 돌려줍니다. */
  open: (document: DocumentSummary) => void
  /** 지금 여는 중인 문서. 그 행의 버튼을 잠급니다. */
  openingId: string | null
  /** 직접 작성한 문서를 열었을 때 본문. 화면이 읽기 전용으로 보여줍니다. */
  viewing: DocumentDetail | null
  closeViewing: () => void
  /** 마지막으로 열다가 실패한 이유. 사용자에게 그대로 보여줄 문구입니다. */
  error: string | null
}

/**
 * 보관함에서 "조회" 를 눌렀을 때의 동작입니다.
 *
 * **상세를 누를 때마다 다시 부릅니다.** 파일 주소(`downloadUrl`)는 1시간 뒤 만료되는
 * 서명 주소라 목록과 같이 들고 있으면 한참 뒤에 눌렀을 때 열리지 않습니다.
 */
export function useOpenDocument(): UseOpenDocumentResult {
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<DocumentDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  // "조회" 를 누른 버튼. 본문 창을 닫은 뒤 포커스를 여기로 돌려줍니다 — 여는 동안 버튼이 잠겨서
  // (disabled) 포커스가 <body> 로 빠지므로, 브라우저의 기본 포커스 복원에 맡길 수 없습니다. (PR #64 리뷰)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const open = useCallback((document: DocumentSummary) => {
    setError(null)
    setOpeningId(document.documentId)
    returnFocusRef.current = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null

    // 빈 탭을 **먼저** 엽니다. 상세를 받은 뒤에 window.open 하면 브라우저가 사용자
    // 클릭으로 쳐주지 않아 팝업 차단에 걸립니다(요청을 기다린 사이 클릭의 효력이 끝납니다).
    const tab = document.sourceType === 'FILE' ? window.open('', '_blank') : null

    void (async () => {
      try {
        const detail = await getDocument(document.documentId)

        if (detail.sourceType === 'FILE' && detail.downloadUrl) {
          if (tab) {
            // 열린 페이지(스토리지)가 이 탭을 거꾸로 조작하지 못하게 끊고 이동합니다.
            tab.opener = null
            tab.location.href = detail.downloadUrl
          } else {
            window.open(detail.downloadUrl, '_blank', 'noopener')
          }
          return
        }

        tab?.close()
        setViewing(detail)
      } catch (cause) {
        tab?.close()
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        console.error('문서 열기 실패 documentId=%s code=%s', document.documentId, code)
        setError(`문서를 열지 못했어요. ${toUserMessage(code)}`)
      } finally {
        setOpeningId(null)
      }
    })()
  }, [])

  const closeViewing = useCallback(() => {
    setViewing(null)
    // 창이 닫히고 버튼이 다시 풀린 다음 프레임에 돌려줍니다.
    requestAnimationFrame(() => returnFocusRef.current?.focus())
  }, [])

  return { open, openingId, viewing, closeViewing, error }
}
