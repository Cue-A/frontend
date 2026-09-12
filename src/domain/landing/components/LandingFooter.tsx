import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'

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
      <section className="flex flex-col items-center gap-4 border-t px-6 py-16 text-center">
        <h2>{CLOSING_CTA.title}</h2>
        <p>{CLOSING_CTA.description}</p>

        <Link to={ROUTES.LOGIN} className="border px-6 py-3">
          {CLOSING_CTA.action}
        </Link>
      </section>

      <footer className="flex flex-col items-center gap-3 border-t px-6 py-10 text-center">
        <p>Cue&amp;A</p>

        <ul className="flex flex-wrap justify-center gap-4">
          {FOOTER_LINKS.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>

        <p>{COPYRIGHT}</p>
      </footer>
    </>
  )
}
