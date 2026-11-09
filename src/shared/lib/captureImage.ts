import { getFontEmbedCSS, toBlob } from 'html-to-image'

/**
 * 화면의 한 부분을 PNG 로 찍습니다. 리포트 저장(#143) · 공유가 씁니다. (명함 이미지 다운로드도 썼는데 명함을 지웠습니다, 이슈 #185)
 *
 * `html-to-image` 를 쓰는 건 이 파일뿐입니다. **쓰는 쪽은 저장 버튼을 처음 누를 때 `import()` 로 불러옵니다** —
 * 화면을 보기만 하는 사람의 번들에는 라이브러리가 들어가지 않습니다. (PR #144 리뷰)
 */

/**
 * 폰트를 그림 안에 넣을 CSS 입니다. 한 번 만들고 다시 씁니다.
 *
 * Pretendard 는 글자 범위마다 파일이 나뉘어 있어(dynamic subset) 처음 한 번은 수십 개를 읽어 오느라 몇 초 걸립니다.
 * 두 번째 저장부터는 기다리지 않게 만들어 둔 결과를 씁니다. 실패하면 다음 저장 때 다시 만듭니다.
 */
let fontEmbedCSS: Promise<string> | null = null

/** 이미지 해상도 배율. 레티나 화면에서도 글자가 뭉개지지 않게 2배로 찍습니다 */
const PIXEL_RATIO = 2

function fontCSSFor(node: HTMLElement) {
  if (!fontEmbedCSS) {
    fontEmbedCSS = getFontEmbedCSS(node).catch((cause: unknown) => {
      fontEmbedCSS = null
      throw cause
    })
  }
  return fontEmbedCSS
}

export type CaptureOptions = {
  /** 찍을 부분에 배경이 없을 때 깔 색. 없으면 투명합니다 */
  backgroundColor?: string
  /** false 를 돌려준 요소는 그림에서 뺍니다 */
  filter?: (node: Node) => boolean
  /** 복사본에만 덧씌울 스타일. 화면의 원래 요소는 바뀌지 않습니다 */
  style?: Partial<CSSStyleDeclaration>
}

/** `node` 를 PNG 로 찍어 돌려줍니다. 폰트를 다 받은 뒤에 찍습니다 — 먼저 찍으면 기본 글꼴로 찍힙니다 */
export async function captureElementPng(node: HTMLElement, options: CaptureOptions = {}): Promise<Blob> {
  await document.fonts.ready

  const blob = await toBlob(node, {
    pixelRatio: PIXEL_RATIO,
    backgroundColor: options.backgroundColor,
    filter: options.filter,
    style: options.style,
    fontEmbedCSS: await fontCSSFor(node),
  })
  if (!blob) throw new Error('이미지가 비어 있습니다')
  return blob
}
