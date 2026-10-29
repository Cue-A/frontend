type Props = {
  disabled: boolean
  loading: boolean
  onClick?: () => void
}

/** "답변 완료" — primary/500 CTA. presenting 이면 disabled, submitting 이면 로딩 표시. */
export default function SubmitAnswerButton({ disabled, loading, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`flex h-10 items-center gap-2 rounded-sm px-5 py-2 text-body-lg disabled:cursor-not-allowed ${
        disabled && !loading
          ? 'bg-neutral-300 text-neutral-500'
          : 'bg-primary-500 text-neutral-0'
      }`}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-0 border-t-transparent"
          aria-hidden="true"
        />
      )}
      답변 완료
    </button>
  )
}
