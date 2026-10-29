import Switch from '@/shared/ui/Switch'

import { CUSTOM_COMPANY, type Company } from '../types/sessionSetup'

const QUICK_TAGS = ['도전정신', '고객 중심', '수평적 소통', '빠른 실행력']

/** 셀렉트 · 입력칸 모양은 한 곳에서 정합니다. */
const FIELD_CLASS =
  'rounded-sm border border-neutral-200 bg-neutral-0 px-4 py-3 text-body-md text-neutral-900'

type Props = {
  enabled: boolean
  companies: Company[]
  companyId: string | null
  customCulture: string
  onToggle: (enabled: boolean) => void
  onSelectCompany: (companyId: string) => void
  onChangeCulture: (culture: string) => void
}

/**
 * 기업 맞춤 질문입니다. (A-05)
 *
 * 목록에 없는 기업이면 "직접 입력"을 고르고 인재상을 직접 받습니다.
 * 그 입력칸은 직접 입력을 골랐을 때만 보여줍니다. 켜지지도 않은 칸이
 * 계속 떠 있으면 뭘 채워야 하는지 헷갈립니다.
 *
 * 시안은 기업명을 입력칸 하나로 받지만, API 명세의 CMP-10(미등록 기업
 * 인재상 직접 입력)이 살아 있어서 기업 선택 + 직접 입력을 그대로 둡니다.
 */
export default function CompanyQuestionSection({
  enabled,
  companies,
  companyId,
  customCulture,
  onToggle,
  onSelectCompany,
  onChangeCulture,
}: Props) {
  const isCustom = companyId === CUSTOM_COMPANY

  const appendTag = (tag: string) => {
    const next = customCulture.trim() ? `${customCulture.trim()}, ${tag}` : tag
    onChangeCulture(next)
  }

  return (
    <section
      aria-label="기업 맞춤 질문"
      className="flex flex-col gap-4 rounded-sm bg-neutral-50 p-5"
    >
      <Switch checked={enabled} onChange={onToggle} labelFirst className="gap-4">
        <span className="text-body-lg font-semibold text-neutral-900">기업 맞춤 질문</span>
      </Switch>

      {enabled && (
        <>
          <p className="text-body-md text-neutral-500">
            약 30개 기업의 인재상 데이터가 등록되어 있어요. 목록에 없는 기업은 &quot;직접
            입력&quot;을 선택해 인재상을 알려주세요.
          </p>

          <label className="flex flex-col gap-2">
            <span className="text-body-md text-neutral-700">기업 선택</span>
            <select
              value={companyId ?? ''}
              onChange={(event) => onSelectCompany(event.target.value)}
              className={FIELD_CLASS}
            >
              <option value="" disabled>
                기업을 골라주세요
              </option>

              {companies.map((company) => (
                <option key={company.companyId} value={company.companyId}>
                  {company.name}
                </option>
              ))}

              <option value={CUSTOM_COMPANY}>직접 입력 (목록에 없는 기업)</option>
            </select>
          </label>

          {isCustom && (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-body-md text-neutral-700">인재상 직접 입력</span>
                <textarea
                  rows={3}
                  value={customCulture}
                  onChange={(event) => onChangeCulture(event.target.value)}
                  placeholder="예: 도전정신, 고객 중심, 수평적 소통, 빠른 실행력 등 이 기업이 중요하게 생각하는 가치를 입력해주세요"
                  className={FIELD_CLASS}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => appendTag(tag)}
                    className="rounded-full border border-primary-200 bg-neutral-0 px-3 py-1 text-body-sm text-primary-600 transition-colors hover:bg-primary-100"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
