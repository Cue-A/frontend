import type { CaptionFailureReason } from '../types/media'

type Props = {
  caption: string | null
  /** false 면 브라우저가 음성 인식을 지원하지 않는 것 — 빈 상태 대신 안내 문구를 보여준다. */
  isSupported?: boolean
  /** false 면 선택한 마이크가 아닌 시스템 기본 마이크로 인식하는 중 — 아직 인식된 말이 없을 때 그 사실을 알려준다. */
  usesSelectedMic?: boolean
  /** 이번 답변에서 자막을 만들 수 없게 된 이유. 있으면 빈 상태 문구 대신 이유를 보여준다(이슈 #215). */
  failure?: CaptionFailureReason | null
}

/** 자막을 만들 수 없을 때 자막 칸에 보이는 문구. 녹음 · 평가와는 무관한 실패라 "자막"만 말한다. */
const FAILURE_TEXT: Record<CaptionFailureReason, string> = {
  network: '네트워크 문제로 자막을 만들 수 없어요',
  permission: '마이크 권한이 없어 자막을 만들 수 없어요',
  'audio-capture': '마이크 소리를 받을 수 없어 자막을 만들 수 없어요',
  unsupported: '이 브라우저에서는 자막이 나오지 않아요 (Chrome 권장)',
}

/** 한 줄에 보일 글자 수. 이보다 길면 앞을 자르고 가장 최근 인식분만 보여준다. */
const MAX_CHARS = 70

/**
 * 질문 카드 안 한 줄 자막입니다 ("저는 데이터 분석 프로젝트에서…"). 켜고 끄는 건 하단 독의 CC 버튼이다.
 * 답변이 길어지면 앞부분을 잘라 **가장 최근에 인식된 말**이 보이게 한다. 한 줄 말줄임(…)으로 두면 첫머리만 남아서
 * 지금 하는 말이 안 보인다.
 */
export default function CaptionLine({ caption, isSupported = true, usesSelectedMic = true, failure = null }: Props) {
  // 이미 인식된 말이 있으면 실패해도 그 말을 그대로 둔다 — 답변 도중 끊긴 경우 지금까지의 자막이 사라지지 않게.
  const text = !isSupported
    ? '이 브라우저에서는 실시간 자막을 지원하지 않아요 (Chrome 권장)'
    : caption
      ? caption.length > MAX_CHARS
        ? `…${caption.slice(-MAX_CHARS)}`
        : caption
      : failure
        ? FAILURE_TEXT[failure]
        : usesSelectedMic
          ? '아직 인식된 음성이 없어요'
          : '기본 마이크로 자막을 만들어요. 고른 마이크와 다르면 자막이 안 나올 수 있어요'

  return (
    <div className="flex min-h-6 items-center border-t border-neutral-200 pt-3.5">
      <p className={`truncate text-body-md ${isSupported && caption ? 'text-neutral-700' : 'text-neutral-400'}`}>{text}</p>
    </div>
  )
}
