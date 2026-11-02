import { useCallback, useRef, useState, type RefObject } from 'react'

import { downloadBlob, printReport } from '../lib/reportExport'

export type ReportExport = {
  /** 리포트 본문을 PNG 로 내려받습니다 */
  saveImage: () => void
  /** 인쇄 창을 엽니다. "PDF 로 저장" 을 고르면 PDF 가 됩니다 */
  printPdf: () => void
  /** 이미지를 만드는 중인지. 그동안 저장 버튼을 잠급니다 */
  savingImage: boolean
  /** 이미지 저장에 실패한 이유. 사용자에게 그대로 보여줄 문구입니다 */
  error: string | null
}

const IMAGE_FAILED_MESSAGE = '이미지를 만들지 못했어요. 잠시 후 다시 시도하거나 PDF 내보내기를 써 주세요.'

/**
 * 리포트 이미지 · PDF 저장입니다. (이슈 #143)
 *
 * `sheetRef` 는 저장할 리포트 본문입니다. 이미지는 몇 초 걸릴 수 있어서(처음 한 번은 라이브러리와 폰트를 읽어 옴) 만드는 동안
 * 다시 누르지 못하게 잠급니다. PDF 는 브라우저 인쇄 창이 맡아서 따로 기다릴 일이 없습니다.
 */
export function useReportExport(sheetRef: RefObject<HTMLElement | null>, fileBaseName: string): ReportExport {
  const [savingImage, setSavingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 렌더를 기다리지 않고 바로 막으려고 ref 에도 둡니다. 연달아 누르면 state 가 바뀌기 전에 두 번 들어옵니다
  const busyRef = useRef(false)

  const saveImage = useCallback(() => {
    const sheet = sheetRef.current
    if (!sheet || busyRef.current) return

    busyRef.current = true
    setSavingImage(true)
    setError(null)

    // 찍는 라이브러리(html-to-image)는 처음 누를 때 불러옵니다. 불러오기가 실패해도(배포 직후 옛 파일 등) 같은 안내로 받습니다
    import('../lib/reportCapture')
      .then(({ captureReportPng }) => captureReportPng(sheet))
      .then((blob) => downloadBlob(blob, `${fileBaseName}.png`))
      .catch((cause: unknown) => {
        // 리포트 내용은 남기지 않습니다. 실패 종류만 남깁니다
        console.error('리포트 이미지 저장 실패 reason=%s', cause instanceof Error ? cause.name : typeof cause)
        setError(IMAGE_FAILED_MESSAGE)
      })
      .finally(() => {
        busyRef.current = false
        setSavingImage(false)
      })
  }, [sheetRef, fileBaseName])

  const printPdf = useCallback(() => {
    setError(null)
    printReport(fileBaseName)
  }, [fileBaseName])

  return { saveImage, printPdf, savingImage, error }
}
