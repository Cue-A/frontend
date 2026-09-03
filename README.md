# Cue&A Frontend

AI 면접 코칭 서비스 Cue&A의 웹 프론트엔드입니다.

- **스택** React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4
- **역할** 면접 연습 화면, 리포트 조회, 백엔드 REST · WebSocket 연동
- **백엔드** 별도 저장소([`Cue-A/backend`](https://github.com/Cue-A/backend))입니다. 이 저장소에는 서버 코드가 없습니다.

> 서비스명은 **Cue&A** 지만 `&` 는 식별자·경로에 쓰기 번거로워
> 저장소는 `frontend`, 패키지명은 `frontend`, 클래스 접두어는 쓰지 않습니다.

문서는 [`docs/`](./docs) 를 보세요. 작업 규칙은 [`docs/01-conventions.md`](./docs/01-conventions.md) 에 있습니다.

---

## 빠른 시작

Node 22 LTS 이상만 있으면 됩니다. 처음이면 [1. 사전 준비](#1-사전-준비) 부터 보세요.

```bash
git clone git@github.com:Cue-A/frontend.git
cd frontend

npm ci          # package-lock.json 그대로 설치
npm run dev     # 개발 서버 기동
```

http://localhost:5173 이 열리면 성공입니다.
**백엔드가 없어도 화면은 뜹니다.** API 를 붙이기 전까지는 정적 화면만 렌더링됩니다.

| 자주 쓰는 명령 | |
|---|---|
| `npm ci` | 의존성 설치 (lock 파일 기준, 재현 가능) |
| `npm install` | 의존성 설치 + lock 갱신 (패키지를 추가할 때만) |
| `npm run dev` | 개발 서버 (HMR, 기본 5173 포트) |
| `npm run build` | 타입 체크(`tsc -b`) + 프로덕션 빌드 → `dist/` |
| `npm run preview` | 빌드 결과를 로컬에서 확인 (기본 4173 포트) |
| `npm run lint` | ESLint 검사 |

---

## 1. 사전 준비

필요한 건 **Node.js 22 LTS 이상** 하나뿐입니다. 이미 깔려 있으면 건너뛰세요.

```bash
node -v    # v22.x 이상이 나오면 OK
npm -v     # v10 이상
```

Vite 8 은 Node 20.19 미만에서 동작하지 않습니다. 버전이 낮으면 아래처럼 올려주세요.

**macOS (Homebrew)**

```bash
brew install node
```

**버전을 여러 개 쓰고 있다면 (nvm)**

```bash
nvm install 22
nvm use 22
```

---

## 2. 개발 서버

```bash
npm run dev
```

- 기본 주소는 http://localhost:5173 입니다.
- 파일을 저장하면 HMR 로 즉시 반영됩니다. 새로고침할 필요 없습니다.
- 포트가 이미 쓰이고 있으면 Vite 가 5174, 5175… 로 알아서 올라갑니다. 터미널에 찍힌 주소를 보세요.
- 같은 네트워크의 휴대폰에서 열어보려면 `npm run dev -- --host` 로 띄우고 터미널에 찍힌 Network 주소를 쓰세요.

멈출 때는 터미널에서 `Ctrl+C` 입니다.

---

## 3. 빌드 · 확인

```bash
npm run build     # tsc -b 로 타입 체크한 뒤 dist/ 에 번들 생성
npm run preview   # dist/ 를 정적 서버로 띄워 확인
```

`npm run build` 는 **타입 에러가 하나라도 있으면 실패합니다.** 개발 서버(`npm run dev`)는
타입 체크를 하지 않고 변환만 하기 때문에, dev 에서 잘 돌아가도 빌드가 깨질 수 있습니다.
PR 을 올리기 전에 `npm run build` 를 한 번 돌려주세요.

---

## 4. 환경 변수

아직 필요한 환경 변수가 없습니다. 백엔드를 붙이면서 추가하게 되면 아래 규칙을 씁니다.

- 파일은 `.env.local` (git 에 올라가지 않음), 공유용 예시는 `.env.example`
- **브라우저로 내려가는 값은 `VITE_` 접두어가 필요합니다.** 접두어가 없으면 Vite 가 주입하지 않습니다.
- 접두어가 붙은 값은 번들에 그대로 박혀 누구나 볼 수 있습니다. **비밀 키를 넣지 마세요.**

```bash
# .env.local 예시
VITE_API_BASE_URL=http://localhost:8080
```

```ts
const baseUrl = import.meta.env.VITE_API_BASE_URL
```

---

## 5. 폴더 구조

```
src/
├── main.tsx          진입점
├── App.tsx           라우트 루트
├── index.css         Tailwind · 폰트 · 디자인 토큰 import
└── styles/
    └── tokens.css    디자인 토큰 (@theme / @utility)
```

도메인 폴더가 늘어날 때의 구조와 파일 네이밍 규칙은
[`docs/01-conventions.md`](./docs/01-conventions.md) 를 따릅니다.

---

## 6. 스타일

Tailwind CSS v4 를 **CSS-first** 방식으로 씁니다. `tailwind.config.js` 는 없습니다.
색·간격·radius 는 직접 값을 쓰지 않고 디자인 토큰 클래스를 씁니다.

```tsx
// 나쁨 — 값이 흩어져서 나중에 한 번에 못 바꿉니다
<div className="bg-[#5345F0] rounded-[20px]">

// 좋음
<div className="bg-primary-500 rounded-lg">
```

토큰 목록과 사용법은 [`docs/design-system.md`](./docs/design-system.md) 에 있습니다.

---

## 7. 작업 흐름

이슈 → 브랜치 → PR 순서로 진행합니다. `main` · `dev` 에 직접 푸시하지 않습니다.

```bash
git switch dev && git pull
git switch -c feat/12-interview-session    # 12 = 이슈 번호
# 작업 + 커밋
git push -u origin feat/12-interview-session
```

PR 의 base 는 **`dev`** 입니다. 자세한 규칙은
[`docs/01-conventions.md`](./docs/01-conventions.md) 를 보세요.
