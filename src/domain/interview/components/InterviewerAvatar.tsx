import { AVATAR_INK, AVATAR_WHITE, type AvatarPreset } from '../lib/interviewerAvatars'

type Props = {
  preset: AvatarPreset
  /** 입이 벌어지는 정도(0~1). 볼륨에 비례한다. */
  mouthOpen: number
  /** 답변 제출 후 다음 질문을 기다리는 동안 true — 고개를 끄덕인다. */
  isNodding: boolean
  /** 압박 면접관: 웃는 입 대신 웃지 않는 입(살짝 처진 일자)으로 그린다. */
  isStern: boolean
}

const BAR = 'transform-fill origin-center'

/** 얼굴 윤곽. 긴 머리(C)는 이마가 뾰족한 아치형이라 윗선이 다르다. */
const FACE_PATH = 'M58 90 C58 58 78 44 100 44 C122 44 142 58 142 90 C142 120 124 141 100 141 C76 141 58 120 58 90Z'
const FACE_PATH_LONG = 'M57 92 C57 74 84 52 100 50 C116 52 143 74 143 92 C143 122 124 141 100 141 C76 141 57 122 57 92Z'

function Hair({ preset }: { preset: AvatarPreset }) {
  if (preset.hairStyle === 'bun') {
    return (
      <g fill={preset.hair}>
        <circle cx="100" cy="27" r="15" />
        <path d="M53 90 C49 56 70 38 100 38 C130 38 151 56 147 90 L142 88 C140 70 122 57 100 57 C78 57 60 70 58 88Z" />
      </g>
    )
  }

  return (
    <path
      fill={preset.hair}
      d="M54 94 C48 60 64 30 100 29 C140 29 152 62 146 94 L143 95 C141 83 138 74 134 65 C112 63 88 58 70 51 C66 64 62 82 57 95Z"
    />
  )
}

function Beard({ color }: { color: string }) {
  return (
    <g fill={color}>
      {/* 턱수염: 양 볼에서 턱으로 이어지는 U자 띠. 입 둘레는 피부가 보이게 비워 둔다 */}
      <path d="M58 94 C57 128 78 150 100 150 C122 150 143 128 142 94 L135 100 C135 114 126 125 118 128 C112 133 88 133 82 128 C74 125 65 114 65 100Z" />
      {/* 콧수염: 턱수염과 떨어진 별도 모양 */}
      <path d="M80 113 C85 106 94 108 100 111 C106 108 115 106 120 113 C115 117 107 114 100 115 C93 114 85 117 80 113Z" />
    </g>
  )
}

/**
 * 면접관 아바타(SVG). 이미지 파일 없이 도형으로만 그려서 로딩이 0 이다.
 * 움직임: 호흡(body) · 눈 깜빡임(eye) · 입(볼륨 비례) · 대기 중 끄덕임(head).
 * 깜빡임·호흡·끄덕임은 motion-safe 라서 기기에서 "동작 줄이기"를 켠 사용자에겐 돌지 않는다.
 */
export default function InterviewerAvatar({ preset, mouthOpen, isNodding, isStern }: Props) {
  const open = Math.min(1, Math.max(0, mouthOpen))
  const isLong = preset.hairStyle === 'long'
  // 거의 닫힌 값에서는 타원이 가는 줄로 깜빡이지 않게, 웃는 선으로 되돌린다.
  const isTalking = open >= 0.08
  const blinkStyle = { animationDelay: `${preset.blinkDelaySec}s` }

  return (
    // 바탕 원 없이 흉상만 그린다. 머리·어깨 둘레의 빈 여백을 잘라낸 viewBox 라서 같은 폭에서 더 크게 보이고,
    // 어깨는 양옆이 둥글게 떨어져 viewBox 옆면에 닿지 않고, 몸통은 아래쪽 끝에서만 평평하게 잘린다(질문 카드 위에 얹힌다).
    <svg viewBox="20 8 160 192" role="img" aria-label="면접관 아바타" className="h-auto w-full">
      <g className="motion-safe:animate-avatar-breathe">
        {/* 긴 머리 뒷자락: 몸통보다 뒤에 둔다 */}
        {isLong && (
          <path
            fill={preset.hair}
            d="M100 25 C66 25 42 48 42 92 L40 168 C52 176 64 172 74 160 L126 160 C136 172 148 176 160 168 L158 92 C158 48 134 25 100 25Z"
          />
        )}

        {/* 몸통 · 목 · 셔츠 깃 */}
        <path fill={preset.shirt} d="M28 214 L28 194 C28 174 50 162 78 154 L100 174 L122 154 C150 162 172 174 172 194 L172 214Z" />
        <rect x="87" y="126" width="26" height="36" fill={preset.skin} />
        <path d="M86 153 L114 153 L100 176Z" fill={preset.skin} />
        <path d="M78 154 L86 152 L100 176 L89 188Z" fill={AVATAR_WHITE} />
        <path d="M122 154 L114 152 L100 176 L111 188Z" fill={AVATAR_WHITE} />

        {/* 머리: 끄덕임은 기울임 없이 위아래로만 움직인다 */}
        <g className={isNodding ? 'motion-safe:animate-avatar-nod' : undefined}>
          <ellipse cx="100" cy="138" rx="15" ry="5" fill={preset.skinShade} />

          {/* 귀 */}
          <ellipse cx="54" cy="96" rx="5" ry="8.5" fill={preset.skin} />
          <ellipse cx="55" cy="96" rx="2" ry="5" fill={preset.skinShade} />
          <ellipse cx="146" cy="96" rx="5" ry="8.5" fill={preset.skin} />
          <ellipse cx="145" cy="96" rx="2" ry="5" fill={preset.skinShade} />

          <path d={isLong ? FACE_PATH_LONG : FACE_PATH} fill={preset.skin} />
          {/* 앞머리 가르마 선 아래 이마: 얼굴 윤곽과 머리카락 사이에 바탕이 비치는 틈을 메운다 */}
          {preset.hairStyle === 'short' && <path d="M62 92 L64 50 L138 62 L140 92Z" fill={preset.skin} />}

          {preset.beard && <Beard color={preset.hair} />}

          {/* 눈썹 · 코 */}
          <g fill="none" stroke={preset.hair} strokeWidth="3" strokeLinecap="round">
            <path d="M74 82 Q83 75 93 80" />
            <path d="M107 80 Q117 75 126 82" />
          </g>
          <path d="M100 100 Q96 106 100 110" fill="none" stroke={preset.skinShade} strokeWidth="2" strokeLinecap="round" />

          {/* 눈: 두 눈을 한 그룹으로 묶어 애니메이션 하나로 깜빡인다. 눈마다 따로 돌리면 한쪽씩 감길 수 있다. */}
          <g className={`${BAR} motion-safe:animate-avatar-blink`} style={blinkStyle}>
            <ellipse cx="83" cy="95" rx="4.4" ry="5.6" fill={AVATAR_INK} />
            <circle cx="84.6" cy="92.8" r="1.3" fill={AVATAR_WHITE} />
            <ellipse cx="117" cy="95" rx="4.4" ry="5.6" fill={AVATAR_INK} />
            <circle cx="118.6" cy="92.8" r="1.3" fill={AVATAR_WHITE} />
          </g>

          {/* 입: 평소엔 웃는 선(압박 면접관은 웃지 않는 선), 말할 땐 타원의 높이가 볼륨에 따라 커졌다 작아진다. */}
          <path
            d={isStern ? 'M90 121 Q100 119 110 121' : 'M88 118 Q100 126 112 118'}
            fill="none"
            stroke={AVATAR_INK}
            strokeWidth="3"
            strokeLinecap="round"
            style={{ opacity: isTalking ? 0 : 1 }}
          />
          <ellipse
            cx="100"
            cy="122"
            rx="7"
            ry="6"
            fill={AVATAR_INK}
            className="transform-fill origin-center transition-transform duration-75"
            style={{ transform: `scaleY(${open})`, opacity: isTalking ? 1 : 0 }}
          />

          {/* 안경 */}
          {preset.glasses && (
            <g fill="none" stroke={AVATAR_INK} strokeWidth="3" strokeLinecap="round">
              <rect x="67" y="82" width="29" height="26" rx="10" />
              <rect x="104" y="82" width="29" height="26" rx="10" />
              <path d="M96 90 Q100 87 104 90" />
              <path d="M67 89 L56 87" />
              <path d="M133 89 L144 87" />
            </g>
          )}

          <Hair preset={preset} />
        </g>
      </g>
    </svg>
  )
}
