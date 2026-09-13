import { useRef } from 'react'

import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

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
 * 파일 선택 버튼은 브라우저 기본 모양을 숨기고 직접 만든 버튼으로 엽니다.
 */
export default function ResumeField({ resume, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-body-lg text-neutral-900">
        자기소개서 불러오기
        <Badge tone="brand">필수</Badge>
      </h2>

      <Card padding="sm" className="flex flex-wrap items-center justify-between gap-4">
        {resume ? (
          <span className="flex min-w-0 items-center gap-3">
            {/* 시안의 파일 썸네일 자리입니다. 미리보기는 파싱이 붙은 뒤에 채웁니다. */}
            <span aria-hidden className="h-10 w-10 shrink-0 rounded-sm bg-neutral-200" />

            <span className="flex min-w-0 flex-col">
              <span className="truncate text-body-md text-neutral-900">{resume.name}</span>
              <span className="text-body-sm text-neutral-400">{formatSize(resume.size)}</span>
            </span>
          </span>
        ) : (
          <span className="text-body-md text-neutral-500">
            아직 올린 파일이 없어요. PDF 또는 워드 파일을 올려주세요.
          </span>
        )}

        <Button size="sm" onClick={() => inputRef.current?.click()} className="shrink-0">
          {resume ? '불러오기/변경' : '불러오기'}
        </Button>
      </Card>

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
