import { Link } from 'react-router-dom'
import { ROUTES } from './routes'

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md p-6">
      <h1>페이지를 찾을 수 없어요</h1>
      <Link className="mt-4 inline-block underline" to={ROUTES.LANDING}>
        처음으로 돌아가기
      </Link>
    </section>
  )
}
