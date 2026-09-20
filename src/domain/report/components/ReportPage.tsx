import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { useReport } from '../hooks/useReport'
import { DEFAULT_DISPLAY_OPTIONS } from '../types/displayOptions'

import AnswerVideoSection from './AnswerVideoSection'
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
 * 이번 면접 요약 → 세부 점수 → 답변 영상 → XAI 타임라인 → 개선 답변 예시
 * → 다음 단계
 *
 * 사이드바 없이 혼자 그립니다. 시안에 사이드바가 없고 자체 상단바를 쓰기 때문에
 * AppLayout 밖에 두었습니다. (router.tsx)
 *
 * 색 · 타이포는 전부 토큰 클래스이고, 반복되는 판 · 버튼 · 칩 · 배지는
 * shared/ui 를 씁니다. 이 파일에는 임의 값이 하나도 없습니다.
 */
export default function ReportPage() {
  const { reportId } = useParams()
  const { data, isLoading, error } = useReport(reportId)
  const [options, setOptions] = useState(DEFAULT_DISPLAY_OPTIONS)

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
        <ReportActions />
      </div>
    )
  }

  /*
    전에는 여기서 analysisStatus 가 COMPLETED 가 아닐 때 "분석 중" 문구를 띄웠습니다.
    `QUEUED` · `PROCESSING` 같은 값은 계약이 없을 때 지어낸 것이라 지웠습니다.

    상황 자체는 그대로 있습니다. 다만 상태 필드가 아니라 **에러 코드**로 옵니다.

      REPORT_NOT_READY   아직 만드는 중 (백엔드 ErrorCode.java, HTTP 202)
      CONTENT_FAILED     내용 분석 실패 — 리포트가 아예 없음
      REPORT_TOO_SHORT   답변 2문항 미만

    셋 다 조회가 에러로 떨어져서 위의 error 분기가 받고, 문구는
    `shared/api/errorMessage.ts` 가 붙입니다. 그래서 여기 따로 분기하지 않습니다.
    점수가 빈 리포트를 그리는 길은 아예 없습니다.

    분석이 도는 동안 진행률을 보여주는 건 분석 중 화면(B-02)이 맡습니다.
    단계 값은 맞춰뒀고(ANALYSIS_STAGES), 어느 통로로 받는지만 Q6b 에 남아 있습니다.
  */

  const metrics = options.showVision
    ? data.metrics
    : data.metrics.filter((metric) => metric.key !== 'gaze')

  return (
    <div className="min-h-screen bg-neutral-50">
      {/*
        유틸리티 줄은 리포트 내용이 아니라 이 화면을 다루는 도구라, 시안에서도
        인쇄 영역(`sheet`) 바깥에 있습니다. 흑백으로 바꿔도 여기는 그대로 둡니다.
      */}
      <div className="mx-auto w-full max-w-5xl px-6 pt-6">
        <ReportDocActions />
      </div>

      {/*
        "인쇄용 흑백"은 색을 하나하나 바꾸지 않고 판 전체를 회색조로 그립니다.
        토큰을 흑백 세트로 따로 만들면 화면마다 두 벌을 관리해야 합니다.
      */}
      <div
        className={`mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 ${
          options.printMono ? 'grayscale' : ''
        }`}
      >
        <ReportHeader report={data} />

        <ReportOptions
          attempts={data.attempts}
          currentAttempt={data.attempt}
          options={options}
          onChange={setOptions}
        />

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
          subtitle={`${data.jobRole} · ${data.interviewDate}`}
        />

        <ScoreSection
          metrics={metrics}
          subMetrics={data.subMetrics}
          comment={data.metricsComment}
        />

        {data.video && <AnswerVideoSection video={data.video} />}

        {options.showTimeline && <TimelineSection turns={data.summary.turns} />}

        {options.showImprovedAnswer && data.improvedAnswer && (
          <ImprovedAnswerSection improvedAnswer={data.improvedAnswer} />
        )}

        <ReportActions />
      </div>
    </div>
  )
}
