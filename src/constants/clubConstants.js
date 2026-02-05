import { colors } from '@/styles/colors';
export const clubValidTabs = ['my', 'all', 'join-applications'];

export const clubTabs = [
  { id: 'my', label: '내 클럽' },
  { id: 'all', label: '클럽 찾아보기' },
  { id: 'join-applications', label: '가입 신청 내역' },
];

export const clubStatusFilterOptions = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'APPROVED', label: '승인됨' },
  { value: 'PENDING', label: '승인 대기' },
  { value: 'REJECTED', label: '거부됨' },
];

export const clubMyStatusOptions = [
  { value: 'ACTIVE', label: '활성/승인' },
  { value: 'INACTIVE', label: '비공개' },
  { value: 'ALL', label: '전체' },
];

export const clubStatusBadgeConfig = {
  ACTIVE: { text: '활성', bg: colors.success[50], fg: colors.success[700] },
  APPROVED: { text: '활성', bg: colors.success[50], fg: colors.success[700] },
  INACTIVE: { text: '비공개', bg: colors.neutral[100], fg: colors.neutral[800] },
  PENDING: { text: '승인 대기', bg: colors.warning[50], fg: colors.warning[700] },
  REJECTED: { text: '거부됨', bg: colors.error[50], fg: colors.error[700] },
  CANCELED: { text: '취소됨', bg: colors.error[50], fg: colors.error[700] },
  SUSPENDED: { text: '정지', bg: colors.error[50], fg: colors.error[700] },
};

export const clubMembershipStatusBadgeConfig = {
  APPROVED: { text: '가입됨', bg: colors.success[50], fg: colors.success[700] },
  ACTIVE: { text: '가입됨', bg: colors.success[50], fg: colors.success[700] },
  PENDING: { text: '가입 대기', bg: colors.warning[50], fg: colors.warning[700] },
  REJECTED: { text: '가입 거부', bg: colors.error[50], fg: colors.error[700] },
};

export const clubTypeBadgeConfig = {
  REGULAR: { text: '정기 모임', bg: colors.info[50], fg: colors.info[700] },
  IRREGULAR: { text: '비정기 모임', bg: colors.accent[50], fg: colors.accent[700] },
  ROUND: { text: '라운딩', bg: colors.primary[50], fg: colors.primary[700] },
  SOCIAL: { text: '소셜 모임', bg: colors.secondary[50], fg: colors.secondary[700] },
  MIXED: { text: '혼합', bg: colors.neutral[100], fg: colors.neutral[800] },
};

export const clubRoleBadgeConfig = {
  LEADER: { text: '리더', bg: colors.accent[50], fg: colors.accent[700] },
  MANAGER: { text: '매니저', bg: colors.info[50], fg: colors.info[700] },
  MEMBER: { text: '일반회원', bg: colors.neutral[100], fg: colors.neutral[800] },
};

export const clubDetailTypeLabel = {
  REGULAR: '정기 모임',
  IRREGULAR: '비정기 모임',
};

export const clubDetailStatusLabel = {
  APPROVED: '활성',
  ACTIVE: '활성',
  PENDING: '승인 대기',
  REJECTED: '반려',
  CANCELED: '취소',
};

export const clubMemberStatusColors = {
  ACTIVE: colors.success[600],
  PENDING: colors.warning[600],
};

export const clubManageSections = [
  { id: 'members', label: '멤버 관리', icon: 'users', route: 'members' },
  { id: 'notices', label: '공지사항', icon: 'bullhorn', route: 'notices' },
  { id: 'regulations', label: '클럽 규정', icon: 'file-alt', route: 'regulations' },
  { id: 'fees', label: '회비 관리', icon: 'money-bill-wave', route: 'fees' },
  { id: 'stats', label: '통계', icon: 'chart-line', route: 'stats' },
  { id: 'activities', label: '활동 내역', icon: 'clipboard-list', route: 'activities' },
];

export const clubRegisterTypes = [
  { id: 'REGULAR', label: '정기 모임' },
  { id: 'IRREGULAR', label: '비정기 모임' },
];

export const clubFeeCycles = [
  { id: 'MONTHLY', label: '월 1회' },
  { id: 'QUARTERLY', label: '분기 1회' },
  { id: 'YEARLY', label: '연 1회' },
];
