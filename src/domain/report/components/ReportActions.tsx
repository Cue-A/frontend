import { IconArrowBackUp, IconChevronDown, IconDownload, IconFileTypePdf, IconHome, IconPhoto } from '@tabler/icons-react'
import { useId, useRef, type KeyboardEvent } from 'react'

import { ROUTES, toReplay } from '@/app/routes'
import { usePopover } from '@/shared/hooks/usePopover'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import type { ReportExport } from '../hooks/useReportExport'

/** `Button` 의 secondary · md 와 같은 모양입니다. 메뉴를 여는 버튼이라 `aria-expanded` 를 달려고 직접 그립니다 */
const TRIGGER_CLASS =
  'inline-flex w-full items-center justify-center gap-2 rounded-sm border border-neutral-300 px-4 py-3 ' +
  'text-center text-body-md font-semibold text-neutral-900 transition-colors hover:bg-neutral-50'

const MENU_ITEM_CLASS =
  'flex w-full items-center gap-2 px-4 py-2 text-left text-body-md text-neutral-900 transition-colors ' +
  'hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50'

/**
 * "리포트 저장하기" 메뉴입니다. 이미지(PNG) · PDF 중에 고릅니다. (이슈 #143)
 *
 * 위쪽 유틸리티 줄의 두 버튼과 같은 일을 합니다. 리포트를 끝까지 읽은 자리에서 다시 위로 올라가지 않아도 되게
 * 여기에도 둡니다. 화면 맨 아래라 메뉴는 버튼 위로 엽니다.
 *
 * 실패 문구는 위쪽 유틸리티 줄이 `role="alert"` 로 읽어 줍니다. 여기서는 눈으로 보이게만 한 번 더 적습니다.
 *
 * 항목을 고르거나 Esc 로 닫으면 포커스를 "리포트 저장하기" 버튼으로 돌려줍니다. 누른 항목이 메뉴와 함께 사라지면
 * 포커스가 `body` 로 빠져서 키보드 사용자가 위치를 잃습니다. (PR #144 리뷰)
 */
function SaveMenu({ exporter }: { exporter: ReportExport }) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popover = usePopover(rootRef)
  const menuId = useId()

  // 인쇄 창은 열리는 동안 화면을 멈추므로, 포커스를 먼저 돌려놓고 저장을 시작합니다
  const pick = (action: () => void) => () => {
    popover.close()
    triggerRef.current?.focus()
    action()
  }

  // Esc 로 닫는 건 usePopover 가 합니다. 여기서는 포커스만 버튼으로 돌려놓습니다
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && popover.open) triggerRef.current?.focus()
  }

  return (
    <div ref={rootRef} onKeyDown={handleKeyDown} className="relative flex-1">
      <button
        ref={triggerRef}
        type="button"
        onClick={popover.toggle}
        aria-expanded={popover.open}
        aria-controls={menuId}
        className={TRIGGER_CLASS}
      >
        <IconDownload size={16} stroke={2} aria-hidden />
        {exporter.savingImage ? '이미지 만드는 중…' : '리포트 저장하기'}
        <IconChevronDown size={16} stroke={2} aria-hidden className="text-neutral-500" />
      </button>

      {popover.open && (
        <ul
          id={menuId}
          aria-label="저장 형식"
          className="absolute inset-x-0 bottom-full z-10 mb-2 rounded-lg bg-neutral-0 py-2 shadow-float"
        >
          <li>
            <button
              type="button"
              onClick={pick(exporter.saveImage)}
              disabled={exporter.savingImage}
              className={MENU_ITEM_CLASS}
            >
              <IconPhoto size={16} stroke={2} aria-hidden />
              이미지(PNG)로 저장
            </button>
          </li>
          <li>
            <button type="button" onClick={pick(exporter.printPdf)} className={MENU_ITEM_CLASS}>
              <IconFileTypePdf size={16} stroke={2} aria-hidden />
              PDF로 저장
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}

type Props = {
  /**
   * 이미지 · PDF 저장. 리포트를 그린 화면에서만 넘깁니다.
   * 리포트를 못 불러온 화면(에러)에는 저장할 내용이 없어서 비우고, 그러면 저장 버튼을 그리지 않습니다
   */
  exporter?: ReportExport
  /** 이 리포트의 면접. 있으면 "다시 연습하기" 가 재연습으로, 없으면(리포트를 못 불러옴) 새 면접 설정으로 갑니다 */
  sessionId?: string
  /**
   * 분석이 실패한 리포트의 면접을 아직 찾는 중인지. 그동안 "다시 연습하기" 를 잠급니다 — 찾기 전후로 목적지가
   * 바뀌어서, 먼저 누르면 재연습 대신 새 면접 설정으로 가게 됩니다 (PR #153 리뷰)
   */
  checking?: boolean
}

/**
 * 리포트를 다 본 다음에 갈 곳입니다. (C-01 "다음 단계")
 *
 * 문구는 **지금 실제로 일어나는 일**에 맞춰 적습니다 (이슈 #20).
 *
 * - "홈으로 이동" — 홈 대시보드(A-04)로 갑니다. 홈이 생기기 전에는 "처음 화면으로" 라는
 *   이름으로 랜딩에 보냈습니다. 시안 문구로 되돌렸습니다.
 * - "리포트 저장하기" — 이미지(PNG) · PDF 중에 골라 저장합니다(이슈 #143). 서버 저장이 아니라 지금 보이는
 *   리포트를 파일로 내려받습니다. 전에는 저장 API 가 없어 비활성이었습니다.
 * - "다시 연습하기" — 이 면접의 재연습 설정 화면으로 갑니다(이슈 #152). 첫 면접과 같은 질문 · 조건으로 다시
 *   봅니다. 전에는 재연습 API 가 없어 빈 옵션 설정 화면으로만 갔습니다. 리포트 분석이 실패한 화면은 상태 조회로
 *   면접을 찾아 잇고, 찾지 못하면 지금처럼 새 면접 설정으로 보냅니다.
 *
 * 버튼 위 안내 문구("다시 연습하기를 누르면 …")는 디자인 피드백으로 뺐습니다. 대신 홈 · 다시 연습하기에 아이콘을 붙였습니다.
 * 실패한 리포트의 면접을 찾는 동안에는 "다시 연습하기" 가 잠기는데, 이유가 안 보이면 고장으로 읽혀서 버튼 글자로 알립니다.
 */
export default function ReportActions({ exporter, sessionId, checking = false }: Props) {
  return (
    <Card label="다음 단계" padding="lg">
      <div className="flex flex-col gap-4">
        <nav className="flex flex-wrap gap-3">
          <Button to={ROUTES.HOME} className="flex-1">
            <IconHome size={16} stroke={2} aria-hidden />
            홈으로 이동
          </Button>

          {exporter && <SaveMenu exporter={exporter} />}

          <Button
            variant="primary"
            to={sessionId ? toReplay(sessionId) : ROUTES.SESSION_SETUP}
            disabled={checking}
            className="flex-1"
          >
            <IconArrowBackUp size={16} stroke={2} aria-hidden />
            {checking ? '확인하는 중…' : '다시 연습하기'}
          </Button>
        </nav>

        {exporter?.error && <p className="text-body-sm text-semantic-danger">{exporter.error}</p>}
      </div>
    </Card>
  )
}
