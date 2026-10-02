import Card from '@/shared/ui/Card'

import ComingSoonLink from './ComingSoonLink'
import CardHeader from './CardHeader'
import SkeletonBlock from './SkeletonBlock'

/**
 * 읽기만 하는 태그 모양. `shared/ui/Chip` 은 고르는 칩이라 마우스를 올리면 배경이 바뀌는데, 여기 태그는
 * 눌러도 갈 곳이 없어서(인재상 · 질문은행 화면 없음) 그 반응을 빼고 따로 그립니다.
 */
function TagList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className="rounded-full border border-neutral-300 px-3.5 py-1.5 text-body-sm text-neutral-700">
          {item}
        </li>
      ))}
    </ul>
  )
}

type Props = {
  /** null 이면 불러오는 중 */
  talentKeywords: string[] | null
  popularQuestions: string[] | null
}

/** 기업별 인재상과 질문은행. 시안에서 한 판 안에 구분선으로 나뉘어 있습니다 */
export default function DiscoverCard({ talentKeywords, popularQuestions }: Props) {
  return (
    <Card label="기업별 인재상 · 질문은행" padding="lg" surface="glass-soft">
      <CardHeader title="기업별 인재상" aside={<ComingSoonLink label="전체보기" />} />
      {talentKeywords ? <TagList items={talentKeywords} /> : <SkeletonBlock className="mt-4 h-8 w-full" />}

      <hr className="my-5 border-neutral-200" />

      <CardHeader title="질문은행" aside={<ComingSoonLink label="전체보기" />} />
      {popularQuestions ? <TagList items={popularQuestions} /> : <SkeletonBlock className="mt-4 h-8 w-full" />}
    </Card>
  )
}
