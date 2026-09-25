import Button from '@/shared/ui/Button'
import Modal from '@/shared/ui/Modal'

type Props = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

const TITLE_ID = 'exit-confirm-modal-title'

/**
 * 면접 진행 화면 상단바의 X 클릭 시 뜨는 종료 확인 모달입니다 (이슈 #26).
 *
 * "지금 종료하면 리포트가 생성되지 않습니다" 문구는 백엔드가 확정한 동작
 * (`ABORTED` 세션은 리포트를 만들지 않음)을 그대로 반영한 것입니다. 정확한
 * 카피는 디자인 확정 시 교체 예정입니다 (#26 본문).
 *
 * `onConfirm` 이 실제로 세션을 중단시키는 동작(이탈 API 호출)은 이 컴포넌트의
 * 책임이 아닙니다 — 호출부에서 연결합니다. 프론트→백엔드 이탈 경로가 아직
 * 없어서(#54 2-5, 백엔드 이슈 대기) 지금은 UI만 먼저 준비해둡니다.
 */
export default function ExitConfirmModal({ open, onCancel, onConfirm }: Props) {
  return (
    <Modal open={open} onClose={onCancel} labelledBy={TITLE_ID}>
      <div className="flex w-80 flex-col gap-2">
        <h2 id={TITLE_ID} className="text-h2 text-neutral-900">
          면접을 종료할까요?
        </h2>

        <p className="text-body-md text-neutral-500">지금 종료하면 리포트가 생성되지 않습니다.</p>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          취소
        </Button>

        <Button variant="primary" onClick={onConfirm}>
          종료
        </Button>
      </div>
    </Modal>
  )
}
