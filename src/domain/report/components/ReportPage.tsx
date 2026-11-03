import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { useAxisRetry } from '../hooks/useAxisRetry'
import { useFailedReportSession } from '../hooks/useFailedReportSession'
import { useReport } from '../hooks/useReport'
import { useReportComparison } from '../hooks/useReportComparison'
import { useReportExport } from '../hooks/useReportExport'
import { reportFileBaseName } from '../lib/reportExport'
import { DEFAULT_DISPLAY_OPTIONS } from '../types/displayOptions'

import AnswerVideoSection from './AnswerVideoSection'
import CompanyCommentSection from './CompanyCommentSection'
import ComparisonSection from './ComparisonSection'
import ExportExclude from './ExportExclude'
import ImprovedAnswerSection from './ImprovedAnswerSection'
import ReportActions from './ReportActions'
import ReportDocActions from './ReportDocActions'
import ReportHeader from './ReportHeader'
import ReportOptions from './ReportOptions'
import ScoreSection from './ScoreSection'
import SummarySection from './SummarySection'
import TimelineSection from './TimelineSection'

/**
 * 면접 리포트 화면입니다. (C-01 리포트 확인 / 개선안)
 *
 * 시안 순서대로 위에서 아래로 한 줄로 쌓습니다.
 * 유틸리티(인쇄 · 공유) → 제목 · 종합 점수 → 리포트 옵션 → 안내 →
 * 이번 면접 요약 → (인재상 코멘트) → 세부 점수 → 답변 영상 → XAI 타임라인 → 개선 답변 예시
 * → 다음 단계
 *
 * 인재상 코멘트는 기업을 고른 면접에서만 나옵니다. 시안에 없던 자리라 요약 바로 아래에 붙였습니다.
 *
 * 리포트 본문 판(`sheetRef`)은 이미지 · PDF 로 저장할 수 있습니다(이슈 #143). 화면을 다루는 도구(옵션 카드 ·
 * 다시 분석 버튼 · 다음 단계)와 파일에서 볼 수 없는 답변 영상 자리는 `ExportExclude` 로 감싸 저장에서 뺍니다.
 * 켜 둔 표시 옵션과 인쇄용 흑백은 저장에도 그대로 들어갑니다.
 *
 * 사이드바 없이 혼자 그립니다. 시안에 사이드바가 없고 자체 상단바를 쓰기 때문에
 * AppLayout 밖에 두었습니다. (router.tsx)
 *
 * 색 · 타이포는 전부 토큰 클래스이고, 반복되는 판 · 버튼 · 칩 · 배지는
 * shared/ui 를 씁니다. 이 파일에는 임의 값이 하나도 없습니다.
 */
export default function ReportPage() {
  const { reportId } = useParams()
  const { data, isLoading, error, errorCode, reload } = useReport(reportId)
  // 분석이 실패한 리포트도 재연습할 수 있어서, 어느 면접인지 상태 조회로 찾아 "다시 연습하기" 를 재연습으로 잇습니다
  const failedReport = useFailedReportSession(reportId, errorCode === 'REPORT_FAILED')
  const retry = useAxisRetry(reportId, data, reload)
  // 회차 비교는 리포트를 먼저 그린 뒤 따로 부릅니다(AI 가 계산해서 몇 초 걸림). 다시 분석으로 점수가 바뀌면 새로 부릅니다.
  // 총점이 같아도 축 점수만 바뀌는 재분석이 있어서, 축 점수까지 버전에 넣습니다 — 회차 비교가 축별 변화도 보여줍니다 (PR #158 리뷰)
  const comparison = useReportComparison(data ? data.reportId : null, {
    subject: '이 리포트',
    version: data ? [data.status, data.totalScore, ...data.metrics.map((metric) => metric.score)].join(':') : undefined,
  })
  const [options, setOptions] = useState(DEFAULT_DISPLAY_OPTIONS)
  // 훅은 아래 분기보다 먼저 불러야 해서, 아직 리포트가 없을 때 쓸 이름을 둡니다. 저장 버튼은 리포트를 그린 뒤에만 보입니다
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const exporter = useReportExport(sheetRef, data ? reportFileBaseName(data) : '큐앤에이_리포트')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <p className="text-body-md text-neutral-500">리포트를 불러오는 중이에요…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-start gap-4 bg-neutral-50 p-6">
        <p className="text-body-md text-neutral-700">{error ?? '리포트를 찾을 수 없어요.'}</p>
        <ReportActions sessionId={failedReport.sessionId ?? undefined} checking={failedReport.checking} />
      </div>
    )
  }

  /*
    전에는 여기서 analysisStatus 가 COMPLETED 가 아닐 때 "분석 중" 문구를 띄웠습니다.
    `QUEUED` · `PROCESSING` 같은 값은 계약이 없을 때 지어낸 것이라 지웠습니다.

    상황 자체는 그대로 있습니다. 다만 상태 필드가 아니라 **에러 코드**로 옵니다. (Cue-A/backend#66)

      REPORT_NOT_FOUND   없는 리포트 · 남의 리포트 (404)
      REPORT_NOT_READY   아직 만드는 중 (202)
      REPORT_FAILED      분석이 실패한 리포트 (409) — 내용 분석 실패 · 답변 부족 등

    셋 다 조회가 에러로 떨어져서 위의 error 분기가 받고, 문구는
    `shared/api/errorMessage.ts` 가 붙입니다. 그래서 여기 따로 분기하지 않습니다.
    점수가 빈 리포트를 그리는 길은 아예 없습니다.

    분석이 도는 동안 진행률을 보여주는 건 분석 중 화면(B-02)이 맡습니다.
    조회 응답을 화면 값으로 바꾸는 건 `api/reportResponse.ts` 이고, 응답에 없는 값(회사명 · 회차 · 영상 …)을
    무엇으로 채우는지도 그 파일 맨 위에 적어 뒀습니다.
  */

  /*
    "시선 지표 포함" 을 끄면 시선 **점수**를 뺍니다. 다만 아래 두 경우의 시선 줄은 남깁니다. (PR #92 리뷰)

    - **분석이 실패한 줄**(`retryAxis`): 점수가 아니라 다시 분석할 항목입니다. 같이 빼면 아래 "다시 분석" 칸
      (`RetryPanel`)이 시선을 다시 분석한다고 적지 않는데, 백엔드는 실패한 축을 전부 돌려서 시선도 같이 바뀝니다
    - **방금 다시 분석해서 살아난 줄**: 누른 결과가 눈앞에서 사라지고 총점만 바뀌면 무엇이 바뀌었는지 알 수 없습니다.
      다른 회차로 옮기거나 새로고침하면 토글대로 다시 빠집니다
  */
  const keepGazeRow = (metric: (typeof data.metrics)[number]) =>
    metric.retryAxis !== null || retry.outcomes.gaze?.kind === 'recovered'

  const metrics = options.showGaze
    ? data.metrics
    : data.metrics.filter((metric) => metric.key !== 'gaze' || keepGazeRow(metric))

  return (
    <div className="min-h-screen bg-neutral-50 print:min-h-0 print:bg-neutral-0">
      {/*
        유틸리티 줄은 리포트 내용이 아니라 이 화면을 다루는 도구라, 시안에서도
        인쇄 영역(`sheet`) 바깥에 있습니다. 흑백으로 바꿔도 여기는 그대로 둡니다.
      */}
      <div className="mx-auto w-full max-w-5xl px-6 pt-6">
        <ReportDocActions exporter={exporter} />
      </div>

      {/*
        "인쇄용 흑백"은 색을 하나하나 바꾸지 않고 판 전체를 회색조로 그립니다.
        토큰을 흑백 세트로 따로 만들면 화면마다 두 벌을 관리해야 합니다.
      */}
      <div
        ref={sheetRef}
        data-report-sheet
        className={`mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 print:max-w-none print:p-0 ${
          options.printMono ? 'grayscale' : ''
        }`}
      >
        <ReportHeader report={data} />

        <ExportExclude>
          <ReportOptions
            attempts={data.attempts}
            currentAttempt={data.attempt}
            options={options}
            onChange={setOptions}
            available={{
              showTimeline: data.summary.turns.length > 0,
              showImprovedAnswer: data.improvedAnswer !== null,
              showGaze: data.metrics.some((metric) => metric.key === 'gaze'),
            }}
          />
        </ExportExclude>

        {/*
          총점 상한은 일반 안내보다 먼저 보여줍니다. "왜 점수가 낮지" 는 리포트를
          열자마자 드는 질문이라, 아래쪽에 있으면 못 보고 지나갑니다.
        */}
        {data.scoreGateReason && (
          <p
            role="status"
            className="rounded-sm bg-badge-warning-bg p-4 text-body-md text-badge-warning-text"
          >
            총점에 상한이 걸렸어요 — {data.scoreGateReason}
          </p>
        )}

        {data.notices.map((notice) => (
          <p
            key={notice}
            role="status"
            className="rounded-sm bg-badge-warning-bg p-4 text-body-md text-badge-warning-text"
          >
            ⚠ {notice}
          </p>
        ))}

        <SummarySection
          summary={data.summary}
          subtitle={[data.jobRole, data.interviewDate].filter(Boolean).join(' · ')}
        />

        {data.companyComment && (
          <CompanyCommentSection comment={data.companyComment} companyName={data.companyName} />
        )}

        <ScoreSection
          metrics={metrics}
          subMetrics={data.subMetrics}
          comment={data.metricsComment}
          retry={retry}
        />

        {/* 다 불러온 비교 내용만 저장에 넣습니다. 로딩 자리 표시 · 오류 안내(다시 시도 버튼)는 파일에 남지 않게 뺍니다 (PR #158 리뷰) */}
        <ExportExclude when={comparison.status !== 'ready'}>
          <ComparisonSection comparison={comparison} />
        </ExportExclude>

        {data.video && (
          <ExportExclude>
            <AnswerVideoSection video={data.video} />
          </ExportExclude>
        )}

        {options.showTimeline && <TimelineSection turns={data.summary.turns} />}

        {options.showImprovedAnswer && data.improvedAnswer && (
          <ImprovedAnswerSection improvedAnswer={data.improvedAnswer} />
        )}

        <ExportExclude>
          <ReportActions exporter={exporter} sessionId={data.sessionId} />
        </ExportExclude>
      </div>
    </div>
  )
}
