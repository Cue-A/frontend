# Cue&A 디자인 토큰 시스템

> **디자인 토큰이란?** 색상·글자 크기·여백·모서리 둥글기처럼 디자인에서 반복적으로 쓰이는 값에 이름을 붙여 관리하는 것. 코드에 `#5345F0`을 직접 쓰는 대신 `primary-500`이라는 이름을 쓰면, 값이 바뀔 때 정의 한 곳만 고치면 전체에 반영된다.

- **출처(Source of Truth)**: [Figma — Cue&A Design System v1](https://www.figma.com/design/I0WxJBMWiBRVj8AjpeGYEP/%F0%9F%92%AC-Cue-A?node-id=572-563)
- **문서 버전**: 2026-09-01 최초 작성 (Figma 캔버스 "디자인시스템", frame `617:81650`, `954:2008` 기준)
- **구현 상태**: 아직 코드(CSS)로 옮기기 전 단계. 이 문서는 규칙 확정 + 값 정리까지만 다룬다.

---

## 1. 토큰화 규칙

### 1.1 구조: Primitive 단일 계층

토큰 계층을 두 겹(Primitive → Semantic)으로 나누는 방식도 검토했으나, 지금은 **Figma에 있는 값을 그대로 1단계로만** 가져가기로 결정했다.

- **Primitive(원시값)**: Figma 팔레트/스케일의 값 자체. `primary-500 = #5345F0` 처럼 "몇 번째 값인지"만 나타낸다.
- 컴포넌트 코드에서도 이 이름을 **그대로** 쓴다 (예: `bg-primary-500`). "이 색이 브랜드색이다" 같은 역할 이름(`color-brand`)은 따로 만들지 않는다.

**장점**: 구조가 단순하고 Figma와 1:1로 매칭되어 있어 대조하기 쉽다.
**의식적으로 감수하는 단점**: 나중에 브랜드 컬러 전체를 바꾸거나 다크모드를 추가할 때는, `primary-500`이 쓰인 코드 여러 곳을 직접 찾아 고쳐야 한다. 프로젝트가 커지면 역할 기반 별칭(Semantic) 레이어를 다시 검토할 수 있다 (§8 참고).

### 1.2 네이밍 컨벤션

- 전부 kebab-case: `<카테고리>-<이름>-<단계>`
- **Figma의 레이어/토큰 이름을 그대로 가져온다** (`primary-500`, `radius-lg`, `text-h1` 등). 이름을 재창작하지 않는 이유: 디자이너가 Figma에서 "primary-500 바꿨어요"라고 말했을 때 코드에서 검색 한 번으로 찾을 수 있어야 하기 때문.
- 각 토큰의 "용도" 설명(Figma 카드에 적힌 문구)은 별도 토큰으로 만들지 않고, 이 문서의 참고 설명으로만 남긴다 — 실제로 코드에서 그 색/크기를 쓸 위치를 고를 때 참고용.
- 표에 있는 Figma 값과 문서 내용이 달라 보이면, 문서보다 Figma가 항상 우선한다 → 이 문서를 다시 동기화한다.

### 1.3 구현 위치 (다음 단계 예고)

이 프로젝트는 Tailwind v4 (CSS-first, `tailwind.config.js` 없음)를 쓴다. 다음 단계에서 실제 구현할 때는:

- 모든 토큰을 `@theme { ... }` 블록 안 CSS 커스텀 프로퍼티로 선언 (예: `src/styles/tokens.css`, `src/index.css`에서 import)
- Tailwind가 `--color-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--font-*` 네임스페이스를 자동으로 유틸리티 클래스(`bg-primary-500`, `text-h1`, `rounded-lg`, `shadow-card`)로 변환해준다.
- **Tailwind 기본값과 겹치면 새로 만들지 않는다.** 예: spacing 스케일은 이미 Tailwind 기본값과 일치하므로(§5) 커스텀 토큰이 필요 없다. radius·폰트 크기·색상은 Figma 값이 Tailwind 기본과 달라 오버라이드가 필요하다(§2~§4).

### 1.4 아직 정해지지 않은 것

임의로 채우지 않고 열어둔다.

- **다크모드**: Figma 파일에 다크 변형이 없다. 다크 팔레트는 별도 논의 필요. (PR #1 리뷰: MVP 기능 개발 이후로 미룸)
- **타이포그래피 이름 유사**: `text-body-md`(14px)와 `text-body`(13px)처럼 이름이 비슷한 토큰이 있다 (§3.3). 랜딩 전용이면 `text-landing-body`처럼 접두어로 구분 — 프론트 팀 상의 + 피그마 디자인 시스템 선수정 후 리팩토링 예정.

---

## 2. Color Tokens

*출처: Figma frame `617:81655` "01 Color", `954:2008` "Cue&A 뱃지 디자인"*

### 2.1 Primary

| 토큰 | HEX | 용도(Figma 원문) |
|---|---|---|
| `primary-100` | `#E4E1FE` | 연한 배경 · 선택 상태 |
| `primary-200` | `#C9C3FC` | 보더 · 비활성 배경 |
| `primary-400` | `#827AE1` | 그라디언트 시작 |
| `primary-500` (Base) | `#5345F0` | 기본 브랜드 · CTA |
| `primary-600` (Hover) | `#4436D4` | 버튼 Hover |
| `primary-700` (Pressed) | `#3529AB` | 버튼 Pressed |
| `gradient-brand` | `linear-gradient(90deg, #827AE1 0%, #5345F0 100%)` | CTA 그라디언트 |

### 2.2 Neutral

| 토큰 | HEX | 용도(Figma 원문) |
|---|---|---|
| `neutral-0` (Card) | `#FFFFFF` | 카드 · 모달 배경 |
| `neutral-50` (Page BG) | `#F6F7FA` | 페이지 전체 배경 |
| `neutral-200` (Divider) | `#E5E5EA` | 구분선 · 얕은 경계 |
| `neutral-300` (Border) | `#D4D4DA` | 테두리 · 비활성 버튼 |
| `neutral-400` (Icon) | `#A8A8B3` | 아이콘 · placeholder |
| `neutral-500` (Text Sub) | `#70707B` | 보조 텍스트 · 캡션 |
| `neutral-700` | `#46464F` | 중간 강도 텍스트 |
| `neutral-900` (Text Strong) | `#26262B` | 제목 · 본문 기본색 |

### 2.3 Semantic

| 토큰 | HEX | 용도(Figma 원문) |
|---|---|---|
| `semantic-danger` | `#FF383C` | 녹화 중 · 실패 · D-day |
| `semantic-success` | `#34C759` | 완료 상태 · 고득점 |
| `semantic-info` | `#0088FF` | 안내 메시지 · 정보 배지 |
| `semantic-warning` | `#FF9500` | 주의 · 환경품질 fair |

### 2.4 배지(Badge) 색상 — 컴포넌트 전용 팔레트

*출처: Figma frame `954:2008`, "04 · 컬러 스펙"*

배지는 위 팔레트와 별개로 **"메인 색(solid) + 동일 색상의 20% 배경 + 진한 텍스트"** 3색 규칙을 쓴다. 값은 primary/semantic과 완전히 동일하므로, 배지 내용(slug)이 아닌 **의미(semantic) 5종**으로 토큰화한다 — 배지 종류가 늘어도 토큰 수는 늘지 않는다 (PR #1 리뷰 반영).

| 토큰 | 메인(solid) | 배경(20% 톤) | 칩 텍스트 | 적용 예 |
|---|---|---|---|---|
| `badge-brand` | `#5345F0` | `#E4E1FE` | `#3529AB` | 첫 연습 |
| `badge-warning` | `#FF9500` | `#FFEEDA` | `#B36800` | 3일 연속 |
| `badge-danger` | `#FF383C` | `#FFE1E2` | `#C41E22` | 압박 극복 |
| `badge-info` | `#0088FF` | `#D6EBFF` | `#0066CC` | 우상향 |
| `badge-success` | `#34C759` | `#DEF5E4` | `#1E7E38` | 10회 달성 |

> 열려있는 결정: 이 3색을 매번 하드코딩할지, "메인 색 → 20% 배경 → 진한 텍스트"를 계산하는 공식(`color-mix()` 등)으로 만들지는 배지 종류가 더 늘어날 때 다시 판단.

---

## 3. Typography Tokens

*출처: Figma frame `617:81701` "02 Typography"*

### 3.1 폰트 패밀리 & 굵기

- 폰트: **Pretendard Variable** (가변 폰트, 굵기는 font-weight 숫자로 조절)
- 굵기 매핑은 Tailwind 기본값을 그대로 재사용 (커스텀 불필요)

| Figma 굵기 | Tailwind 유틸리티 | weight |
|---|---|---|
| Regular | `font-normal` | 400 |
| SemiBold | `font-semibold` | 600 |
| Bold | `font-bold` | 700 |

### 3.2 핵심 스케일 (코어 시스템)

| 토큰 | 크기 | 굵기 | 줄높이(px · 배율) | 용도(Figma 원문) |
|---|---|---|---|---|
| `text-display` | 30px | Bold | 39 · 1.3 | 홈 인사말, 대시보드 강조 숫자 |
| `text-h1` | 24px | Bold | 31 · 1.29 | 화면 제목 (홈, 면접 연습) |
| `text-h2` | 18px | SemiBold | 25 · 1.39 | 섹션 제목, 질문 카드 텍스트 |
| `text-body-lg` | 16px | SemiBold | 24 · 1.5 | 버튼 라벨, 강조 본문 |
| `text-body-md` | 14px | Regular | 21 · 1.5 | 기본 본문, 리스트 항목, 네비게이션 |
| `text-body-sm` | 12px | Regular | 18 · 1.5 | 보조 설명, 타임스탬프, 배지 텍스트 |
| `text-micro` | 11px | Regular | 16.5 · 1.5 | 이메일, 최소 메타 정보 |

### 3.3 랜딩 확장 세트 ⚠️

Figma 상 위 코어 세트와 pill 색이 달라(주황·핑크·파랑) 별도 그룹으로 추가된 것으로 보인다. 코어 세트와 섞이지 않도록 **랜딩 페이지 전용**으로 구분해서 문서화한다.

| 토큰 | 크기 | 굵기 | 줄높이(px · 배율) | 용도(Figma 원문) |
|---|---|---|---|---|
| `text-body` | 13px | Regular | 20 · 1.54 | 카드 설명, 랜딩 보조 문구 |
| `text-subtitle` | 15px | SemiBold | 23 · 1.53 | 랜딩 스텝 소제목 |
| `text-stat` | 17px | Bold | 22 · 1.29 | 리포트 타임라인 수치, 짧은 라벨 |

> ⚠️ **이름 유사 주의**: `text-body-md`(14px, 기본 본문)와 `text-body`(13px, 랜딩 전용)는 이름이 매우 비슷하다. 코드를 작성할 때 반드시 어느 세트(코어/랜딩)에서 쓰는 텍스트인지 확인하고 정확한 토큰을 골라야 한다.

---

## 4. Radius Tokens

*출처: Figma frame `617:81711`, "Radius — 기존 9종(5·7·8·10·12·14·20·26·28)을 5단계로 축소"*

Tailwind 기본 radius 스케일과 값이 달라 **오버라이드가 필요**하다.

| 토큰 | 값 | 용도(Figma 원문) |
|---|---|---|
| `radius-xs` | 6px | 체크박스, 소형 태그 |
| `radius-sm` | 10px | 버튼, 입력창, 리스트 행 |
| `radius-md` | 14px | 사이드바 Nav 슬롯 |
| `radius-lg` | 20px | 카드, 모달, CTA 필 |
| `radius-full` | 999px | 칩, 배지, 아바타 |

---

## 5. Spacing Tokens

*출처: Figma frame `617:81711`, "Spacing — 4의 배수 고정"*

전체 스케일: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64` (4px 배수 고정)

이 값은 **Tailwind 기본 spacing 스케일(4px 기준)과 정확히 일치**한다. 즉 커스텀 토큰을 새로 정의할 필요 없이 Tailwind 기본 숫자 클래스를 그대로 쓰면 된다. 아래는 Figma 이름 ↔ Tailwind 클래스 대응표(참고용).

| Figma 토큰 | px | Tailwind 클래스 숫자 |
|---|---|---|
| `space-4` | 4px | `-1` (예: `p-1`) |
| `space-8` | 8px | `-2` |
| (12px) | 12px | `-3` |
| `space-16` | 16px | `-4` |
| (20px) | 20px | `-5` |
| `space-24` | 24px | `-6` |
| (32px) | 32px | `-8` |
| `space-40` | 40px | `-10` |
| (48px) | 48px | `-12` |
| `space-64` | 64px | `-16` |

**용도 스펙(Figma 원문)**: 카드 내부 padding 20~24 · 카드 사이 간격 20 · 섹션 사이 간격 40 · 페이지 좌우 여백 48

---

## 6. Elevation (Shadow) Tokens

*출처: Figma frame `617:81711`, "Elevation — 신버전은 stroke 대신 그림자 사용"*

| 토큰 | 값 | 용도(Figma 원문) |
|---|---|---|
| `elevation-card` | `0px 2px 8px rgba(38,38,43,0.06)` | 기본 카드 |
| `elevation-float` | `0px 8px 24px rgba(38,38,43,0.10)` | 모달, 드롭다운 |

---

## 7. 참고: 배지 컴포넌트 스펙 (토큰 아님)

*출처: Figma frame `954:2008`*

토큰은 아니지만 배지 컴포넌트를 만들 때 필요한 고정 치수.

- 원형 지름 84px · 내부 원 58px · 아이콘 27px
- 칩 높이 30px / radius 15px
- 아이콘: Tabler outline, stroke-width 2
- 폰트: Pretendard Variable 적용 예정

---

## 8. 사용법 (구현 완료)

`src/styles/tokens.css`에 Tailwind v4 `@theme` / `@utility`로 구현되어 있고, `src/index.css`에서 import되어 있어 별도 설정 없이 바로 쓸 수 있다.

```tsx
// 색상 · radius · elevation은 §1.2 네이밍 그대로 클래스명이 된다
<div className="bg-primary-500 text-neutral-0 rounded-lg shadow-card p-6">
  {/* 타이포는 크기+굵기+줄높이가 묶인 완성형 클래스 */}
  <p className="text-h1">화면 제목</p>
  <p className="text-body-md text-neutral-500">기본 본문 텍스트</p>
</div>

// 배지: main/bg/text 3색 + radius-full (의미 5종 중 하나를 고른다)
<span className="w-fit rounded-full bg-badge-warning-bg px-3 py-1 text-body-sm text-badge-warning-text">
  3일 연속
</span>

// 그라디언트는 CSS 변수라 arbitrary value 문법으로 사용
<div className="bg-[image:var(--gradient-brand)] rounded-lg h-24" />
```

- 여백(padding/gap/margin)은 커스텀 토큰이 없다 — §5에서 설명했듯 Tailwind 기본 spacing 숫자(`p-6`, `gap-5` 등)를 그대로 쓰면 Figma 스펙과 맞다.
- 새 배지가 추가되면 새 토큰을 만들지 말고 `badge-brand/warning/danger/info/success` 5종 중 의미가 맞는 것을 그대로 재사용한다 (§2.4 참고).

---

## 9. 다음 단계

CSS 구현(`src/styles/tokens.css`)과 Figma 값 대조·실제 렌더링 검증까지는 완료된 상태. 남은 일:

1. §1.4의 열린 질문(다크모드 부재, `text-body-md`/`text-body` 이름 유사)을 디자이너·프론트 팀과 확인
2. 프로젝트가 커져서 "이 색이 왜 여기 쓰였는지" 추적이 어려워지면, §1.1에서 미룬 Semantic 별칭 레이어 도입을 다시 검토

> `neutral-1000` 삭제, 배지 토큰의 slug→semantic 리네이밍(`first-practice`→`badge-brand` 등)은 PR #1 리뷰 반영 완료.
