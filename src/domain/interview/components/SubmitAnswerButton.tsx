type Props = {
  disabled: boolean
  loading: boolean
  onClick?: () => void
}

/** "답변 완료 ✓" — 북마크 버튼과 같은 연보라(primary-100) 알약 CTA. 답변 중이 아니면 disabled, submitting 이면 로딩 표시. */
export default function SubmitAnswerButton({ disabled, loading, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`flex h-13 items-center gap-2 rounded-full px-6 text-body-lg disabled:cursor-not-allowed ${
        disabled && !loading ? 'bg-stage-cta-disabled text-stage-sub' : 'bg-primary-100 text-primary-500 hover:bg-primary-200'
      }`}
    >
      답변 완료
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
