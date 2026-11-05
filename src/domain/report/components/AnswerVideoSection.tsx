import { forwardRef, useCallback, useEffect, useRef, useState, type ReactNode, type Ref, type SyntheticEvent } from 'react'

import { toUserMessage } from '@/shared/api/errorMessage'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import Chip from '@/shared/ui/Chip'

import type { UseInterviewRecordingsResult } from '../hooks/useInterviewRecordings'
import type { AnswerRecording, SeekRequest } from '../types/recording'

import AnswerAudioPlayer from './AnswerAudioPlayer'

/**
 * 시안의 영상 자리는 카드보다 짙은 판입니다. 토큰에 이만큼 어두운 색이 없어서
 * `neutral-900` 을 씁니다 (docs/design-system.md §2.2 의 제일 어두운 값).
 */
const STAGE_CLASS = 'flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-neutral-900'

/**
 * 영상을 못 보여줄 때의 안내 판입니다. 경고가 아니라 "분석 내용은 그대로" 라는 안내라 회색 톤 · 테두리 없이 둡니다.
 * (결과 리포트 수정 시안 — 영상 링크 만료 안내, 이슈 #168)
 */
const NOTICE_CLASS =
  'flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-neutral-50 p-6 text-center'

type Props = {
  recordings: UseInterviewRecordingsResult
  /** XAI 타임라인의 마커 · "구간 보기" 가 보낸 요청. 그 문항으로 바꾸고 그 시각부터 재생합니다 */
  seek: SeekRequest | null
}

/** 'Q1' · 'Q1 되묻기' · 'Q2 꼬리질문' */
function chipLabel(item: AnswerRecording) {
  if (item.kind === 'reask') return `Q${item.questionNumber} 되묻기`
  if (item.kind === 'followup') return `Q${item.questionNumber} 꼬리질문`
  return `Q${item.questionNumber}`
}

function Notice({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className={NOTICE_CLASS}>
      <p className="text-body-lg font-semibold text-neutral-700">{title}</p>
      <p className="break-keep text-body-sm text-neutral-500">{detail}</p>
      {action}
    </div>
  )
}

type PlayerProps = {
  item: AnswerRecording
  /** 받은 목록 번호. 다시 받으면 주소가 같아도 새 요소로 그려 다시 불러오게 합니다 */
  generation: number
  onFailed: (resumeAt: number) => void
  onReady: () => void
}

/**
 * 문항 하나를 재생합니다. 영상이 있으면 `<video>`, 없으면 녹음을 `<audio>` 로 재생합니다.
 * 영상 재생 바는 브라우저 기본 컨트롤을 씁니다. 녹음은 면접 진행 화면 조작 바와 모양을 맞춘 `AnswerAudioPlayer` 로 재생합니다.
 *
 * 주소나 목록 번호가 바뀌면(다른 문항 · 다시 받은 목록) `key` 로 새 요소를 그립니다. 같은 요소에 src 만 바꾸면 실패 상태가 남는 브라우저가
 * 있습니다.
 */
const Player = forwardRef<HTMLMediaElement, PlayerProps>(function Player({ item, generation, onFailed, onReady }, ref) {
  const handleError = (event: SyntheticEvent<HTMLMediaElement>) => onFailed(event.currentTarget.currentTime)

  if (item.videoUrl) {
    return (
      <div className={STAGE_CLASS}>
        <video
          key={`${generation}:${item.videoUrl}`}
          ref={ref as Ref<HTMLVideoElement>}
          src={item.videoUrl}
          controls
          playsInline
          preload="metadata"
          onError={handleError}
          onLoadedMetadata={onReady}
          className="h-full w-full object-contain"
        />
      </div>
    )
  }

  return (
    // 녹음은 그림이 없어 판 높이를 내용에 맞춥니다. 좁은 화면에서 16:9 로 두면 조작 바가 잘립니다
    <div className="flex w-full items-center justify-center rounded-lg bg-neutral-900 px-4 py-8 sm:aspect-video sm:p-6">
      <AnswerAudioPlayer
        key={`${generation}:${item.audioUrl ?? 'none'}`}
        ref={ref as Ref<HTMLAudioElement>}
        src={item.audioUrl ?? ''}
        onError={handleError}
        onLoadedMetadata={onReady}
      />
    </div>
  )
})

/**
 * 답변 영상입니다. (C-01 "답변 영상" · 이슈 #168)
 *
 * 면접 전체 영상이 없고 문항마다 따로 있어서, 위의 문항 칩으로 골라 봅니다. 한 문항이 끝나도 다음 문항으로 저절로 넘어가지
 * 않습니다 — 스스로 돌아보는 화면이라 멈춰서 생각할 틈을 둡니다.
 *
 * 재생 주소는 1시간 뒤 만료됩니다. 재생이 실패하면 목록을 다시 받아 보던 자리부터 이어 봅니다. 다시 받은 주소로도 재생을
 * 시작하지 못하면 회색 안내로 바꿉니다. 영상 하나 때문에 리포트 전체를 못 보게 하지 않습니다 — 점수 · 분석 내용은 그대로입니다.
 */
export default function AnswerVideoSection({ recordings, seek }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  /** 다시 받은 뒤에도 재생을 시작하지 못한 목록 번호. 이 목록이면 안내로 바꿉니다 */
  const [failedGeneration, setFailedGeneration] = useState<number | null>(null)
  /** 요소가 준비되면 옮겨 갈 자리. 다른 문항으로 바꾸거나 목록을 다시 받으면 새 요소가 그려진 뒤에 적용합니다 */
  const [pending, setPending] = useState<{ seconds: number; play: boolean; key: number } | null>(null)
  /** 마지막으로 받아들인 타임라인 요청 */
  const [handledSeekKey, setHandledSeekKey] = useState<number | null>(null)
  const mediaRef = useRef<HTMLMediaElement | null>(null)
  /** 이미 적용한 `pending.key`. 같은 요청을 두 번 옮기지 않습니다 */
  const appliedKey = useRef<number | null>(null)
  /** 재생을 이어 볼 때 쓰는 요청 번호. 타임라인 요청(양수)과 겹치지 않게 음수로 내려갑니다 */
  const resumeKey = useRef(0)
  /** 재생 실패로 다시 받기 직전의 목록 번호. 재생을 한 번이라도 시작하면 비웁니다 — 한 시간 뒤 또 만료되면 다시 받습니다 */
  const refreshedFrom = useRef<number | null>(null)

  // 타임라인에서 새 요청이 오면 그 문항으로 바꾸고 그 시각부터 재생합니다. 렌더 중에 바로 맞춥니다 — effect 에서 바꾸면 이전
  // 문항이 한 번 더 그려집니다
  if (seek && seek.key !== handledSeekKey) {
    setHandledSeekKey(seek.key)
    setSelectedId(seek.questionId)
    setPending({ seconds: seek.seconds, play: true, key: seek.key })
  }

  const ready = recordings.status === 'ready' ? recordings : null
  const items = ready?.recordings.items ?? []
  const current = items.find((item) => item.questionId === selectedId) ?? items[0] ?? null
  const failed = ready !== null && failedGeneration === ready.generation

  /** 아직 옮기지 않은 자리로 옮깁니다. 영상 길이를 넘는 시각은 끝에 맞춥니다 */
  const applyPending = useCallback(
    (media: HTMLMediaElement | null) => {
      if (!media || !pending || appliedKey.current === pending.key || media.readyState < 1) return
      appliedKey.current = pending.key
      media.currentTime = Math.min(pending.seconds, Number.isFinite(media.duration) ? media.duration : pending.seconds)
      if (pending.play) media.play().catch(() => {})
    },
    [pending],
  )

  // 같은 문항이면 요소가 그대로라 loadedmetadata 가 다시 오지 않습니다. 이미 준비된 요소면 여기서 옮깁니다
  useEffect(() => {
    applyPending(mediaRef.current)
  }, [applyPending])

  const handleReady = () => {
    refreshedFrom.current = null
    applyPending(mediaRef.current)
  }

  const handleFailed = (resumeAt: number) => {
    if (!ready) return
    // 다시 받은 목록으로도 재생을 시작하지 못했으면 그만 받습니다
    if (refreshedFrom.current !== null && refreshedFrom.current < ready.generation) {
      setFailedGeneration(ready.generation)
      return
    }
    // 같은 목록에서 실패가 연달아 오면(다시 받는 중) 한 번만 받습니다
    if (refreshedFrom.current === ready.generation) return
    console.error('답변 영상 재생 실패 — 목록을 다시 받습니다 generation=%d', ready.generation)
    refreshedFrom.current = ready.generation
    // 아직 옮기지 못한 자리(타임라인에서 누른 시각)가 있으면 그대로 둡니다. 새 요소가 준비되면 그 자리로 갑니다 —
    // 덮어쓰면 처음 불러오다 실패한 경우 resumeAt 이 0 이라 누른 시각이 사라집니다 (PR #173 리뷰)
    const waiting = pending !== null && appliedKey.current !== pending.key
    if (!waiting) {
      resumeKey.current -= 1
      setPending({ seconds: resumeAt, play: false, key: resumeKey.current })
    }
    recordings.refresh()
  }

  const retryLoad = () => {
    refreshedFrom.current = null
    setFailedGeneration(null)
    recordings.refresh()
  }

  let body: ReactNode
  if (recordings.status === 'loading') {
    body = <div className={STAGE_CLASS} aria-busy="true" />
  } else if (recordings.status === 'error') {
    body = (
      <Notice
        title="답변 영상을 불러오지 못했어요"
        detail={`점수와 분석 내용은 그대로 확인할 수 있어요. ${toUserMessage(recordings.error.code)}`}
        action={
          <Button size="sm" onClick={recordings.refresh} className="mt-2">
            다시 불러오기
          </Button>
        }
      />
    )
  } else if (!current) {
    body = <Notice title="저장된 답변이 없어요" detail="점수와 분석 내용은 그대로 확인할 수 있어요" />
  } else if (failed) {
    body = (
      <Notice
        title="영상 링크가 만료되었어요"
        detail="보안을 위해 재생 링크는 일정 시간이 지나면 만료돼요. 점수와 분석 내용은 그대로 확인할 수 있어요"
        action={
          <Button size="sm" onClick={retryLoad} className="mt-2">
            다시 불러오기
          </Button>
        }
      />
    )
  } else if (!current.videoUrl && !current.audioUrl) {
    // 서명에 실패하면 둘 다 null 일 수 있습니다. src 없는 재생 컨트롤만 두면 오류도 안 나서 고장인지 알 수 없습니다
    body = (
      <Notice
        title="이 문항은 재생할 녹화가 없어요"
        detail="점수와 분석 내용은 그대로 확인할 수 있어요. 다시 불러오면 새 주소를 받아 와요"
        action={
          <Button size="sm" onClick={retryLoad} className="mt-2">
            다시 불러오기
          </Button>
        }
      />
    )
  } else {
    body = (
      <Player
        ref={mediaRef}
        item={current}
        generation={ready?.generation ?? 0}
        onFailed={handleFailed}
        onReady={handleReady}
      />
    )
  }

  return (
    <Card label="답변 영상" padding="lg">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-h2 text-neutral-900">답변 영상</h2>
          {ready && items.length > 0 && (
            <p className="text-body-sm text-neutral-400 tabular-nums">
              {ready.recordings.hasVideo ? `문항 ${items.length}개` : `문항 ${items.length}개 · 음성만`}
            </p>
          )}
        </div>

        {ready && items.length > 1 && (
          <div role="group" aria-label="문항 고르기" className="flex flex-wrap gap-2">
            {items.map((item) => {
              const selected = item.questionId === current?.questionId
              return (
                <button
                  key={item.questionId}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setPending(null)
                    setSelectedId(item.questionId)
                  }}
                  className="rounded-full focus-visible:outline-2 focus-visible:outline-primary-500"
                >
                  <Chip selected={selected} fill="solid">
                    {chipLabel(item)}
                  </Chip>
                </button>
              )
            })}
          </div>
        )}

        {body}

        {ready && current && !failed && (
          <div className="flex flex-col gap-1">
            {current.questionText && (
              <p className="break-keep text-body-md text-neutral-900">
                <span className="font-semibold">{chipLabel(current)}.</span> {current.questionText}
              </p>
            )}
            {!ready.recordings.hasVideo && (
              <p className="text-body-sm text-neutral-500">카메라를 사용하지 않은 면접이라 음성만 들려요.</p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
