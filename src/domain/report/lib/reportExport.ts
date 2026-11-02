import type { Report } from '../types/report'

/**
 * 리포트를 파일로 저장하는 일입니다. (이슈 #143)
 *
 * 백엔드에서 화면을 다시 그리려면 브라우저 렌더링 환경을 따로 둬야 해서, 저장은 프론트가 맡기로 했습니다. 지금 화면의
 * 차트 · 폰트 · 켜 둔 표시 옵션(흑백 포함)이 그대로 들어갑니다.
 *
 * - **이미지** — `html-to-image` 로 리포트 본문(`sheet`)을 PNG 한 장으로 찍어 바로 내려받습니다. 찍는 부분은
 *   `reportCapture.ts` 에 따로 두고 누를 때 불러옵니다 — 보기만 하는 사람에게 라이브러리를 받게 하지 않습니다
 * - **PDF** — 브라우저 인쇄(`window.print()`)입니다. 인쇄용 스타일(`index.css` 의 `@media print`, 각 요소의 `print:hidden`)
 *   이 본문만 남기고, 인쇄 창에서 "PDF 로 저장" 을 고르면 됩니다. 글자를 고를 수 있고 쪽 나눔을 카드 단위로 맞출 수 있어
 *   이미지를 PDF 에 붙이는 방식(jsPDF)보다 낫다고 봤습니다
 *
 * 저장에서 뺄 요소(옵션 카드 · 다시 분석 버튼 · 영상 자리 · 다음 단계)는 `ExportExclude` 로 감쌉니다. 이미지는
 * `EXPORT_EXCLUDE_ATTR`(`exportExclude.ts`)를 보고 빼고, 인쇄는 같은 자리에 붙은 `print:hidden` 이 뺍니다.
 */

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
 * 인쇄 창을 열기 전의 문서 제목입니다. 인쇄 창이 닫힐 때(`afterprint`) 되돌립니다.
 *
 * **처음 한 번만 기억합니다.** `afterprint` 가 오지 않는 환경에서 다시 누르면, 그때의 제목은 이미 파일 이름이라
 * 그걸 기억하면 원래 제목으로 돌아올 길이 없어집니다. 되돌린 뒤에 비워서 다음 인쇄 때 다시 기억합니다. (PR #144 리뷰)
 */
let titleBeforePrint: string | null = null

function restoreTitle() {
  window.removeEventListener('afterprint', restoreTitle)
  if (titleBeforePrint === null) return
  document.title = titleBeforePrint
  titleBeforePrint = null
}

/**
 * 인쇄 창을 엽니다. 인쇄 창의 "PDF 로 저장" 은 문서 제목을 파일 이름으로 쓰므로, 여는 동안만 제목을 바꿉니다.
 *
 * 제목은 인쇄 창이 닫힐 때(`afterprint`) 되돌립니다. `print()` 가 돌아온 직후에 되돌리면, 인쇄 창을 열어 둔 채 바로
 * 돌아오는 브라우저에서는 파일 이름을 정하기 전에 제목이 원래대로 돌아갑니다.
 */
export function printReport(fileBaseName: string) {
  if (titleBeforePrint === null) titleBeforePrint = document.title

  // 같은 함수라 여러 번 눌러도 한 번만 걸립니다
  window.addEventListener('afterprint', restoreTitle)
  document.title = fileBaseName
  window.print()
}
