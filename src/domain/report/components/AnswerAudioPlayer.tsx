import { IconMicrophone, IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react'
import { forwardRef, useCallback, useRef, useState, type ChangeEvent, type SyntheticEvent } from 'react'

import { formatDuration } from '@/shared/lib/formatDuration'

/** 파형 막대 높이. 면접 진행 화면 "답변 듣는 중" 파형과 같은 모양으로 가운데가 높습니다 */
const WAVE_BARS = ['h-2', 'h-3', 'h-4', 'h-3', 'h-4', 'h-2', 'h-3']

type Props = {
  src: string
  onError: (event: SyntheticEvent<HTMLMediaElement>) => void
  onLoadedMetadata: () => void
}

/** 재생 중이면 막대가 차례로 오르내리고, 멈추면 그대로 둡니다 */
function Waveform({ playing }: { playing: boolean }) {
  return (
    <span aria-hidden className="flex h-4 items-center gap-0.5">
      {WAVE_BARS.map((height, index) => (
        <span
          key={index}
          className={`w-0.5 origin-center rounded-full bg-primary-400 ${height} ${
            playing ? 'motion-safe:animate-wave-bar' : 'opacity-60'
          }`}
          style={{ animationDelay: `${index * 0.12}s` }}
        />
      ))}
    </span>
  )
}

/**
 * 카메라 없이 답한 문항의 녹음 재생입니다.
 *
 * 면접 진행 화면의 아래 조작 바(둥근 버튼 · "답변 듣는 중" 파형 칸)와 같은 모양으로 맞췄습니다. 브라우저 기본 오디오 컨트롤은
 * 밝은 회색 판이라 어두운 판 위에서 따로 놀았습니다. 재생 · 위치 옮기기는 `<button>` · `<input type="range">` 라 키보드 ·
 * 스크린리더로 그대로 다룹니다.
 *
 * `<audio>` 는 화면에 보이지 않게 두고 ref 를 바깥(AnswerVideoSection)에 넘깁니다. 타임라인 마커로 옮기는 동작은 지금처럼
 * 바깥에서 `currentTime` · `play()` 로 합니다 — 여기 상태는 요소의 이벤트로만 따라갑니다.
 */
const AnswerAudioPlayer = forwardRef<HTMLAudioElement, Props>(function AnswerAudioPlayer(
  { src, onError, onLoadedMetadata },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  // 바깥 ref 와 이 컴포넌트가 같은 요소를 봅니다. 함수가 매번 바뀌면 렌더마다 떼었다 붙여서 고정합니다
  const attach = useCallback(
    (element: HTMLAudioElement | null) => {
      audioRef.current = element
      if (typeof ref === 'function') ref(element)
      else if (ref) ref.current = element
    },
    [ref],
  )

  const syncDuration = (event: SyntheticEvent<HTMLAudioElement>) => {
    // MediaRecorder 로 만든 WebM 은 끝까지 읽기 전에 길이가 Infinity 일 수 있습니다. 그때는 0 으로 두고 위치 막대를 잠급니다
    const value = event.currentTarget.duration
    setDuration(Number.isFinite(value) ? value : 0)
  }

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const next = Number(event.target.value)
    audio.currentTime = next
    setCurrent(next)
  }

  const status = playing ? '답변 듣는 중' : current > 0 ? '일시정지' : '답변 듣기'

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <span
        aria-hidden
        className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-neutral-700 bg-neutral-700/40 text-neutral-300"
      >
        <IconMicrophone size={32} stroke={1.5} />
      </span>
      <p className="break-keep text-center text-body-md text-neutral-300">이 문항은 음성만 들려요</p>

      <audio
        ref={attach}
        src={src}
        preload="metadata"
        onError={onError}
        onLoadedMetadata={(event) => {
          syncDuration(event)
          onLoadedMetadata()
        }}
        onDurationChange={syncDuration}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onSeeked={(event) => setCurrent(event.currentTarget.currentTime)}
      />

      <div className="flex w-full max-w-xl items-center gap-2 rounded-full border border-neutral-700 bg-neutral-700/30 p-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? '녹음 일시정지' : '녹음 재생'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-0 text-neutral-900 hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 disabled:opacity-50"
        >
          {playing ? <IconPlayerPauseFilled size={18} aria-hidden /> : <IconPlayerPlayFilled size={18} aria-hidden />}
        </button>

        <span className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-neutral-700 px-3 sm:px-4 text-body-sm text-neutral-200"
        >
          <Waveform playing={playing} />
          <span className="hidden sm:inline">{status}</span>
        </span>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(current, duration || 0)}
          onChange={handleSeek}
          disabled={!duration}
          aria-label="재생 위치"
          aria-valuetext={duration ? `${formatDuration(current)} / ${formatDuration(duration)}` : formatDuration(current)}
          className="h-1 min-w-0 flex-1 cursor-pointer accent-primary-400 disabled:cursor-default"
        />

        <span className="shrink-0 pr-2 text-body-sm sm:pr-3 text-neutral-300 tabular-nums">
          {duration ? `${formatDuration(current)} / ${formatDuration(duration)}` : formatDuration(current)}
        </span>
      </div>
    </div>
  )
})

export default AnswerAudioPlayer
