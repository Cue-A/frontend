import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { useReport } from '../hooks/useReport'
import { DEFAULT_DISPLAY_OPTIONS } from '../types/displayOptions'

import ImprovedAnswerSection from './ImprovedAnswerSection'
import ReportActions from './ReportActions'
import ReportHeader from './ReportHeader'
import ReportOptions from './ReportOptions'
import ScoreSection from './ScoreSection'
import SummarySection from './SummarySection'
import TimelineSection from './TimelineSection'

/** 분석이 안 끝났을 때 보여줄 문구입니다. COMPLETED 는 여기 오지 않습니다. */
const ANALYSIS_MESSAGE: Record<string, string> = {
  QUEUED: '분석을 기다리는 중이에요. 잠시 후 다시 확인해 주세요.',
  PROCESSING: '아직 분석 중이에요. 끝나면 리포트가 채워집니다.',
  FAILED: '분석에 실패했어요. 다시 연습해 주세요.',
}

/**
 * 면접 리포트 화면입니다. (C-01 리포트 확인 / 개선안)
 *
 * 시안 순서대로 위에서 아래로 한 줄로 쌓습니다.
 * 제목 · 종합 점수 → 리포트 옵션 → 안내 → 이번 면접 요약 → 세부 점수
 * → XAI 타임라인 → 개선 답변 예시 → 다음 단계
 *
 * 사이드바 없이 혼자 그립니다. 시안에 사이드바가 없고 자체 상단바를 쓰기 때문에
 * AppLayout 밖에 두었습니다. (router.tsx)
 *
 * 색 · 타이포는 토큰이 dev 에 들어온 뒤에 한 번에 입힙니다.
 * 지금 임의 클래스를 쓰면 나중에 전부 되돌려야 해서 구조만 먼저 잡았습니다.
 */
export default function ReportPage() {
  const { reportId } = useParams()
  const { data, isLoading, error } = useReport(reportId)
  const [options, setOptions] = useState(DEFAULT_DISPLAY_OPTIONS)

  if (isLoading) {
    return <p className="p-6">리포트를 불러오는 중이에요…</p>
  }

  if (error || !data) {
    return (
      <section className="flex flex-col items-start gap-4 p-6">
        <p>{error ?? '리포트를 찾을 수 없어요.'}</p>
        <ReportActions />
      </section>
    )
  }

  // 분석이 끝나기 전에는 점수가 비어 있습니다. 그대로 그리면 0점처럼 보입니다.
  if (data.analysisStatus !== 'COMPLETED') {
    return (
      <section className="flex flex-col items-start gap-4 p-6">
        <p>{ANALYSIS_MESSAGE[data.analysisStatus]}</p>
        <ReportActions />
      </section>
    )
  }

  const metrics = options.showVision
    ? data.metrics
    : data.metrics.filter((metric) => metric.key !== 'vision')

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <ReportHeader report={data} />

      <ReportOptions
        attempts={data.attempts}
        currentAttempt={data.attempt}
        options={options}
        onChange={setOptions}
      />

      {data.notices.map((notice) => (
        <p key={notice} role="status" className="border p-4">
          {notice}
        </p>
      ))}

      <SummarySection summary={data.summary} subtitle={`${data.jobRole} · ${data.interviewDate}`} />

      <ScoreSection metrics={metrics} subMetrics={data.subMetrics} comment={data.metricsComment} />

      {options.showTimeline && <TimelineSection turns={data.summary.turns} />}

      {options.showImprovedAnswer && data.improvedAnswer && (
        <ImprovedAnswerSection improvedAnswer={data.improvedAnswer} />
      )}

      <ReportActions />
    </div>
  )
}
