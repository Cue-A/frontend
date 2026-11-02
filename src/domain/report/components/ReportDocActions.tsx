import { IconFileTypePdf, IconPhoto } from '@tabler/icons-react'

import Button from '@/shared/ui/Button'

import type { ReportExport } from '../hooks/useReportExport'

type Props = {
  /** 이미지 · PDF 저장. `ReportPage` 가 `useReportExport` 로 만들어 넘깁니다 */
  exporter: ReportExport
}

/**
 * 리포트 위쪽 유틸리티 줄입니다. (C-01 `header/utility`)
 *
 * 시안에서 리포트 본문 프레임 이름이 `sheet (PDF 영역)` 입니다. 그 판(`ReportPage` 의 `sheetRef`)을 그대로
 * 저장합니다. (이슈 #143)
 *
 * - `이미지로 저장` — 판을 PNG 한 장으로 바로 내려받습니다. 만드는 동안 버튼을 잠급니다
 * - `PDF 내보내기` — 브라우저 인쇄 창을 엽니다. 인쇄용 스타일이 판만 남기고, "PDF 로 저장" 을 고르면 됩니다
 *
 * 이 줄은 저장 대상이 아니라 판 바깥에 있고, 인쇄에서도 뺍니다.
 *
 * `공유하기` 는 공유 링크를 만들어주는 API 가 있어야 해서 아직 비활성입니다.
 * 못 누르는 이유는 툴팁이 아니라 글로 적습니다 (이슈 #32).
 */
export default function ReportDocActions({ exporter }: Props) {
  return (
    <div className="flex flex-col items-end gap-2 print:hidden">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p className="text-body-sm text-neutral-400">공유 링크는 아직 준비 중이에요</p>

        <Button size="sm" onClick={exporter.saveImage} disabled={exporter.savingImage}>
          <IconPhoto size={16} stroke={2} aria-hidden />
          {exporter.savingImage ? '이미지 만드는 중…' : '이미지로 저장'}
        </Button>

        <Button size="sm" onClick={exporter.printPdf}>
          <IconFileTypePdf size={16} stroke={2} aria-hidden />
          PDF 내보내기
        </Button>

        <Button size="sm" disabled>
          공유하기
        </Button>
      </div>

      {exporter.error && (
        <p role="alert" className="text-body-sm text-semantic-danger">
          {exporter.error}
        </p>
      )}
    </div>
  )
}
