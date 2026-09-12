import { useRef } from 'react'

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
      <h2 className="flex items-center gap-2">
        자기소개서 불러오기
        <span className="border px-2 py-0.5">필수</span>
      </h2>

      <div className="flex flex-wrap items-center justify-between gap-4 border p-4">
        {resume ? (
          <span className="flex min-w-0 flex-col">
            <span className="truncate">{resume.name}</span>
            <span>{formatSize(resume.size)}</span>
          </span>
        ) : (
          <span>아직 올린 파일이 없어요. PDF 또는 워드 파일을 올려주세요.</span>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="shrink-0 border px-4 py-2"
        >
          {resume ? '불러오기/변경' : '불러오기'}
        </button>
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
