import { useEffect, useRef } from 'react'

type Props = {
  caption: string | null
}

export default function LiveCaptionPanel({ caption }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 답변이 길어져 최대 높이를 넘기면 박스는 그대로 두고 글자만 위로 밀려 올라가게,
  // 자막이 바뀔 때마다 맨 아래(가장 최근 인식분)로 스크롤한다. 최대 높이는 줄 높이(21px)의
  // 3.5배라, 4번째 줄이 반쯤 잘려 보여 "더 있다"는 걸 알려준다.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [caption])

  return (
    <div className="flex flex-col gap-1.5 rounded-md bg-neutral-0/60 px-4 py-3.5">
      <span className="text-micro text-neutral-500">실시간 자막</span>

      <div ref={scrollRef} className="max-h-18.5 overflow-y-auto">
        {caption ? (
          <p className="text-body-md text-neutral-900">{caption}</p>
        ) : (
          <p className="text-body-md text-neutral-400">아직 인식된 음성이 없어요</p>
        )}
      </div>
    </div>
  )
}
