import { IconCornerDownRight } from '@tabler/icons-react'
import type { ReactNode } from 'react'

import Card from '@/shared/ui/Card'

type Props = {
  /** 꼬리질문 · 되묻기 이름표. 본 질문이면 비웁니다 */
  badge?: string | null
  /** 질문 위 한 줄 (분류 · 회사 · 날짜) */
  meta: string
  /** 꼬리질문 · 되묻기가 따라온 원질문. 있으면 회색으로 먼저 보이고 질문은 `↳` 아래에 놓입니다 */
  originalText?: string | null
  text: string
  /** 오른쪽 위 버튼 (북마크 해제 · 즐겨찾기) */
  action?: ReactNode
  /** 질문 아래 (메모) */
  footer?: ReactNode
}

/**
 * 질문 은행 카드 한 장입니다. 북마크와 공통 질문이 같은 모양을 씁니다 (시안: 옵션 요약 → 질문 → 메모).
 * 안에 무엇이 들어갈지는 쓰는 쪽이 정합니다.
 */
export default function QuestionCard({ badge, meta, originalText, text, action, footer }: Props) {
  return (
    <Card padding="md">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-body-sm text-neutral-500">
            {badge && (
              <span className="rounded-xs bg-primary-100 px-2 py-0.5 font-semibold text-primary-700">{badge}</span>
            )}
            <span>{meta}</span>
          </p>

          {originalText ? (
            <>
              <p className="mt-2 break-keep text-body-md text-neutral-700">{originalText}</p>
              <p className="mt-1 flex items-start gap-2 break-keep text-body-lg font-semibold text-neutral-900">
                <IconCornerDownRight size={16} stroke={2} aria-hidden className="mt-1.5 shrink-0 text-neutral-400" />
                {text}
              </p>
            </>
          ) : (
            <p className="mt-2 break-keep text-body-lg font-semibold text-neutral-900">{text}</p>
          )}
        </div>

        {action}
      </div>

      {footer && <div className="mt-4">{footer}</div>}
    </Card>
  )
}
