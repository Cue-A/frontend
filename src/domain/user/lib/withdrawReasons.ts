import type { WithdrawReason } from '../types/user'

/**
 * 탈퇴 이유 목록입니다. (프레시코드 · 당근 탈퇴 화면을 참고한 임시 목록 — 시안 없음)
 *
 * 면접 연습 서비스에서 떠나는 흔한 이유로 골랐습니다. 기획에서 목록이 정해지면 이 파일만 고칩니다.
 * 값(`value`)은 탈퇴 요청에 같이 보냅니다 — 바꾸면 백엔드와 맞춰야 합니다 (docs/90-open-questions.md Q14).
 */
export const WITHDRAW_REASONS: { value: WithdrawReason; label: string }[] = [
  { value: 'FOUND_JOB', label: '취업 · 이직을 해서 더 연습할 일이 없어요' },
  { value: 'QUESTIONS_MISMATCH', label: '면접 질문이 제 직무 · 경험과 맞지 않아요' },
  { value: 'REPORT_UNHELPFUL', label: '리포트 · 피드백이 도움이 안 돼요' },
  { value: 'DEVICE_TROUBLE', label: '카메라 · 마이크가 잘 안 돼요' },
  { value: 'PRIVACY', label: '녹화 영상 · 개인정보가 걱정돼요' },
  { value: 'NEW_ACCOUNT', label: '다른 계정으로 새로 가입하고 싶어요' },
  { value: 'OTHER', label: '기타' },
]

/** `OTHER` 에서 직접 적는 이유의 최대 길이 */
export const WITHDRAW_DETAIL_MAX = 200

/** 탈퇴하면 지워지는 것. 백엔드 탈퇴 정책이 정해지면 맞춥니다 (docs/90-open-questions.md Q14) */
export const WITHDRAW_DELETED_ITEMS = '면접 기록과 답변 녹화 · 리포트 · 보관함 문서 · 계정 정보'
