import { CUSTOM_COMPANY, type Company } from '../types/sessionSetup'

const QUICK_TAGS = ['도전정신', '고객 중심', '수평적 소통', '빠른 실행력']

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
    <section className="flex flex-col gap-4 border p-5">
      <label className="flex items-center justify-between gap-4">
        <span>기업 맞춤 질문</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggle(event.target.checked)}
        />
      </label>

      {enabled && (
        <>
          <p>
            등록된 기업의 인재상 데이터를 질문에 반영합니다. 목록에 없는 기업은 &quot;직접
            입력&quot;을 골라 인재상을 알려주세요.
          </p>

          <label className="flex flex-col gap-2">
            <span>기업</span>
            <select
              value={companyId ?? ''}
              onChange={(event) => onSelectCompany(event.target.value)}
              className="border px-3 py-2"
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
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-2">
                <span>인재상 직접 입력</span>
                <textarea
                  rows={3}
                  value={customCulture}
                  onChange={(event) => onChangeCulture(event.target.value)}
                  placeholder="예: 도전정신, 고객 중심, 수평적 소통, 빠른 실행력 등 이 기업이 중요하게 생각하는 가치를 입력해주세요"
                  className="border px-3 py-2"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => appendTag(tag)}
                    className="border px-3 py-1"
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
