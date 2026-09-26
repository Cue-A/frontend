import { toUserMessage } from '@/shared/api/errorMessage'

/**
 * 세션 시작(`POST /api/interviews`)이 실패했을 때 A-05 에 보여줄 문구입니다.
 *
 * `UNSUPPORTED_FILE_FORMAT` 은 공통으로는 "지원하지 않는 파일 형식" 이지만, 세션 시작에서는 뜻이 다릅니다.
 * 백엔드는 AI 가 읽을 파일 사본이 없는 문서를 이 코드로 거절하는데(`InterviewStartService`), 그런 문서는
 * **직접 작성 문서를 S3 에 사본으로 올리기 전(Cue-A/backend#39)에 만든 것뿐**입니다. 목록 응답에 그걸 구분할
 * 값이 없어서 고를 때 미리 막지 못하고, 누른 뒤에 여기서 이유와 할 일을 알려줍니다.
 *
 * 공통 매핑에 화면별 덮어쓰기가 들어오면(PR #70) `toUserMessage(code, SESSION_START_MESSAGES)` 로 바꿉니다.
 */
const SESSION_START_MESSAGES: Partial<Record<string, string>> = {
  UNSUPPORTED_FILE_FORMAT: '이 문서는 면접에 쓸 수 없어요. 보관함에서 같은 내용으로 새로 작성해 주세요.',
}

export function sessionStartErrorMessage(code: string): string {
  return SESSION_START_MESSAGES[code] ?? toUserMessage(code)
}
