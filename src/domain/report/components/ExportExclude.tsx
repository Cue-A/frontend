import type { ReactNode } from 'react'

import { EXPORT_EXCLUDE_ATTR } from '../lib/reportExport'

/**
 * 리포트를 이미지 · PDF 로 저장할 때 **빼는** 부분을 감쌉니다. (이슈 #143)
 *
 * 화면을 다루는 도구(옵션 카드 · 다시 분석 버튼 · 다음 단계)와 파일에서 쓸 수 없는 것(답변 영상 자리)이 대상입니다.
 * 이미지는 `EXPORT_EXCLUDE_ATTR` 를 보고 빼고, 인쇄는 `print:hidden` 이 뺍니다 — 한 곳에서 두 방식을 같이 붙여서
 * 이미지와 PDF 에 들어가는 내용이 어긋나지 않게 합니다.
 *
 * 감싸는 틀은 `display: contents` 라 화면 배치(flex 의 간격 등)에는 끼어들지 않습니다.
 */
export default function ExportExclude({ children }: { children: ReactNode }) {
  return (
    <div {...{ [EXPORT_EXCLUDE_ATTR]: '' }} className="contents print:hidden">
      {children}
    </div>
  )
}
