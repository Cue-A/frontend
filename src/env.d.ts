/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 REST 기본 주소. 예) https://api.cue-a.example */
  readonly VITE_API_BASE_URL: string
  /** "true" 면 실제 API 대신 목업 응답을 씁니다. */
  readonly VITE_USE_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
