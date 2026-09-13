import { IconFileText } from '@tabler/icons-react'
import { useRef } from 'react'

import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'

import type { ResumeFile } from '../types/sessionSetup'

type Props = {
  resume: ResumeFile | null
  onChange: (resume: ResumeFile) => void
}

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)}MB`

  const kb = Math.max(1, Math.round(bytes / 1024))
  return `${kb}KB`
}

/**
 * 자기소개서를 고릅니다. (A-05)
 *
 * 아직 서버로 올리지는 않습니다. 업로드 방식(따로 올리고 id 를 넘기는지,
 * 세션 생성에 함께 보내는지)이 정해지지 않았습니다. 지금은 고른 파일을
 * 화면에 보여주는 데까지만 합니다.
 *
 * 시안은 비었을 때와 골랐을 때의 모양이 다릅니다. 비었을 때는 점선 상자에
 * 채우기를 권하는 문장과 강조 버튼, 골랐을 때는 파일 정보와 보조 버튼입니다.
 *
 * 파일 선택 버튼은 브라우저 기본 모양을 숨기고 직접 만든 버튼으로 엽니다.
 */
export default function ResumeField({ resume, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const openPicker = () => inputRef.current?.click()

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-body-lg font-semibold text-neutral-900">
        자기소개서 불러오기
        <Badge tone="danger">필수</Badge>
      </h2>

      <div
        className={
          'flex flex-wrap items-center justify-between gap-4 rounded-sm p-4 ' +
          (resume ? 'bg-neutral-50' : 'border border-dashed border-neutral-300')
        }
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-neutral-200 text-neutral-500"
          >
            <IconFileText size={20} stroke={2} />
          </span>

          {resume ? (
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-body-md font-semibold text-neutral-900">
                {resume.name}
              </span>
              <span className="text-body-sm text-neutral-400">{formatSize(resume.size)}</span>
            </span>
          ) : (
            <span className="flex min-w-0 flex-col">
              <span className="text-body-md font-semibold text-neutral-900">
                아직 불러온 자기소개서가 없어요
              </span>
              <span className="text-body-sm text-neutral-400">
                자소서를 불러오면 맞춤 질문이 더 정확해져요
              </span>
            </span>
          )}
        </span>

        {resume ? (
          <Button size="sm" onClick={openPicker} className="shrink-0">
            불러오기/변경
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={openPicker} className="shrink-0">
            자기소개서 불러오기
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onChange({ name: file.name, size: file.size })

          // 같은 파일을 다시 골라도 change 가 뜨도록 비워둡니다.
          event.target.value = ''
        }}
      />
    </section>
  )
}
