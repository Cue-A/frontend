type Props = {
  caption: string | null
  /** false 면 브라우저가 음성 인식을 지원하지 않는 것 — 빈 상태 대신 안내 문구를 보여준다. */
  isSupported?: boolean
}

/** 한 줄에 보일 글자 수. 이보다 길면 앞을 자르고 가장 최근 인식분만 보여준다. */
const MAX_CHARS = 70

/**
 * 질문 카드 안 한 줄 자막입니다 ("CC 저는 데이터 분석 프로젝트에서…").
 * 답변이 길어지면 앞부분을 잘라 **가장 최근에 인식된 말**이 보이게 한다. 한 줄 말줄임(…)으로 두면 첫머리만 남아서
 * 지금 하는 말이 안 보인다.
 */
export default function CaptionLine({ caption, isSupported = true }: Props) {
  const text = !isSupported
    ? '이 브라우저에서는 실시간 자막을 지원하지 않아요 (Chrome 권장)'
    : caption
      ? caption.length > MAX_CHARS
        ? `…${caption.slice(-MAX_CHARS)}`
        : caption
      : '아직 인식된 음성이 없어요'

  return (
    <div className="flex items-center gap-3 border-t border-neutral-200 pt-3.5">
      <span className="shrink-0 rounded-xs border border-primary-200 px-2 py-0.5 text-micro text-primary-500">CC</span>
      <p className={`truncate text-body-md ${isSupported && caption ? 'text-neutral-700' : 'text-neutral-400'}`}>{text}</p>
    </div>
  )
}
