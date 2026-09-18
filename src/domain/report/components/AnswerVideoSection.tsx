import { IconPlayerPlayFilled } from '@tabler/icons-react'

import { formatDuration } from '@/shared/lib/formatDuration'
import Card from '@/shared/ui/Card'

import type { ReportVideo } from '../types/report'

/**
 * 시안의 영상 자리는 카드보다 짙은 판입니다. 토큰에 이만큼 어두운 색이 없어서
 * `neutral-900` 을 씁니다 (docs/design-system.md §2.2 의 제일 어두운 값).
 */
const STAGE_CLASS =
  'flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg bg-neutral-900'

type Props = {
  video: ReportVideo
}

/** '전체 05:48 · 원본 화질' — 화질 문구가 없으면 길이만 보여줍니다. */
function buildMeta(video: ReportVideo) {
  const parts = [`전체 ${formatDuration(video.durationSeconds)}`, video.qualityLabel]
  return parts.filter(Boolean).join(' · ')
}

/**
 * 답변 영상입니다. (C-01 "답변 영상")
 *
 * 재생 자리까지만 그리고 실제 재생은 아직 붙이지 않았습니다. 재생 주소가
 * 리포트 응답에 오는지 계약이 확정되지 않았습니다 (이슈 #38). 계약이 오면
 * 이 판을 `<video>` 로 바꾸고 재생 바를 그 상태에 연결하면 됩니다.
 *
 * 링크가 만료돼도 이 절만 비고 점수 · 분석 내용은 그대로 보입니다. 시안이
 * 그렇게 되어 있고, 영상 하나 때문에 리포트 전체를 못 보게 하면 안 됩니다.
 */
export default function AnswerVideoSection({ video }: Props) {
  return (
    <Card label="답변 영상" padding="lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-h2 text-neutral-900">답변 영상</h2>
          <p className="text-body-sm text-neutral-400 tabular-nums">{buildMeta(video)}</p>
        </div>

        {video.isExpired ? (
          <div className={STAGE_CLASS}>
            <p className="text-body-lg font-semibold text-neutral-300">
              영상 링크가 만료되었습니다
            </p>
            <p className="text-body-sm text-neutral-500">
              점수와 분석 내용은 그대로 확인할 수 있어요
            </p>
          </div>
        ) : (
          <>
            <div className={STAGE_CLASS}>
              {/*
                아직 누를 수 없어서 버튼이 아니라 그림입니다. 눌리지 않는 버튼을
                두면 눌러보고 아무 일이 없어서 고장으로 읽힙니다. 재생 주소가
                생기면 이 자리를 <video> 로 바꿉니다.
              */}
              <span
                aria-hidden
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 text-neutral-0"
              >
                <IconPlayerPlayFilled size={28} />
              </span>

              <p className="text-body-md text-neutral-300">답변 영상 재생</p>
              <p className="text-body-sm text-neutral-500">영상 재생은 아직 준비 중이에요</p>
            </div>

            <div className="flex items-center gap-4 text-body-sm text-neutral-500 tabular-nums">
              <span>{formatDuration(0)}</span>

              {/* 재생 위치가 없어서 빈 막대입니다. 가짜로 채워두면 멈춘 것처럼 보입니다. */}
              <span aria-hidden className="h-1.5 flex-1 rounded-full bg-neutral-200" />

              <span>{formatDuration(video.durationSeconds)}</span>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
