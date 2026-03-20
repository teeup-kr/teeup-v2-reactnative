export const meetingTabs = [
  { id: 'rounding', label: '라운딩 모임' },
  { id: 'social', label: '소셜 모임' },
  { id: 'participating', label: '내가 참가한 모임' },
];

export const meetingValidTabs = ['rounding', 'social', 'participating'];

export const socialTypeOptions = [
  { id: 'CASUAL', label: '친목' },
  { id: 'DINNER', label: '식사' },
  { id: 'EVENT', label: '행사' },
];

export const socialSettlementMethods = [
  { id: 'EQUAL_SPLIT', label: 'N분의 1' },
  { id: 'CLUB_FUND', label: '전체 회비에서 처리' },
];

export const roundingTeamModes = [
  { id: 'GENDER_SEPARATED', label: '성별 분리' },
  { id: 'MIXED', label: '혼성' },
];

export const roundingMeetingSubtypes = [
  { id: 'REGULAR', label: '정기' },
  { id: 'IRREGULAR', label: '비정기' },
  { id: 'ONE_TIME', label: '일회성' },
];

export const roundingSettlementMethods = [
  { id: 'EQUAL_SPLIT', label: 'N분의 1' },
  { id: 'INDIVIDUAL', label: '개별 정산' },
];

export const meetingDetailTabs = [
  { key: 'participants', label: '참가자' },
  { key: 'teams', label: '팀' },
  { key: 'settlement', label: '정산' },
];
