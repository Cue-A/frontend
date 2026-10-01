import { IconBuilding } from '@tabler/icons-react'

import Card from '@/shared/ui/Card'

type Props = {
  /** AI 가 쓴 인재상 코멘트(1~2문장) */
  comment: string
  /** 면접에서 고른 기업. 없으면 소제목에서 이름을 뺍니다 */
  companyName: string | null
}

/**
 * 기업 인재상 코멘트입니다. **기업을 고른 면접에서만** 그립니다.
 *
 * AI 가 고른 기업의 인재상에 비춰 "답변에서 드러난 가치 · 더 보여주면 좋을 것" 을 1~2문장으로 씁니다
 * (`company_comment`, `ai/report_writer.py`). 기업을 안 골랐거나 생성에 실패하면 null 이라, 그때는
 * 부르는 쪽(`ReportPage`)이 이 절을 아예 그리지 않습니다.
 *
 * 이번 면접 요약 바로 아래에 둡니다. 총평을 읽은 다음 "이 기업 기준으로는?" 이 이어서 궁금한 순서입니다.
 * 시안에 없던 자리라 요약 카드와 같은 모양(제목 · 소제목 · 강조 판)을 따랐습니다.
 */
export default function CompanyCommentSection({ comment, companyName }: Props) {
  return (
    <Card label="인재상 코멘트" padding="lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-h2 text-neutral-900">인재상 코멘트</h2>
          <p className="text-body-sm text-neutral-500">
            {companyName ? `${companyName} 인재상에 비춰 본 답변이에요` : '고른 기업의 인재상에 비춰 본 답변이에요'}
          </p>
        </div>

        <p className="flex items-start gap-3 rounded-sm bg-neutral-50 p-5 text-body-md text-neutral-900">
          <IconBuilding size={20} aria-hidden className="mt-0.5 shrink-0 text-primary-500" />
          {comment}
        </p>
      </div>
    </Card>
  )
}
