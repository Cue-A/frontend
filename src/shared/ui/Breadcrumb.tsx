import { Fragment } from 'react'

type Props = {
  /** 앞에서부터 차례로. 마지막이 지금 화면입니다 (예: `['내 보관함', '연습 기록']`) */
  items: string[]
}

/**
 * 화면 왼쪽 위의 "내 보관함 / 연습 기록" 같은 현재 위치 줄입니다. (보관함 시안 breadcrumb)
 *
 * 보관함의 자소서 · 포트폴리오와 연습 기록이 같이 씁니다. 앞쪽 단계는 갈 화면이 따로 없어서(내 보관함은 사이드바의
 * 여닫기 줄입니다) 링크가 아니라 글자입니다.
 */
export default function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="현재 위치" className="min-w-0 overflow-hidden">
      <ol className="flex items-center gap-2 whitespace-nowrap text-body-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <Fragment key={item}>
              {index > 0 && (
                <li aria-hidden className="text-neutral-400">
                  /
                </li>
              )}
              <li
                aria-current={last ? 'page' : undefined}
                className={last ? 'font-semibold text-neutral-900' : 'text-neutral-500'}
              >
                {item}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
