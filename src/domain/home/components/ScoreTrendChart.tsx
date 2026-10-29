import { IconTriangleFilled, IconTriangleInvertedFilled } from '@tabler/icons-react'
import { useState } from 'react'

import type { ScoreTrend } from '../types/home'

/** 세로축 범위. 점수 차이가 작아도 선이 납작해지지 않게 위아래로 조금씩 띄웁니다 */
function yDomain(scores: number[]) {
  const min = Math.max(0, Math.floor((Math.min(...scores) - 10) / 10) * 10)
  const max = Math.min(100, Math.ceil((Math.max(...scores) + 5) / 10) * 10)
  return max === min ? { min: Math.max(0, min - 10), max: Math.min(100, max + 10) } : { min, max }
}

/** 가로 점선 네 줄 (시안) */
const GRID_LINES = [0, 1 / 3, 2 / 3, 1]

type Props = {
  trend: ScoreTrend
}

/**
 * 연습 점수 추이. 시리즈가 하나뿐이라 범례 없이 제목이 이름을 대신합니다.
 *
 * 선과 면은 SVG 를 카드 폭에 맞춰 늘려서 그리고(`preserveAspectRatio="none"`), 점과 말풍선은 HTML 로 얹습니다.
 * SVG 안에 원을 그리면 같이 늘어나서 타원이 됩니다. 선 굵기는 `non-scaling-stroke` 로 늘어나지 않게 둡니다.
 *
 * 점 위에 마우스를 올리면 그 회차(또는 달)의 날짜와 점수가 뜹니다. 스크린리더용 표는 따로 둡니다.
 */
export default function ScoreTrendChart({ trend }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)
  const { points, unit } = trend

  if (points.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-1 rounded-md bg-surface-muted p-6 text-center">
        <p className="text-body-md font-semibold text-neutral-700">아직 점수가 없어요</p>
        <p className="text-body-sm text-neutral-500">면접을 한 번 마치면 여기에 점수 추이가 그려져요</p>
      </div>
    )
  }

  const scores = points.map((point) => point.score)
  const { min, max } = yDomain(scores)
  const latest = scores[scores.length - 1]
  const delta = latest - scores[0]

  const positions = points.map((point, index) => ({
    x: points.length === 1 ? 50 : (index / (points.length - 1)) * 100,
    y: 100 - ((point.score - min) / (max - min)) * 100,
  }))
  const linePath = positions.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const first = positions[0]
  const last = positions[positions.length - 1]
  const areaPath = `${linePath} L${last.x},100 L${first.x},100 Z`

  const startLabel = unit === 'session' ? `${points.length}회 전` : points[0].label
  const endLabel = unit === 'session' ? '최근' : points[points.length - 1].label
  const hoveredPoint = hovered === null ? null : { ...points[hovered], ...positions[hovered] }

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-body-sm font-semibold text-neutral-700">
          연습 점수 추이{unit === 'month' && <span className="font-normal text-neutral-500"> · 월 평균</span>}
        </p>
        <p className="flex items-baseline gap-2">
          <span className="text-h2 font-bold text-primary-500">{latest}점</span>
          {points.length > 1 && <ScoreDelta delta={delta} />}
        </p>
      </div>

      <div className="relative mt-5 h-36 px-2" onMouseLeave={() => setHovered(null)}>
        <div className="relative h-full">
          <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            {GRID_LINES.map((ratio) => (
              <line
                key={ratio}
                x1={0}
                x2={100}
                y1={ratio * 100}
                y2={ratio * 100}
                className="stroke-neutral-200"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path d={areaPath} className="fill-primary-100" />
            <path
              d={linePath}
              className="fill-none stroke-primary-500"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {hoveredPoint && (
            <span aria-hidden className="absolute inset-y-0 w-px bg-neutral-300" style={{ left: `${hoveredPoint.x}%` }} />
          )}

          {positions.map(({ x, y }, index) => {
            const isLast = index === positions.length - 1
            return (
              <span
                key={index}
                aria-hidden
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary-500 bg-neutral-0 ${
                  isLast || index === hovered ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'
                }`}
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            )
          })}

          {/* 점보다 넓은 세로 띠를 마우스 판정 영역으로 둡니다. 2px 선 위의 10px 점을 정확히 노리기는 어렵습니다 */}
          <div aria-hidden className="absolute inset-0 flex">
            {points.map((point, index) => (
              <span key={`${point.label}-${index}`} className="h-full flex-1" onMouseEnter={() => setHovered(index)} />
            ))}
          </div>

          {hoveredPoint && (
            <span
              aria-hidden
              className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-sm bg-neutral-900 px-3 py-2 text-body-sm text-neutral-0 shadow-float ${
                hoveredPoint.x < 15 ? '' : hoveredPoint.x > 85 ? '-translate-x-full' : '-translate-x-1/2'
              }`}
              style={{ left: `${hoveredPoint.x}%`, top: `calc(${hoveredPoint.y}% - 56px)` }}
            >
              <span className="block text-micro text-neutral-0/80">{hoveredPoint.label}</span>
              <span className="font-semibold">{hoveredPoint.score}점</span>
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-between px-2 text-body-sm text-neutral-400">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>

      <table className="sr-only">
        <caption>연습 점수 추이{unit === 'month' ? ' (월 평균)' : ''}</caption>
        <thead>
          <tr>
            <th scope="col">{unit === 'month' ? '달' : '날짜'}</th>
            <th scope="col">점수</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, index) => (
            <tr key={`${point.label}-${index}`}>
              <td>{point.label}</td>
              <td>{point.score}점</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * 처음 점 대비 마지막 점. 색만으로 오르내림을 말하지 않게 화살표와 글을 같이 둡니다.
 * 시안의 초록(`semantic-success`)은 12px 글자로는 흰 바탕 대비가 모자라서 같은 계열의 진한 글자색을 씁니다.
 */
function ScoreDelta({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-body-sm text-neutral-500">변화 없음</span>

  const up = delta > 0
  const Icon = up ? IconTriangleFilled : IconTriangleInvertedFilled
  return (
    <span className={`flex items-center gap-1 text-body-sm font-semibold ${up ? 'text-badge-success-text' : 'text-badge-danger-text'}`}>
      <Icon size={10} aria-hidden />
      {Math.abs(delta)}점
      <span className="sr-only">{up ? '올랐어요' : '내렸어요'}</span>
    </span>
  )
}
