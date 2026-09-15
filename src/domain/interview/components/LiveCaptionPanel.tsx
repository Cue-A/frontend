type Props = {
  caption: string | null
}

export default function LiveCaptionPanel({ caption }: Props) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md bg-neutral-0/60 px-4 py-3.5">
      <span className="text-micro text-neutral-500">실시간 자막</span>

      {caption ? (
        <p className="text-body-md text-neutral-900">{caption}</p>
      ) : (
        <p className="text-body-md text-neutral-400">아직 인식된 음성이 없어요</p>
      )}
    </div>
  )
}
