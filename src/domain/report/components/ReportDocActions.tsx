import Button from '@/shared/ui/Button'

/**
 * 리포트 위쪽 유틸리티 줄입니다. (C-01 `header/utility`)
 *
 * 시안에서 리포트 본문 프레임 이름이 `sheet (PDF 영역)` 입니다. 별도 PDF 를
 * 만들어 내려받는 게 아니라 **이 판을 그대로 인쇄하는 것**이 의도라고 보고,
 * `PDF 내보내기` 는 브라우저 인쇄로 붙였습니다. 브라우저 인쇄 창에서 "PDF 로
 * 저장" 을 고르면 됩니다. 서버가 필요 없어서 지금 실제로 동작합니다.
 *
 * `공유하기` 는 공유 링크를 만들어주는 API 가 있어야 해서 아직 비활성입니다.
 * 못 누르는 이유는 툴팁이 아니라 글로 적습니다 (이슈 #32).
 */
export default function ReportDocActions() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <p className="text-body-sm text-neutral-400">공유 링크는 아직 준비 중이에요</p>

      <Button size="sm" onClick={() => window.print()}>
        PDF 내보내기
      </Button>

      <Button size="sm" disabled>
        공유하기
      </Button>
    </div>
  )
}
