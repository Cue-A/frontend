import { ROUTES } from '@/app/routes'
import Button from '@/shared/ui/Button'
import Logo from '@/shared/ui/Logo'

import { CLOSING_CTA, COPYRIGHT, FOOTER_LINKS } from '../lib/landingContent'

/**
 * 마지막 CTA 와 푸터입니다. (A-01)
 *
 * 약관·개인정보처리방침 페이지는 아직 없어서 링크를 걸지 않았습니다.
 * 갈 곳 없는 링크를 걸면 눌렀을 때 404 가 뜹니다. 페이지가 생기면 연결합니다.
 */
export default function LandingFooter() {
  return (
    <>
      <section className="flex flex-col items-center gap-4 bg-neutral-50 px-6 py-24 text-center">
        <h2 className="text-h1 text-neutral-900">{CLOSING_CTA.title}</h2>
        <p className="text-body-lg font-normal text-neutral-500">{CLOSING_CTA.description}</p>

        <Button variant="primary" size="lg" to={ROUTES.LOGIN} className="mt-4">
          {CLOSING_CTA.action}
        </Button>
      </section>

      {/* 시안에서 푸터는 흰 바탕입니다. 위의 회색 CTA 띠와 붙지 않게 여백을 두고,
          구분선 하나로 내용을 받습니다. */}
      <div className="bg-neutral-0 pt-20">
        <footer className="mx-auto flex max-w-6xl flex-col items-center gap-4 border-t border-neutral-200 px-6 py-12 text-center">
          <Logo className="h-8" />

          <ul className="flex flex-wrap justify-center gap-6">
            {FOOTER_LINKS.map((label) => (
              <li key={label} className="text-body-md text-neutral-500">
                {label}
              </li>
            ))}
          </ul>

          <p className="text-body-sm text-neutral-400">{COPYRIGHT}</p>
        </footer>
      </div>
    </>
  )
}
