import Card from '@/shared/ui/Card'

import GrowthCardHeader from './GrowthCardHeader'

type Props = {
  /** undefined 면 불러오는 중, null 이면 비교할 이전 회차가 없음(첫 회차) */
  roundChange: string[] | null | undefined
}

/**
 * 이전 회차 대비 변화 (시안 card-growth-analysis, 기능명세서 GRW-2).
 *
 * 서버가 만든 문장을 문단 그대로 보여줍니다. 첫 회차라 비교할 회차가 없으면 서버가 null 을 주고, 시안 메모대로 이 칸을
 * 비웁니다 — 다만 빈 판만 두면 고장으로 보여서, 왜 비었는지와 언제 채워지는지를 한 줄 적습니다.
 */
export default function RoundChangeCard({ roundChange }: Props) {
  return (
    <Card label="이전 회차 대비 변화" padding="lg">
      <GrowthCardHeader title="이전 회차 대비 변화" />

      {roundChange === undefined ? (
        <p aria-busy className="mt-5 text-body-sm text-neutral-400">
          이전 회차와 비교하는 중이에요…
        </p>
      ) : roundChange === null ? (
        <p className="mt-5 break-keep text-body-md text-neutral-500">
          비교할 이전 회차가 아직 없어요. 같은 면접을 한 번 더 보면 무엇이 달라졌는지 여기에서 알려드려요.
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-1">
          {roundChange.map((paragraph, index) => (
            <p key={index} className="break-keep text-body-md text-neutral-700">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </Card>
  )
}
