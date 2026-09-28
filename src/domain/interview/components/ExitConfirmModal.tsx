import Button from '@/shared/ui/Button'
import Modal from '@/shared/ui/Modal'

type Props = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  /** abort 요청이 진행 중인지. 진행 중이면 취소·종료 버튼을 모두 잠근다. */
  isSubmitting?: boolean
  /**
   * abort 실패 문구. 있으면 모달이 닫히지 않고 이 자리에 인라인으로 보여준다.
   * 재시도는 별도 버튼 없이 "종료"를 다시 누르는 것으로 한다 — submitAnswer 실패
   * 패턴(같은 버튼 재클릭)과 동일하게 맞췄다 (이슈 #26 follow-up, 새 토스트
   * 컴포넌트를 만들지 않기로 함).
   */
  error?: { message: string } | null
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
 * 책임이 아닙니다 — 호출부에서 연결합니다. 성공·실패 판단도 호출부(useInterviewSession)
 * 몫이라, 이 컴포넌트는 `isSubmitting`·`error` 로 전달받은 상태만 그린다.
 */
export default function ExitConfirmModal({ open, onCancel, onConfirm, isSubmitting = false, error = null }: Props) {
  return (
    <Modal open={open} onClose={onCancel} labelledBy={TITLE_ID}>
      <div className="flex w-80 flex-col gap-2">
        <h2 id={TITLE_ID} className="text-h2 text-neutral-900">
          면접을 종료할까요?
        </h2>

        <p className="text-body-md text-neutral-500">지금 종료하면 리포트가 생성되지 않습니다.</p>

        {error && <p className="text-body-sm text-semantic-danger">{error.message}</p>}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          취소
        </Button>

        <Button variant="primary" onClick={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? '종료하는 중...' : '종료'}
        </Button>
      </div>
    </Modal>
  )
}
