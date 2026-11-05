import { useCallback, useRef, useState, type RefObject } from 'react'

import { downloadBlob, toFileBaseName } from '@/shared/lib/downloadFile'

export type BusinessCardImage = {
  /** 명함 미리보기(앞 · 뒷면)를 PNG 한 장으로 내려받습니다 */
  save: () => void
  saving: boolean
  /** 실패한 이유. 사용자에게 그대로 보여줄 문구입니다 */
  error: string | null
}

const IMAGE_FAILED_MESSAGE = '이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.'

/**
 * 명함 이미지 다운로드입니다. (이슈 #162) 리포트 저장과 같은 캡처(`shared/lib/captureImage.ts`)를 씁니다.
 *
 * 캡처 라이브러리는 처음 누를 때 불러옵니다. 처음 한 번은 폰트를 읽느라 몇 초 걸려서, 만드는 동안 버튼을 잠급니다.
 * 파일 이름은 `큐앤에이_명함_홍길동.png` 입니다.
 */
export function useBusinessCardImage(previewRef: RefObject<HTMLElement | null>, name: string): BusinessCardImage {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 렌더를 기다리지 않고 바로 막으려고 ref 에도 둡니다. 연달아 누르면 state 가 바뀌기 전에 두 번 들어옵니다
  const busyRef = useRef(false)

  const save = useCallback(() => {
    const preview = previewRef.current
    if (!preview || busyRef.current) return

    busyRef.current = true
    setSaving(true)
    setError(null)

    import('@/shared/lib/captureImage')
      .then(({ captureElementPng }) => captureElementPng(preview))
      .then((blob) => downloadBlob(blob, `${toFileBaseName(['큐앤에이', '명함', name])}.png`))
      .catch((cause: unknown) => {
        // 명함 내용(이름 · 연락처)은 남기지 않습니다. 실패 종류만 남깁니다
        console.error('명함 이미지 저장 실패 reason=%s', cause instanceof Error ? cause.name : typeof cause)
        setError(IMAGE_FAILED_MESSAGE)
      })
      .finally(() => {
        busyRef.current = false
        setSaving(false)
      })
  }, [previewRef, name])

  return { save, saving, error }
}
