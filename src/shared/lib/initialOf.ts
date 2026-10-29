/**
 * 닉네임 첫 글자. 프로필 사진 필드가 없어서 원 안에 이 글자를 씁니다.
 * 한글 · 영문 모두 한 글자로 자릅니다(서로게이트 쌍도 한 글자로 셉니다).
 */
export function initialOf(nickname: string) {
  return Array.from(nickname.trim())[0]?.toUpperCase() ?? ''
}
