/**
 * 목업 기업 데이터입니다. 기업 도메인 목업(목록 · 상세 · 관심 기업)과 면접 도메인 목업(세션 시작의 기업 id 검사)이 같이 씁니다.
 * 다른 도메인의 api 를 가져다 쓰지 않는 규칙(docs/01-conventions.md)이라 데이터만 여기에 둡니다. 목업 등록(`registerMock`)은
 * 각 도메인 api/ 에서 합니다.
 *
 * 원본은 백엔드 기업 시드(Cue-A/backend#112 `V2__seed_companies.sql`) 28개 중 **검증된(verified) 21개**입니다. 서버도 목록 ·
 * 상세에 이 21개만 내보냅니다. id 는 시드 적재 순서(1~28)라, 검증되지 않은 기업 자리는 비어 있습니다. 배포 DB 를 새로 만든
 * 뒤 적재했다면 배포 서버의 id 와도 같습니다.
 *
 * 인재상 설명(`talentProfile`)은 시드에 값이 없어서 모두 null 입니다.
 */

export type MockCompany = {
  companyId: number
  name: string
  industry: string
  valuesFormat: 'WORD' | 'PRINCIPLE' | 'MIXED'
  coreValues: { name: string; indicator: string }[]
  talentProfile: string | null
}

export const MOCK_COMPANIES: MockCompany[] = [
  {
    companyId: 1,
    name: 'CJ ENM',
    industry: '미디어 / 엔터테인먼트 / 콘텐츠',
    valuesFormat: 'MIXED',
    coreValues: [
      { name: '내일 더 새롭게', indicator: '내일의 성장을 위해 의미 있는 일을 스스로 새롭게 찾고, 동료와 논의하며 실행' },
      { name: '꿈을 원대하게', indicator: '현재의 작은 성공이나 안전한 선택에 머무르지 않고 더 큰 가능성과 도전을 선택' },
      { name: '반드시 결과로', indicator: '과정이나 의지에 머무르지 않고 자신이 맡은 일을 실제 성과와 결과로 증명' },
      { name: '안돼도 다시', indicator: '실패를 두려워하거나 쉽게 지치지 않고 성공 가능성을 믿으며 다시 시도' },
      { name: '진정성 있게', indicator: '자신이 하고 싶은 일뿐 아니라 동료와 조직의 성장에 필요한 일을 숨기지 않고 정직하게 실행' },
    ],
    talentProfile: null,
  },
  {
    companyId: 2,
    name: 'CJ올리브네트웍스',
    industry: 'IT 서비스 / 디지털 플랫폼 / 시스템 통합',
    valuesFormat: 'MIXED',
    coreValues: [
      { name: '내일 더 새롭게', indicator: '내일의 성장을 위해 의미 있는 일을 스스로 새롭게 찾고, 동료와 논의하며 실행' },
      { name: '꿈을 원대하게', indicator: '현재의 작은 성공이나 안전한 선택에 머무르지 않고 더 큰 가능성과 도전을 선택' },
      { name: '반드시 결과로', indicator: '과정이나 의지에 머무르지 않고 자신이 맡은 일을 실제 성과와 결과로 증명' },
      { name: '안돼도 다시', indicator: '실패를 두려워하거나 쉽게 지치지 않고 성공 가능성을 믿으며 다시 시도' },
      { name: '진정성 있게', indicator: '자신이 하고 싶은 일뿐 아니라 동료와 조직의 성장에 필요한 일을 숨기지 않고 정직하게 실행' },
    ],
    talentProfile: null,
  },
  {
    companyId: 3,
    name: 'KB증권',
    industry: '금융/증권',
    valuesFormat: 'MIXED',
    coreValues: [
      { name: '고객중심', indicator: '고객의 입장과 이익을 최우선으로 고려하여 판단하고 의사결정함' },
      { name: '전문성', indicator: '업계 최고 수준의 역량을 갖춘 금융인을 목표로 끊임없이 노력함' },
      { name: '혁신주도', indicator: '창의적인 사고와 과감한 도전을 통해 변화와 혁신을 주도함' },
      { name: '신뢰정직', indicator: '윤리의식을 바탕으로 정직과 신의성실의 자세를 항상 견지함' },
      { name: '동반성장', indicator: '개인과 조직의 발전을 넘어 국민과 사회 발전에 기여함' },
    ],
    talentProfile: null,
  },
  {
    companyId: 4,
    name: 'LG CNS',
    industry: 'IT 서비스 / AX',
    valuesFormat: 'MIXED',
    coreValues: [
      { name: 'Insightful Expert — 전문성', indicator: '표면에 드러난 현상에 머물지 않고 숨은 문제를 먼저 발견하며, 독보적인 기술과 전문성을 바탕으로 끝까지 해결함' },
      { name: 'Game Changer — 혁신', indicator: '익숙하고 정해진 방식에 안주하지 않고 새로운 디지털 경험의 가능성을 탐색하며, 기존의 한계를 넘어 새로운 기준을 만듦' },
      { name: 'Empowered Achiever — 자율과 책임', indicator: '스스로 능동적으로 움직이면서 고객과의 약속을 지키고, 만들어낸 결과와 비즈니스 가치에 끝까지 책임짐' },
      { name: 'Self-Motivated Learner — 성장', indicator: '변화를 먼저 읽고 새로운 기술을 빠르게 자신의 것으로 만들며, 축적한 성장을 고객과 세상의 변화로 연결함' },
      { name: 'Synergy Builder — 협업', indicator: '자신의 역할에 집중하면서도 동료의 맥락을 함께 이해하고 서로의 성장을 지원해 조직 전체의 시너지를 만듦' },
      { name: 'Open-Minded Listener — 존중', indicator: '서로 다른 과정과 관점을 인정하고 포용하며, 동료와 고객 등 연결된 사람들을 존중함' },
    ],
    talentProfile: null,
  },
  {
    companyId: 5,
    name: 'LG전자',
    industry: '가전 · 전자기기',
    valuesFormat: 'PRINCIPLE',
    coreValues: [
      { name: '도전', indicator: '꿈과 열정을 가지고 세계 최고에 도전한다.' },
      { name: '고객중심/혁신', indicator: '고객을 최우선으로 생각하고 끊임없이 혁신한다.' },
      { name: '팀워크/자율/창의', indicator: '팀워크를 이루며 자율적이고 창의적으로 일한다.' },
      { name: '정도경영/실력', indicator: '꾸준히 실력을 배양하여 정정당당하게 경쟁한다.' },
    ],
    talentProfile: null,
  },
  {
    companyId: 6,
    name: 'SK하이닉스',
    industry: '반도체/메모리',
    valuesFormat: 'MIXED',
    coreValues: [
      { name: 'Bar Raising', indicator: '이만하면 됐다 싶은 지점에서 한 번 더 고민한다. 과정이 어렵더라도 목표 수준을 타협하지 않는다.' },
      { name: 'AI Driven', indicator: '데이터를 과할 정도로 적시에 제시하며 소통한다. AI를 사고 확장의 도구로 쓰되 최종 판단은 스스로 내린다.' },
      { name: 'One Team', indicator: '본인 담당이 아니어도 전체를 생각하며 자기 일처럼 처리한다. 직위와 연차에 상관없이 존중과 배려로 대하고, 진심을 담아 피드백한다.' },
      { name: 'Innovation', indicator: '늘 해오던 방식을 벗어나 과감히 도전한다. 모두가 A를 선호해도 가치가 있다고 판단되면 용기 있게 B를 제안한다.' },
      { name: 'Customer Focus', indicator: '내가 하는 일이 고객가치에 어떻게 연결되는지 명확히 설명할 수 있다. 고객이 미처 생각하지 못한 니즈까지 파악해 먼저 제안한다.' },
      { name: 'Perfection', indicator: '어려운 문제는 반드시 나타난다고 전제하고 상황별 시나리오를 세세히 그려 반복 점검한다. 내가 맡은 일이 곧 내 브랜드라고 믿는다.' },
    ],
    talentProfile: null,
  },
  {
    companyId: 7,
    name: '기아',
    industry: '자동차/모빌리티',
    valuesFormat: 'PRINCIPLE',
    coreValues: [
      { name: '사람을 생각합니다', indicator: '개인의 배경, 문화, 정체성을 존중하고 있는 그대로의 모습으로 일할 수 있도록 서로를 배려한다. 개인의 성공이나 일시적 성과가 아닌 동료, 고객, 세상을 위한 더 나은 결정을 내린다. 동료와 고객, 세상에 긍정적 영향을 주는 명확하고 실현가능한 목표를 세운다.' },
      { name: '함께, 더 멀리 나아갑니다', indicator: '공동의 목표를 달성하기 위해 팀과 지역의 경계를 넘어 함께 일한다. 적극적으로 조언을 구하고 다른 의견에 귀 기울이며 서로의 생각에 건설적으로 도전한다. 최종 결과뿐 아니라 과정도 인정하고 축하한다.' },
      { name: '서로에게 힘을 실어줍니다', indicator: '일을 시작하기 전에 합의된 목표를 설정하고, 이를 달성하도록 서로 믿고 응원한다. 서로에게 솔직하고 투명하게 정보를 공유한다. 자신의 약속에 책임을 진다.' },
      { name: '과감히 한계에 도전합니다', indicator: '끊임없이 질문하며 매일 배우고 성장한다. 위험요인을 분석·예측해 기꺼이 감수하고, 실패를 배움의 기회로 활용한다. 명확한 목적을 가지고 대담하게 현상에 도전해 새로운 해결책을 찾는다.' },
      { name: '어제보다 더 나은 오늘을 추구합니다', indicator: '항상 고객의 입장에서 생각하며 고객의 니즈 충족과 불편 해소를 위해 노력한다. 품질과 생산성을 높이기 위해 업무 우선순위를 정하고 일하는 방식을 단순하게 한다. 데이터와 자신의 판단을 균형 있게 고려해 최적의 결정을 내리고 신속히 실행한다.' },
    ],
    talentProfile: null,
  },
  {
    companyId: 8,
    name: '네이버',
    industry: 'IT/플랫폼',
    valuesFormat: 'PRINCIPLE',
    coreValues: [
      { name: '도전과 변화 추구', indicator: '모든 판단의 기준을 사용자 가치에 둔다. 원래 무엇을 위한 일인지 스스로 되물으며 일의 본질을 점검한다.' },
      { name: '주도성과 책임감', indicator: '직무나 직군의 한계를 두지 않고 필요한 일을 스스로 정의해 해낸다. 본인 업무가 만드는 영향력을 생각하며, 스스로가 업계 기준이 된다는 책임감으로 일한다.' },
      { name: '협업과 정보 공유', indicator: '동료의 질문과 이견을 생각을 가다듬는 재료로 삼아 주저 없이 묻고 답한다. 업무 지식, 히스토리, 맥락을 동료와 아낌없이 공유한다.' },
      { name: '정직/투명성', indicator: '사용자와 동료 앞에 모든 것을 설명할 수 있도록 타협 없이 정직하게 일한다.' },
    ],
    talentProfile: null,
  },
  {
    companyId: 10,
    name: '대한항공',
    industry: '항공운송',
    valuesFormat: 'MIXED',
    coreValues: [
      { name: 'Professional & Responsible', indicator: '전문성을 바탕으로 노력과 책임을 다하는 사람' },
      { name: 'Caring & Collaborative', indicator: '상호존중과 협력의 가치를 믿는 사람' },
      { name: 'Proactive & Challenging', indicator: '주도적이며 열정과 도전의식을 갖춘 사람' },
    ],
    talentProfile: null,
  },
  {
    companyId: 11,
    name: '두나무',
    industry: '블록체인 / 가상자산 거래',
    valuesFormat: 'MIXED',
    coreValues: [
      { name: '열정과 성과지향', indicator: '최고의 성과를 목표로 도전합니다. 변화의 흐름을 예측하고, 고객의 관심사를 끊임 없이 탐구하며, 실패의 경험도 기회로 삼는 열정 가득한 인재입니다.' },
      { name: '다양성과 결단력', indicator: '서로 다른 경험과 지식을 이해하고 다양한 의견을 주고 받으며 때로는 건설적인 대안을 제시하면서 최선의 결정을 내릴 수 있도록 합니다. 정해진 결정을 수용하고 적극적으로 실행합니다.' },
      { name: '존중과 배려', indicator: '존중과 배려의 중요성을 이해합니다. 회사 동료 및 파트너사와 협업 과정에서 겸손한 태도를 갖고 상대의 업무, 경험, 일 하는 방식을 존중합니다.' },
      { name: '진정성과 책임감', indicator: '서비스를 향한 진심으로, 주어진 일의 시작부터 끝까지 책임감을 갖고 임합니다. 회사와 서비스를 위해 무엇이 최선인지 동료들과 함께 고민하고 토론하여 신뢰와 성실이 고객에게 전해질 수 있도록 노력합니다.' },
    ],
    talentProfile: null,
  },
  {
    companyId: 12,
    name: '미래에셋증권',
    industry: '금융/증권',
    valuesFormat: 'PRINCIPLE',
    coreValues: [
      { name: '고객 중심', indicator: '고객을 위해 존재하며, 고객의 성공이 곧 우리의 성공이라는 신념으로 이익을 우선함' },
      { name: '독립성과 경쟁우위', indicator: '투자전문그룹으로서 원칙을 지키는 투자와 우수한 운용 능력을 바탕으로 경쟁우위를 확보함' },
      { name: '개인 존중과 팀플레이', indicator: '경쟁력 있는 인재들에 대한 존중과 팀플레이에 대한 굳건한 믿음을 통해 변화에 앞서감' },
      { name: '사회적 책임', indicator: '이익의 사회 환원을 실천하며 건강한 사회를 만드는 데 적극적으로 기여함' },
    ],
    talentProfile: null,
  },
  {
    companyId: 14,
    name: '삼성바이오로직스',
    industry: '바이오/의약품 CDMO',
    valuesFormat: 'MIXED',
    coreValues: [
      { name: '사명감', indicator: '일의 품격을 높이며, 생명의 소중함을 깊이 이해하고 실천한다.' },
      { name: '존중', indicator: '고객을 존중하고, 조직 내 모든 구성원 간의 존엄을 인정하며 대우한다.' },
      { name: '소통', indicator: '계층 및 부서 간 원활하게 소통하며 협력한다.' },
      { name: '변화', indicator: '업무의 효율성을 높이며 자주적이고 능동적으로 행동한다.' },
      { name: '글로벌', indicator: '글로벌 경쟁력을 갖추고, 변화하는 문화와 제도에 맞춰 사고한다.' },
    ],
    talentProfile: null,
  },
  {
    companyId: 16,
    name: '우아한형제들',
    industry: '배달 플랫폼 / 푸드테크',
    valuesFormat: 'PRINCIPLE',
    coreValues: [
      { name: 'Own it — 내 일의 대표는 나', indicator: '내 일의 경계를 두지 않고 문제를 끝까지 해결한다. 나의 이익을 넘어 비즈니스의 방향을 먼저 본다. 주어진 자원을 효율적이고 책임감 있게 활용한다.' },
      { name: 'Dive deep — 파고들자 끄으으읏까지', indicator: '숫자에 가려진 진짜 의미를 찾기 위해 집요하게 파고든다. 일의 목적과 맥락, 영향력을 끊임없이 고민하며 일한다. 말보다 실행으로 끝까지 답을 찾는다.' },
      { name: 'Deliver value fast — 속도는 곧 경쟁력', indicator: '고객이 필요한 것을 최우선으로 둔다. 빠르게 실행하고 빠르게 개선한다. 변화에 유연할수록 기회는 더 커진다.' },
      { name: 'Bring good vibes — 가보자! 덕분에! 해냈어!', indicator: '나의 말과 행동이 주변에 미칠 영향에 대해 생각하고 행동한다. 안되는 이유 100가지보다 가능한 이유 1가지를 찾는다. 서로의 기여를 인정하고 격려하는 팀을 만든다.' },
      { name: 'Raise the bar — 적당히는 적당하지 않다', indicator: '좋은 것을 넘어 탁월함을 추구한다. 최고의 팀원이 모여 최상의 팀을 만든다. 문제에 직면할 수 있는 건강한 피드백은 더 나은 결과를 만든다.' },
    ],
    talentProfile: null,
  },
  {
    companyId: 19,
    name: '카카오모빌리티',
    industry: '모빌리티/플랫폼',
    valuesFormat: 'PRINCIPLE',
    coreValues: [
      { name: '본질집중', indicator: '목표와 결과 설정을 최대한 구체적이고 공감할 수 있도록 한다. 일의 시작과 진행에서 수단과 형식에 구애받지 않고 불필요한 야근을 하지 않는다.' },
      { name: '1등 추구/도전', indicator: '언제나 새로운 목표를 찾고 끊임없는 도전으로 시장을 선도한다. 스스로 최고가 되기 위해 고민하고 노력하며 더 나은 미래를 위해 끊임없이 변화한다.' },
      { name: '세상에 대한 기여', indicator: '나의 기여로 더 나은 세상을 만들어간다는 관점에서 일한다. 나만의 성취보다 모두의 성취를 지향하며 나의 선택이 세상에 미치는 영향을 고민한다.' },
      { name: '자기주도와 수평적 논의', indicator: '나이·직책·연차와 관계없이 크루의 의견은 존중받아야 한다는 믿음으로 일한다. 혼자 결정하기보다 충분히 의견을 교환하고 충돌하며 논의 과정을 거쳐 의사결정한다.' },
    ],
    talentProfile: null,
  },
  {
    companyId: 21,
    name: '쿠팡',
    industry: '이커머스 / 물류 / 테크',
    valuesFormat: 'PRINCIPLE',
    coreValues: [
      { name: 'Wow the Customer + Aim High and Find a Way', indicator: '모든 의사결정의 시작과 끝을 고객에 두고, 절충안에 머물지 않으며 높은 목표와 근본적 해결책을 통해 고객의 기대를 크게 뛰어넘는 결과를 추구함' },
      { name: 'Ruthless Prioritization + Simplify + Hate Waste', indicator: '반드시 이겨야 할 핵심 과제에 집중하고 불필요한 복잡성을 제거하며, 성과와 효율을 해치지 않는 방식으로 자원 낭비를 근본적으로 줄임' },
      { name: 'Company-wide Perspective + Dive Deep + Think Systematically', indicator: '자신의 조직을 넘어 회사 전체의 영향을 고려하고, 문제의 세부사항과 원인을 끝까지 파악해 같은 문제가 반복되지 않는 확장 가능한 프로세스를 만듦' },
      { name: 'Disagree and Commit + Influence without Authority', indicator: '데이터와 인사이트를 근거로 의견을 명확히 전달하고 필요하면 공개적으로 이견을 제기하며, 결정된 이후에는 성공적인 결과를 위해 함께 전력으로 실행함' },
      { name: 'Hire and Develop the Best + Learn Voraciously + Demand Excellence', indicator: '뛰어난 인재의 성장에 투자하고 좋은 아이디어를 적극적으로 배우며, 자신과 조직에 높은 기준을 적용하고 그 기준을 지속적으로 높임' },
      { name: 'Move with Urgency + Deliver Results with Grit', indicator: '완벽한 답을 기다리며 결정을 미루지 않고 계산된 위험을 감수해 빠르게 실행하며, 시작한 일을 집념 있게 끝내 제때 높은 수준의 성과를 만들어냄' },
    ],
    talentProfile: null,
  },
  {
    companyId: 22,
    name: '키움증권',
    industry: '금융/증권',
    valuesFormat: 'MIXED',
    coreValues: [
      { name: '주도성 (Initiative)', indicator: '진정한 Pro 정신에 기반하여 스스로 주도적으로 미래를 개척함' },
      { name: '도전 (Challenge)', indicator: '유연한 사고를 바탕으로 실패와 변화를 두려워하지 않고 도전함' },
      { name: '신뢰 (Trust)', indicator: '고객을 최우선으로 존중하고 윤리적으로 행동하여 신뢰를 구축함' },
    ],
    talentProfile: null,
  },
  {
    companyId: 24,
    name: '한국가스공사',
    industry: '천연가스 / 에너지 공기업',
    valuesFormat: 'PRINCIPLE',
    coreValues: [
      { name: '안전우선 (책임실천인)', indicator: '주인의식을 가지고 자신의 일을 완수하며, 안전 우선의 ESG 가치 실현을 책임감 있게 실천' },
      { name: '미래주도 (혁신전문인)', indicator: '최고의 전문성 기반으로 급변하는 기업환경 변화를 통찰하고 혁신하여 기업의 미래성장을 주도' },
      { name: '소통협력 (소통협력인)', indicator: '상호신뢰관계를 바탕으로 적극적으로 소통하고 협업하여 조직의 공동목표 달성을 견인' },
      { name: '실용지향 (실용주도인)', indicator: '실용적 사고로 실현 가능한 대안을 제시하고 이를 실효성 있게 추진하여 주도적으로 문제를 해결' },
    ],
    talentProfile: null,
  },
  {
    companyId: 25,
    name: '한국전력공사',
    industry: '전력 / 에너지 공기업',
    valuesFormat: 'MIXED',
    coreValues: [
      { name: 'Passionate (열정人)', indicator: '도전정신과 열정을 가지고 기존의 한계를 뛰어넘는 한전인' },
      { name: 'Open-minded (소통人)', indicator: '열린 마음과 상호존중을 기반으로 소통하고 협력하는 한전인' },
      { name: 'Wise-thinking (창의人)', indicator: '창의적인 시각과 직무 전문성으로 미래 기술의 혁신을 이끄는 한전인' },
      { name: 'Ethical (청렴人)', indicator: '윤리의식을 기반으로 원칙을 준수하며 이해관계자들에게 신뢰받는 한전인' },
      { name: 'Responsible (책임人)', indicator: '책임의식과 자긍심을 가지고 역할과 사명을 완수하는 한전인' },
    ],
    talentProfile: null,
  },
  {
    companyId: 26,
    name: '현대건설(주)',
    industry: '종합건설 · 플랜트',
    valuesFormat: 'MIXED',
    coreValues: [
      { name: 'Value Creator (가치 창출)', indicator: '현실에 안주하지 않고, 끝없는 도전정신과 창의성을 토대로 새로운 가치를 창출하는 인재' },
      { name: 'Synergy Builder (시너지 구현)', indicator: '다양한 이해관계자와의 소통과 협력을 통해 조직 내에서 시너지를 구현하는 인재' },
      { name: 'Global Developer (글로벌 역량)', indicator: '글로벌 역량, 열린 사고, 다양성에 대한 이해를 바탕으로 세계무대에서 활약할 수 있는 인재' },
    ],
    talentProfile: null,
  },
  {
    companyId: 27,
    name: '현대오토에버',
    industry: 'IT / 모빌리티 소프트웨어',
    valuesFormat: 'MIXED',
    coreValues: [
      { name: 'Make It Yours', indicator: '일의 가치를 스스로 만들어 감' },
      { name: 'Make Bold Moves', indicator: '더 나은 방법을 찾아 과감히 도전함' },
      { name: 'Work With Grit', indicator: '집요하게 문제를 파고들되 빠르게 해결함' },
      { name: 'Win Through Growth', indicator: '성장을 통해 경쟁력을 높임' },
      { name: 'Partner with Purpose', indicator: '공동의 목표를 위해 사람들과 연결함' },
      { name: 'Practice Recognition', indicator: '서로의 기여를 인정하고 배려함' },
    ],
    talentProfile: null,
  },
  {
    companyId: 28,
    name: '현대자동차',
    industry: '완성차 / 모빌리티',
    valuesFormat: 'MIXED',
    coreValues: [
      { name: '고객 최우선 (Customer)', indicator: '우리의 의사결정 기준은 고객감동이다. 안전과 품질에 있어 절대 타협하지 않는다. (Safety and Quality) 적당히\'로는 고객을 만족시킬 수 없다. (Tenacity)' },
      { name: '도전적 실행 (Challenge)', indicator: '새로운 내일은 오늘의 도전에서 시작된다. 수 만 번의 시도와 도전이 혁신을 만든다. (Progress) 불확실성의 시대에서 계획을 완벽하게 실행하기란 불가능하다. (Agility)' },
      { name: '소통과 협력 (Collaboration)', indicator: '열린 마음으로 협업하여 더 큰 가능성을 이룬다. 자동차의 타이어를 한 방향으로 조절하는 것처럼, 우리 모두는 한 방향을 바라보며 일한다. (Alignment) 도전에 있어 시련은 있어도 실패는 없다. (Resilience)' },
      { name: '인재 존중 (People)', indicator: '서로를 존중하고 함께 성장한다. 다양성이 높을수록 조직의 역량이 높아지며, 새로운 아이디어와 혁신을 이끄는 원동력이 된다. (Diversity and Inclusion) 기술을 모르는 비즈니스, 비즈니스를 모르는 기술은 고객을 감동시킬 수 없다. (Expertise)' },
      { name: '글로벌 지향 (Globality)', indicator: '최고의 모빌리티 기업으로 글로벌 시장을 선도한다. 우리는 사람들의 안전하고 자유로운 이동을 도와주는 일을 하고 있다. (Integrity) 데이터 기반 사고는 미래를 선제적으로 준비하고 성공 확률을 높일 수 있는 가장 강력한 무기다. (Data-Driven Thinking)' },
    ],
    talentProfile: null,
  },
]
