type Variant = 'wordmark' | 'mark'

/**
 * 파일은 `public/` 에 있습니다. Figma 의 로고 레이어가 벡터가 아니라 이미지라서
 * SVG 로 내보내도 안에 PNG 가 박혀 나옵니다. 그래서 PNG 를 그대로 씁니다.
 * 나중에 벡터 로고를 받으면 이 파일의 경로만 바꾸면 됩니다.
 */
const SOURCE: Record<Variant, { src: string; alt: string }> = {
  wordmark: { src: '/logo.png', alt: 'Cue&A' },
  mark: { src: '/logo-mark.png', alt: 'Cue&A' },
}

type Props = {
  variant?: Variant
  /** 레이아웃만 넣어주세요 (h-8, w-10 같은 것) */
  className?: string
}

/**
 * 서비스 로고입니다.
 *
 * 글자까지 들어간 `wordmark` 와 심볼만 있는 `mark` 두 가지입니다.
 * 사이드바 아이콘 레일이나 분석 중 화면의 도는 원처럼 좁은 자리에는
 * 글자가 들어갈 공간이 없어서 `mark` 를 씁니다.
 */
export default function Logo({ variant = 'wordmark', className = '' }: Props) {
  const { src, alt } = SOURCE[variant]

  return <img src={src} alt={alt} className={className} />
}
