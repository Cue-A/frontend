/**
 * 이메일 · 비밀번호 변경 규칙입니다 (이슈 #201).
 *
 * 비밀번호 규칙은 회원가입과 같은 백엔드 `PasswordPolicy` — 영문 · 숫자를 하나 이상씩 넣어 8~64자입니다. 화면이 먼저 보고
 * 막아서 서버까지 갔다 오지 않게 하고, 서버도 같은 규칙으로 다시 봅니다(`INVALID_PASSWORD_FORMAT`).
 */
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/

/** 비밀번호 칸 아래 안내. 회원가입 오류 문구(`INVALID_PASSWORD_FORMAT`)와 같은 규칙을 적습니다 */
export const PASSWORD_RULE_TEXT = '영문과 숫자를 모두 넣어 8~64자로 만들어 주세요.'

export function isValidPassword(password: string): boolean {
  return PASSWORD_PATTERN.test(password)
}

/**
 * 이메일 · 비밀번호 변경 창의 오류 문구. 대부분 공통 문구(`toUserMessage`)를 쓰고, 현재 비밀번호가 틀린 경우만 바꿉니다 —
 * 공통 문구는 로그인 화면용이라 "이메일 또는 비밀번호가 올바르지 않아요" 인데, 여기서는 이메일을 묻지 않았습니다.
 */
export const CURRENT_PASSWORD_WRONG = '현재 비밀번호가 올바르지 않아요.'
