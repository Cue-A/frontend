import { getFontEmbedCSS, toBlob } from 'html-to-image'

import { EXPORT_EXCLUDE_ATTR } from './exportExclude'

/**
 * 리포트 본문을 PNG 로 찍는 부분입니다. (이슈 #143)
 *
 * `html-to-image` 를 쓰는 건 이 파일뿐이고, **"이미지로 저장" 을 처음 누를 때 불러옵니다**(`useReportExport` 의
 * `import()`). 리포트를 보기만 하는 사람의 번들에는 들어가지 않습니다. (PR #144 리뷰)
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

const isExcluded = (node: Node) => !(node instanceof HTMLElement && node.hasAttribute(EXPORT_EXCLUDE_ATTR))

/**
 * 리포트 본문을 PNG 로 찍어 돌려줍니다.
 *
 * 본문 판(`sheet`)에는 배경이 없고 그 바깥 화면이 회색 바탕이라, 바깥 바탕색을 그대로 깔아 화면에서 보던 모양과 맞춥니다.
 */
export async function captureReportPng(sheet: HTMLElement): Promise<Blob> {
  // 폰트를 다 받기 전에 찍으면 기본 글꼴로 찍힙니다
  await document.fonts.ready

  const background = sheet.parentElement ? getComputedStyle(sheet.parentElement).backgroundColor : undefined
  const blob = await toBlob(sheet, {
    pixelRatio: PIXEL_RATIO,
    backgroundColor: background,
    filter: isExcluded,
    fontEmbedCSS: await fontCSSFor(sheet),
    // 판은 `mx-auto` 로 가운데 놓여서, 복사본에 계산된 좌우 여백(px)이 그대로 붙으면 그만큼 오른쪽이 잘립니다
    style: { margin: '0' },
  })
  if (!blob) throw new Error('이미지가 비어 있습니다')
  return blob
}
