/**
 * 저장에서 뺄 요소에 붙는 표시입니다. `ExportExclude` 가 붙이고, 이미지 캡처(`reportCapture.ts`)가 이걸 보고 뺍니다.
 *
 * 따로 둔 이유: 캡처 쪽 파일에 두면 `ExportExclude` 가 이 상수 하나 때문에 `html-to-image` 까지 리포트 화면 번들로
 * 끌고 들어옵니다. (PR #144 리뷰)
 */
export const EXPORT_EXCLUDE_ATTR = 'data-export-exclude'
