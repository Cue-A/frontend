/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 REST 기본 주소. 예) https://api.cue-a.example */
  readonly VITE_API_BASE_URL: string
  /** "true" 면 실제 API 대신 목업 응답을 씁니다. */
  readonly VITE_USE_MOCK: string
  /**
   * 목업을 켜둔 채로 실제 서버에 보낼 도메인 목록입니다. 쉼표로 구분합니다.
   * 예) `"auth,users"` · `"auth,users,interview-sessions"`
   */
  readonly VITE_REAL_APIS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
