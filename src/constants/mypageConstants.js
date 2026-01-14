import { colors } from '@/theme/colors';
export const mypageTabRoutes = {
  overview: '/mypage/overview',
  meetings: '/mypage/meetings',
  records: '/mypage/records',
  notifications: '/mypage/notifications',
  edit: '/mypage/edit',
  withdraw: '/mypage/withdraw',
};

export const recordStatusTabs = [
  { id: 'all', label: '전체' },
  { id: 'missing', label: '미입력' },
  { id: 'completed', label: '입력 완료' },
];

export const myMeetingsTypeTabs = [
  { id: 'all', label: '전체' },
  { id: 'ROUND', label: '라운딩' },
  { id: 'SOCIAL', label: '소셜' },
];

export const myMeetingsStatusTabs = [
  { id: 'all', label: '전체 상태' },
  { id: 'UPCOMING', label: '예정' },
  { id: 'CLOSED', label: '모집마감' },
  { id: 'COMPLETED', label: '완료' },
];

export const myMeetingsStatusConfig = {
  UPCOMING: { label: '예정', color: colors.info[600], bg: colors.info[50] },
  CLOSED: { label: '모집마감', color: colors.warning[600], bg: colors.warning[50] },
  COMPLETED: { label: '완료', color: colors.success[600], bg: colors.success[50] },
};

export const myMeetingsTypeConfig = {
  ROUND: { label: '라운딩', color: colors.accent[600], bg: colors.accent[50] },
  SOCIAL: { label: '소셜', color: colors.primary[600], bg: colors.primary[50] },
};

export const myMeetingsRoleConfig = {
  ORGANIZER: { label: '주최자', color: colors.neutral[700], bg: colors.neutral[100] },
  HOST: { label: '주최자', color: colors.neutral[700], bg: colors.neutral[100] },
  PARTICIPANT: { label: '참가자', color: colors.neutral[600], bg: colors.neutral[100] },
};

export const genderOptions = [
  { id: 'male', label: '남성', value: 'M' },
  { id: 'female', label: '여성', value: 'F' },
  { id: 'none', label: '선택 안함', value: '' },
];
