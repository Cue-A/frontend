import { IconFileText } from '@tabler/icons-react'
import { useState } from 'react'

import { formatFileSize } from '@/shared/lib/formatFileSize'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'

import type { SelectedResume } from '../types/sessionSetup'

import ResumePickerDialog from './ResumePickerDialog'

type Props = {
  resume: SelectedResume | null
  onChange: (resume: SelectedResume) => void
}

/** 고른 문서의 둘째 줄. 제목과 파일명이 같으면 파일명은 다시 쓰지 않습니다. */
function describe(resume: SelectedResume) {
  if (resume.fileSize === null) return '직접 작성한 문서'

  // 보관함 목록과 같은 기준으로 씁니다. 따로 두면 같은 문서가 화면마다 다르게 보입니다. (PR #64 리뷰)
  const size = formatFileSize(resume.fileSize)
  return resume.fileName && resume.fileName !== resume.title ? `${resume.fileName} · ${size}` : size
}

/**
 * 자기소개서를 고릅니다. (A-05, 이슈 #54 1-1)
 *
 * **올리지 않고 보관함에서 고릅니다.** 올리기는 내 보관함(C-02)이 합니다. 전에는 여기서
 * 파일 선택창을 열었는데, 세션 시작이 등록된 문서의 id(`documentPublicId`)를 요구해서
 * 파일을 들고 있어도 쓸 데가 없었습니다.
 *
 * 시안은 비었을 때와 골랐을 때의 모양이 다릅니다. 비었을 때는 점선 상자에
 * 채우기를 권하는 문장과 강조 버튼, 골랐을 때는 문서 정보와 보조 버튼입니다.
 */
export default function ResumeField({ resume, onChange }: Props) {
  const [picking, setPicking] = useState(false)

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
              <span className="truncate text-body-md font-semibold text-neutral-900">{resume.title}</span>
              <span className="truncate text-body-sm text-neutral-400">{describe(resume)}</span>
            </span>
          ) : (
            <span className="flex min-w-0 flex-col">
              <span className="text-body-md font-semibold text-neutral-900">아직 불러온 자기소개서가 없어요</span>
              <span className="break-keep text-body-sm text-neutral-400">
                보관함에 등록한 자기소개서를 고르면 맞춤 질문이 더 정확해져요
              </span>
            </span>
          )}
        </span>

        {resume ? (
          <Button size="sm" onClick={() => setPicking(true)} className="shrink-0">
            불러오기/변경
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={() => setPicking(true)} className="shrink-0">
            자기소개서 불러오기
          </Button>
        )}
      </div>

      {/* 열 때마다 새로 그려서 보관함 목록도 새로 받습니다. */}
      {picking && (
        <ResumePickerDialog
          selectedId={resume?.documentId ?? null}
          onSelect={onChange}
          onClose={() => setPicking(false)}
        />
      )}
    </section>
  )
}
