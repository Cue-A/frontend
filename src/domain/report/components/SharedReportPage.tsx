import { Link, useParams } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import Logo from '@/shared/ui/Logo'

import type { SharedReport } from '../api/sharedReportApi'
import { useSharedReport } from '../hooks/useSharedReport'

import CompanyCommentSection from './CompanyCommentSection'
import ImprovedAnswerSection from './ImprovedAnswerSection'
import ReportHeader from './ReportHeader'
import ScoreSection from './ScoreSection'
import SummarySection from './SummarySection'
import TimelineSection from './TimelineSection'

const PAGE_TITLE = '결과 리포트 | Cue&A'

/** 로고 줄. 받은 사람은 서비스를 처음 보는 사람일 수 있어 어디서 온 리포트인지 먼저 보이게 합니다 */
function SharedTopBar() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 pt-6">
      <Link
        to={ROUTES.LANDING}
        aria-label="Cue&A 처음 화면"
        className="rounded-xs focus-visible:outline-2 focus-visible:outline-primary-500"
      >
        <Logo className="h-8 w-auto" />
      </Link>
      <span className="text-body-sm text-neutral-500">공유받은 리포트 · 읽기 전용</span>
    </header>
  )
}

/** 리포트 아래 안내. 받은 사람을 서비스로 잇습니다 (이슈 #199 — 두기로 정함) */
function PracticeInvite() {
  return (
    <Card padding="lg" label="면접 연습 안내">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-h2 text-neutral-900">나도 면접 연습해 볼까요?</p>
          <p className="break-keep text-body-md text-neutral-500">
            AI 면접관과 연습하고, 이런 리포트를 바로 받아 볼 수 있어요.
          </p>
        </div>
        <Button variant="primary" to={ROUTES.LANDING}>
          나도 면접 연습해 보기
        </Button>
      </div>
    </Card>
  )
}

function SharedReportBody({ shared }: { shared: SharedReport }) {
  const { report, timeline } = shared

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader report={report} />

      {report.scoreGateReason && (
        <p role="status" className="rounded-sm bg-badge-warning-bg p-4 text-body-md text-badge-warning-text">
          총점에 상한이 걸렸어요 — {report.scoreGateReason}
        </p>
      )}

      {report.notices.map((notice) => (
        <p
          key={notice}
          role="status"
          className="rounded-sm bg-badge-warning-bg p-4 text-body-md text-badge-warning-text"
        >
          ⚠ {notice}
        </p>
      ))}

      <SummarySection
        summary={report.summary}
        subtitle={[report.jobRole, report.interviewDate].filter(Boolean).join(' · ')}
      />

      {report.companyComment && (
        <CompanyCommentSection comment={report.companyComment} companyName={report.companyName} />
      )}

      {/* 남의 리포트라 다시 분석할 수 없습니다. retry 를 비워 "다시 분석" 칸을 그리지 않습니다 */}
      <ScoreSection metrics={report.metrics} subMetrics={report.subMetrics} comment={report.metricsComment} />

      {/* 녹음 · 영상이 공유되지 않아서 마커를 눌러 옮길 곳이 없습니다(onSeek 없음). 마커와 근거는 그대로 보여줍니다 */}
      <TimelineSection turns={report.summary.turns} timeline={{ status: 'ready', timeline }} showMarkers />

      {report.improvedAnswer && <ImprovedAnswerSection improvedAnswer={report.improvedAnswer} />}

      <PracticeInvite />
    </div>
  )
}

/**
 * 공유 링크로 연 리포트 — 로그인 없이 보는 읽기 전용 화면입니다. (이슈 #199 · Cue-A/backend#137)
 *
 * 로그인 가드 · 사이드바 밖에 둡니다(router.tsx). 로그인한 사람이 열어도 같은 화면입니다 — 남의 리포트일 수 있어서
 * 본인 리포트 화면으로 보내지 않습니다.
 *
 * 본인 리포트 화면(`ReportPage`)의 섹션을 그대로 쓰고, 이것들만 뺍니다.
 * - 저장 · 공유 · 재연습 · 다시 분석 버튼과 리포트 옵션 — 남의 리포트를 다루는 도구라서
 * - 회차 칩 · 회차 비교 · 성장 추이 탭 — 받은 사람에게 남의 다른 회차는 열리지 않아서
 * - 답변 영상 · 녹음 — 공유되지 않습니다
 *
 * 답변 내용이 들어 있어서 검색 엔진이 담지 않게 `noindex` 를 답니다. React 19 는 컴포넌트 안의 `<meta>` · `<title>` 을
 * 문서 머리로 올려 주고, 화면을 떠나면 걷어 갑니다.
 */
export default function SharedReportPage() {
  const { shareId } = useParams()
  const state = useSharedReport(shareId)

  return (
    <div className="min-h-screen bg-neutral-50">
      <title>{PAGE_TITLE}</title>
      <meta name="robots" content="noindex, nofollow" />

      <SharedTopBar />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
        {state.status === 'loading' && <p className="text-body-md text-neutral-500">리포트를 불러오는 중이에요…</p>}

        {state.status === 'error' && (
          <Card padding="lg" label="공유 리포트">
            <div role="alert" className="flex flex-col items-start gap-4">
              <p className="text-body-md text-neutral-700">
                {state.notFound
                  ? '공유가 해제됐거나 없는 링크예요. 리포트를 보낸 사람에게 링크를 다시 받아 주세요.'
                  : `리포트를 불러오지 못했어요. ${state.message}`}
              </p>
              <Button size="sm" to={ROUTES.LANDING}>
                Cue&A 둘러보기
              </Button>
            </div>
          </Card>
        )}

        {state.status === 'ready' && <SharedReportBody shared={state.shared} />}
      </main>
    </div>
  )
}
