import { getFontEmbedCSS, toBlob } from 'html-to-image'

import type { Report } from '../types/report'

/**
 * 리포트를 파일로 저장하는 일입니다. (이슈 #143)
 *
 * 백엔드에서 화면을 다시 그리려면 브라우저 렌더링 환경을 따로 둬야 해서, 저장은 프론트가 맡기로 했습니다. 지금 화면의
 * 차트 · 폰트 · 켜 둔 표시 옵션(흑백 포함)이 그대로 들어갑니다.
 *
 * - **이미지** — `html-to-image` 로 리포트 본문(`sheet`)을 PNG 한 장으로 찍어 바로 내려받습니다
 * - **PDF** — 브라우저 인쇄(`window.print()`)입니다. 인쇄용 스타일(`index.css` 의 `@media print`, 각 요소의 `print:hidden`)
 *   이 본문만 남기고, 인쇄 창에서 "PDF 로 저장" 을 고르면 됩니다. 글자를 고를 수 있고 쪽 나눔을 카드 단위로 맞출 수 있어
 *   이미지를 PDF 에 붙이는 방식(jsPDF)보다 낫다고 봤습니다
 *
 * 저장에서 뺄 요소(옵션 카드 · 다시 분석 버튼 · 영상 자리 · 다음 단계)는 `ExportExclude` 로 감쌉니다. 이미지는
 * `EXPORT_EXCLUDE_ATTR` 를 보고 빼고, 인쇄는 같은 자리에 붙은 `print:hidden` 이 뺍니다.
 */

/** 저장에서 뺄 요소에 붙는 표시. `ExportExclude` 가 붙입니다 */
export const EXPORT_EXCLUDE_ATTR = 'data-export-exclude'

/** 이미지 해상도 배율. 레티나 화면에서도 글자가 뭉개지지 않게 2배로 찍습니다 */
const PIXEL_RATIO = 2

/** 파일 이름에 쓸 수 없는 글자 (Windows 기준이 가장 엄격합니다) */
const UNSAFE_FILE_CHARS = /[\\/:*?"<>|]/g

/**
 * `큐앤에이_리포트_네이버_기획직무_2026.07.18_3회차`
 *
 * 회사 · 직무는 응답에 없을 수 있어서 있는 것만 씁니다. 같은 날 여러 번 저장해도 회차로 구분됩니다.
 */
export function reportFileBaseName(report: Report): string {
  const parts = ['큐앤에이', '리포트', report.companyName, report.jobRole, report.interviewDate, `${report.attempt}회차`]
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .map((part) => part.replace(UNSAFE_FILE_CHARS, '').replace(/\s+/g, ''))
    .join('_')
}

/**
 * 폰트를 그림 안에 넣을 CSS 입니다. 한 번 만들고 다시 씁니다.
 *
 * Pretendard 는 글자 범위마다 파일이 나뉘어 있어(dynamic subset) 처음 한 번은 수십 개를 읽어 오느라 몇 초 걸립니다.
 * 두 번째 저장부터는 기다리지 않게 만들어 둔 결과를 씁니다. 실패하면 다음 저장 때 다시 만듭니다.
 */
let fontEmbedCSS: Promise<string> | null = null

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

/**
 * 파일로 내려받게 합니다.
 *
 * data URL 이 아니라 `blob:` 주소로 내려받습니다. 리포트 한 장이 몇 MB 라 data URL 은 너무 길고, 브라우저에 따라
 * `download` 에 준 파일 이름을 무시하고 `download` 로 저장합니다.
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // 바로 지우면 내려받기가 시작되기 전에 주소가 사라지는 브라우저가 있어서 조금 뒤에 지웁니다
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * 인쇄 창을 엽니다. 인쇄 창의 "PDF 로 저장" 은 문서 제목을 파일 이름으로 쓰므로, 여는 동안만 제목을 바꿉니다.
 *
 * 제목은 인쇄 창이 닫힐 때(`afterprint`) 되돌립니다. `print()` 가 돌아온 직후에 되돌리면, 인쇄 창을 열어 둔 채 바로
 * 돌아오는 브라우저에서는 파일 이름을 정하기 전에 제목이 원래대로 돌아갑니다.
 */
export function printReport(fileBaseName: string) {
  const previousTitle = document.title
  const restore = () => {
    document.title = previousTitle
    window.removeEventListener('afterprint', restore)
  }

  window.addEventListener('afterprint', restore)
  document.title = fileBaseName
  window.print()
}
