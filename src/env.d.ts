/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 REST 기본 주소. 예) https://api.cue-a.example */
  readonly VITE_API_BASE_URL: string
  /** "true" 면 실제 API 대신 목업 응답을 씁니다. */
  readonly VITE_USE_MOCK: string
  /**
   * 카카오 로그인(AUTH-2) REST API Key. 인가 URL 의 client_id 로 그대로 노출되는
   * 값이라 공개되어도 됩니다. 숨겨야 하는 Client Secret 은 백엔드에만 있습니다.
   */
  readonly VITE_KAKAO_REST_API_KEY: string
  /**
   * 카카오가 인가 코드를 돌려보낼 콜백 주소. 로컬 · 배포 주소가 달라서
   * 하드코딩하면 배포에서 로컬 주소로 돌아가려다 실패합니다. 카카오에 등록된
   * 주소와 글자 하나까지 같아야 합니다.
   */
  readonly VITE_KAKAO_REDIRECT_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
