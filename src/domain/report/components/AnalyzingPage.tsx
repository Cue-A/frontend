import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ROUTES, toReport } from '@/app/routes'
import Button from '@/shared/ui/Button'

import { useAnalysisProgress } from '../hooks/useAnalysisProgress'
import { ANALYSIS_STAGES } from '../types/analysis'

/**
 * 시안의 로고 원입니다. 점선 링이 천천히 돌아 "멈춘 게 아니다"를 알려줍니다.
 * 로고 이미지는 아직 내보내지 않아서 글자로 둡니다.
 */
function AnalyzingMark({ stopped }: { stopped: boolean }) {
  // 실패하면 링을 멈춥니다. 도는 링은 "아직 하고 있다" 는 신호라, 실패 안내와 같이 두면 말이 엇갈립니다.
  // 애니메이션을 빼지 않고 그 자리에 세웁니다. 빼면 링이 처음 각도로 튑니다.
  const spin = stopped ? 'animate-spin [animation-play-state:paused]' : 'animate-spin'

  return (
    <div
      aria-hidden
      className={`flex h-36 w-36 items-center justify-center rounded-full border-2 border-dashed border-primary-200 [animation-duration:12s] ${spin}`}
    >
      <div
        className={`flex h-28 w-28 items-center justify-center rounded-full bg-neutral-0 text-display text-primary-500 shadow-card [animation-direction:reverse] [animation-duration:12s] ${spin}`}
      >
        C
      </div>
    </div>
  )
}

/** 지난 단계는 꽉 찬 점, 지금 단계는 속 빈 링, 남은 단계는 회색 점입니다. (시안) */
function StageDot({ state }: { state: 'done' | 'current' | 'upcoming' }) {
  if (state === 'current') {
    return <span aria-hidden className="h-3 w-3 rounded-full border-2 border-primary-500" />
  }

  return (
    <span
      aria-hidden
      className={`h-2.5 w-2.5 rounded-full ${state === 'done' ? 'bg-primary-500' : 'bg-neutral-300'}`}
    />
  )
}

/**
 * 면접이 끝나고 리포트가 만들어지기를 기다리는 화면입니다. (B-02)
 *
 * 시안대로 가운데 정렬 한 덩어리입니다. 사이드바 없이 혼자 그립니다. (router.tsx)
 * 몇 단계 중 몇 번째인지, 지금 무슨 작업을 하는지 보여줍니다. 그냥 도는
 * 스피너만 두면 얼마나 더 기다려야 하는지 알 수 없어서 사람들이 새로고침합니다.
 *
 * 사이드바가 없어서 분석 중에 다른 화면으로 나갈 길도 같이 없었다 — 왼쪽 위
 * "처음 화면으로"가 그 자리다(#26). PR #65 리뷰에서 아이콘 레일 이름("홈")에 맞춰
 * "홈으로"로 바꾸자는 제안이 있었지만, ReportActions.tsx(이슈 #20)가 같은 랜딩
 * 이동에 "홈 대시보드가 생기기 전까진 '홈'이라 부르지 않는다"로 이미 정해둔 것과
 * 충돌해 반영하지 않았다.
 *
 * 분석은 백엔드에서 돈다(Cue-A/backend#50). 이 화면은 들어오면 분석을 맡기고 소켓으로 단계를 받아
 * 끝나면 리포트로 넘어간다 (useAnalysisProgress). 실패하면 화면을 바꾸지 않고 제목과 팁 자리만 바꾼다.
 */
export default function AnalyzingPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { stageIndex, reportId, failure, isTimedOut, tip, retry } = useAnalysisProgress(sessionId)

  useEffect(() => {
    if (!reportId) return

    // replace — 뒤로가기로 분석 중 화면에 돌아오면 끝난 분석을 다시 맡기게 됩니다.
    navigate(toReport(reportId), { replace: true })
  }, [reportId, navigate])

  const current = ANALYSIS_STAGES[stageIndex]
  const percent = Math.round(((stageIndex + 1) / ANALYSIS_STAGES.length) * 100)

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 p-6 text-center">
      <div className="absolute left-6 top-6">
        <Button variant="ghost" size="sm" to={ROUTES.LANDING}>
          처음 화면으로
        </Button>
      </div>

      <AnalyzingMark stopped={failure !== null} />

      {/* 실패해도 문장 길이를 비슷하게 둡니다. 세로 가운데 정렬이라 줄 수가 바뀌면 화면 전체가 움직입니다 */}
      <h1 className="text-h1 text-neutral-900">{failure ? '분석을 마치지 못했어요' : '분석중입니다…'}</h1>

      <p className="text-body-md text-neutral-500">
        {failure
          ? '면접 답변을 분석하다가 멈췄어요. 아래 안내를 확인해 주세요.'
          : '면접 답변을 분석해서 리포트를 준비하고 있어요. 잠시만 기다려주세요.'}
      </p>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={ANALYSIS_STAGES.length}
        aria-valuenow={stageIndex + 1}
        aria-valuetext={`${ANALYSIS_STAGES.length}단계 중 ${stageIndex + 1}단계 · ${current.label}${failure ? ' · 멈춤' : ''}`}
        className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-neutral-200"
      >
        {/* 너비는 계산값이라 인라인 style 을 씁니다 (docs/01-conventions.md "스타일" 절) */}
        <div
          className="h-full rounded-full bg-primary-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-body-sm font-semibold text-neutral-900 tabular-nums">
        {stageIndex + 1}/{ANALYSIS_STAGES.length} 단계{failure ? '에서 멈춤' : ' 진행 중'} · {current.label}
      </p>

      <ol className="flex flex-wrap justify-center gap-6">
        {ANALYSIS_STAGES.map((stage, index) => {
          const state = index < stageIndex ? 'done' : index === stageIndex ? 'current' : 'upcoming'

          return (
            <li
              key={stage.key}
              aria-current={state === 'current' ? 'step' : undefined}
              className="flex w-16 flex-col items-center gap-2"
            >
              <StageDot state={state} />

              <span
                className={
                  'text-body-sm ' + (state === 'upcoming' ? 'text-neutral-400' : 'text-neutral-700')
                }
              >
                {stage.label}
              </span>
            </li>
          )
        })}
      </ol>

      {/*
        팁 자리는 10분이 지나면 안내 박스로 바뀝니다. 둘의 높이 차이가 커서 자리를 처음부터 안내 박스 높이만큼
        잡아둡니다. 안 잡으면 화면이 세로 가운데 정렬이라 바뀌는 순간 위쪽 내용이 통째로 밀려 올라갑니다. (PR #68 리뷰)
      */}
      <div className="flex min-h-44 w-full max-w-md items-start justify-center">
        {failure ? (
          <AnalysisFailedNotice message={failure.message} onRetry={failure.retryable ? retry : null} />
        ) : isTimedOut ? (
          <AnalysisTimedOutNotice />
        ) : (
          <p className="text-body-sm text-neutral-400">면접 Tip · {tip}</p>
        )}
      </div>
    </main>
  )
}

/**
 * 기다림 상한(`ANALYSIS_TIMEOUT_MS`)을 넘겼을 때 분석 중 화면 아래에 붙는 안내입니다.
 *
 * 화면을 통째로 바꾸지 않고 시안의 분석 중 화면은 그대로 둔 채 팁 자리에 안내와 버튼을 넣습니다.
 * 백엔드는 10분이 지나면 스스로 `AI_TIMEOUT` 을 보내므로 보통은 이 안내 전에 실패 안내가 뜹니다. 이 안내가 뜨는 건
 * 그 메시지를 놓친 경우(연결 끊김 등)라 분석이 끝났는지 알 수 없습니다. 그래서 "실패했어요" 가 아니라
 * "오래 걸리고 있어요" 로 적습니다. 상태 조회 API(Cue-A/backend#48)가 생기면 여기서 확인할 수 있습니다.
 *
 * 버튼은 "다시 기다리기" 하나입니다. 빠져나갈 길은 화면 왼쪽 위의 "처음 화면으로"(PR #65)가
 * 타임아웃과 관계없이 늘 보여주므로, 여기에 같은 버튼을 또 두면 한 화면에 두 개가 됩니다. (PR #68 리뷰)
 *
 * 이 창을 벗어나면 이번 리포트로 돌아올 방법(리포트 목록 · 알림)이 아직 없다는 것도 숨기지 않습니다.
 * 없는 길을 있는 것처럼 적으면 사용자가 찾으러 헤맵니다.
 */
function AnalysisTimedOutNotice() {
  return (
    <div
      role="status"
      // 팁에서 안내로 순간 바뀌면 튀어 보여서 나타날 때만 흐리게 들어옵니다. 움직임 줄이기를 켠 사용자에게는 끕니다.
      className="flex w-full flex-col items-center gap-4 rounded-md bg-badge-warning-bg p-5 transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none"
    >
      <div className="flex flex-col gap-1">
        <p className="text-body-md font-semibold text-badge-warning-text">
          분석이 오래 걸리고 있어요
        </p>
        <p className="break-keep text-body-sm text-neutral-700">
          10분이 넘도록 분석이 끝나지 않았어요. 서버가 바쁘거나 문제가 생겼을 수 있어요. 지난 리포트를
          모아 보는 화면은 아직 준비 중이라, 이 창을 벗어나면 이번 리포트로 돌아올 길이 없어요.
        </p>
      </div>

      <Button size="sm" variant="primary" onClick={() => window.location.reload()}>
        다시 기다리기
      </Button>
    </div>
  )
}

/**
 * 분석이 실패했을 때 팁 자리에 붙는 안내입니다.
 *
 * 다시 요청해서 풀릴 수 있는 실패(`retryable`)에만 "다시 분석하기" 를 둡니다. 다시 요청하면 백엔드가 같은
 * reportId 로 처음부터 다시 돌립니다. 풀리지 않는 실패(답변이 너무 적음 등)에는 버튼을 두지 않습니다 —
 * 눌러도 같은 안내가 다시 뜨기 때문입니다. 나갈 길은 왼쪽 위 "처음 화면으로" 입니다.
 */
function AnalysisFailedNotice({ message, onRetry }: { message: string; onRetry: (() => void) | null }) {
  return (
    <div
      role="alert"
      className="flex w-full flex-col items-center gap-4 rounded-md bg-badge-danger-bg p-5 transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none"
    >
      <div className="flex flex-col gap-1">
        <p className="text-body-md font-semibold text-badge-danger-text">리포트를 만들지 못했어요</p>
        <p className="break-keep text-body-sm text-neutral-700">{message}</p>
      </div>

      {onRetry && (
        <Button size="sm" variant="primary" onClick={onRetry}>
          다시 분석하기
        </Button>
      )}
    </div>
  )
}
