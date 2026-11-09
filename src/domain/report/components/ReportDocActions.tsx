import { IconFileTypePdf, IconPhoto, IconShare } from '@tabler/icons-react'

import Button from '@/shared/ui/Button'

import type { ReportExport } from '../hooks/useReportExport'
import type { ReportShare } from '../hooks/useReportShare'

import ReportShareDialog from './ReportShareDialog'

type Props = {
  /** 이미지 · PDF 저장. `ReportPage` 가 `useReportExport` 로 만들어 넘깁니다 */
  exporter: ReportExport
  /** 공유하기 창. `ReportPage` 가 `useReportShare` 로 만들어 넘깁니다 */
  share: ReportShare
  /**
   * 지금 저장 · 공유할 수 없는 이유. 있으면 세 버튼을 잠그고 이 글을 아래에 적습니다.
   * 성장 추이 탭에서 회차 비교를 아직 못 받았을 때입니다 — 그대로 찍으면 제목만 남은 파일이 나옵니다 (이슈 #183)
   */
  blockedReason?: string | null
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
 * - `공유하기` — 창을 열어 이미지로 공유하거나, 로그인 없이 보는 공개 링크를 만들고 · 복사하고 · 해제합니다
 *   (`ReportShareDialog` · 이슈 #199)
 */
export default function ReportDocActions({ exporter, share, blockedReason = null }: Props) {
  const blocked = blockedReason !== null

  return (
    <div className="flex flex-col items-end gap-2 print:hidden">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button size="sm" onClick={exporter.saveImage} disabled={blocked || exporter.savingImage}>
          <IconPhoto size={16} stroke={2} aria-hidden />
          {exporter.savingImage ? '이미지 만드는 중…' : '이미지로 저장'}
        </Button>

        <Button size="sm" onClick={exporter.printPdf} disabled={blocked}>
          <IconFileTypePdf size={16} stroke={2} aria-hidden />
          PDF 내보내기
        </Button>

        <Button size="sm" onClick={share.open} disabled={blocked}>
          <IconShare size={16} stroke={2} aria-hidden />
          공유하기
        </Button>
      </div>

      {blockedReason && <p className="text-body-sm text-neutral-500">{blockedReason}</p>}

      {exporter.error && (
        <p role="alert" className="text-body-sm text-semantic-danger">
          {exporter.error}
        </p>
      )}

      {share.isOpen && <ReportShareDialog share={share} />}
    </div>
  )
}
