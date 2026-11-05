import { captureElementPng } from '@/shared/lib/captureImage'

import { EXPORT_EXCLUDE_ATTR } from './exportExclude'

/**
 * 리포트 본문을 PNG 로 찍는 부분입니다. (이슈 #143)
 *
 * 찍는 일 자체(폰트 넣기 · 해상도)는 명함 저장과 같이 쓰는 `shared/lib/captureImage.ts` 가 합니다. 여기서는 리포트에만
 * 있는 것 — 저장에서 뺄 요소, 바탕색, 여백 — 만 정합니다. 이 파일은 **"이미지로 저장" 을 처음 누를 때 불러옵니다**
 * (`useReportExport` 의 `import()`). 리포트를 보기만 하는 사람의 번들에는 라이브러리가 들어가지 않습니다. (PR #144 리뷰)
 */

// 글자 노드도 들어와서(타입은 HTMLElement 지만) 요소인지 먼저 봅니다
const isExcluded = (node: Node) => !(node instanceof HTMLElement && node.hasAttribute(EXPORT_EXCLUDE_ATTR))

/**
 * 리포트 본문을 PNG 로 찍어 돌려줍니다.
 *
 * 본문 판(`sheet`)에는 배경이 없고 그 바깥 화면이 회색 바탕이라, 바깥 바탕색을 그대로 깔아 화면에서 보던 모양과 맞춥니다.
 */
export function captureReportPng(sheet: HTMLElement): Promise<Blob> {
  const background = sheet.parentElement ? getComputedStyle(sheet.parentElement).backgroundColor : undefined
  return captureElementPng(sheet, {
    backgroundColor: background,
    filter: isExcluded,
    // 판은 `mx-auto` 로 가운데 놓여서, 복사본에 계산된 좌우 여백(px)이 그대로 붙으면 그만큼 오른쪽이 잘립니다
    style: { margin: '0' },
  })
}
