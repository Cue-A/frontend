import { registerMock } from '@/shared/api/mock'

import type { Report } from '../types/report'

/**
 * 백엔드가 준비되기 전까지 화면을 그리기 위한 가짜 리포트입니다.
 * 실제 값이 아니라 **모양만** 맞춘 것이라, 계약이 확정되면 교체합니다.
 *
 * 일부러 빈 값을 섞어두었습니다. 빈 필드일 때 섹션이 숨겨지는지
 * 확인해야 하기 때문입니다. (2번 턴은 timeline 과 improvedAnswer 가 비어 있음)
 */
const SAMPLE_REPORT: Report = {
  reportId: 'r1',
  attempt: 2,
  totalAttempts: 3,
  companyName: '카카오',
  jobRole: '프론트엔드 개발',
  createdAt: '2026-09-10T14:32:00+09:00',
  scores: { content: 78, speech: 64, vision: 71, total: 71 },
  summary: {
    overallComment:
      '질문 의도를 잘 파악했고 경험을 구체적으로 풀었습니다. 다만 말이 빨라지는 구간에서 문장이 끊겼습니다.',
    strengths: ['질문 의도 파악이 정확함', '경험을 수치와 함께 설명함'],
    weaknesses: ['답변 후반부에 말 속도가 빨라짐', '시선이 화면 아래로 자주 내려감'],
    growthNarrative: '지난 회차보다 내용 점수가 12점 올랐습니다.',
    priorityImprovement: '답변을 마무리할 때 한 박자 쉬고 결론을 말해보세요.',
  },
  turns: [
    {
      turnId: 1,
      question: '자기소개를 1분 내로 해주세요.',
      transcript:
        '안녕하세요. 프론트엔드 개발자를 준비하고 있는 김희주입니다. 최근에는 팀 프로젝트에서 면접 코칭 서비스의 프론트엔드를 맡아 라우팅과 공통 레이아웃을 설계했습니다.',
      scores: { content: 82, speech: 70, vision: 74, total: 75 },
      strength: '경험을 역할 중심으로 설명했습니다.',
      weakness: '마지막 문장이 흐려졌습니다.',
      improvedAnswer:
        '…라우팅과 공통 레이아웃을 설계했습니다. 덕분에 팀원 세 명이 서로 충돌 없이 화면을 만들 수 있었습니다.',
      timeline: [
        { start: 12.4, end: 15.1, label: '시선 이탈' },
        { start: 38.2, end: 41.0, label: '말 속도 상승' },
      ],
    },
    {
      turnId: 2,
      question: '협업 중 의견이 갈렸을 때 어떻게 해결했나요?',
      transcript:
        '타이포 토큰 이름을 두고 의견이 갈렸는데, 기존에 쓰이던 이름과 충돌한다는 지적을 받고 제 제안을 접었습니다.',
      scores: { content: 74, speech: 58, vision: 68, total: 67 },
      strength: '근거를 듣고 판단을 바꾼 점이 좋습니다.',
      weakness: '결론을 먼저 말하면 더 명확했겠습니다.',
      improvedAnswer: null,
      timeline: [],
    },
  ],
}

registerMock('GET', '/api/reports/:reportId', ({ reportId }) => ({
  ...SAMPLE_REPORT,
  reportId,
}))
