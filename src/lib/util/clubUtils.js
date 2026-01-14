import { clubDetailStatusLabel, clubDetailTypeLabel } from '@/constants/clubConstants';
import { colors } from '@/styles/colors';

import {
  clubMembershipStatusBadgeConfig,
  clubRoleBadgeConfig,
  clubStatusBadgeConfig,
  clubTypeBadgeConfig,
} from '../../constants/clubConstants';

import { responseUtils } from './responseUtils';

function getClubStatusBadgeConfig(status, clubDeletedAt) {
  if (clubDeletedAt) {
    return { text: '삭제됨', bg: colors.error[50], fg: colors.error[700] };
  }

  const normalizedStatus = String(status || '').toUpperCase();
  const config = clubStatusBadgeConfig[normalizedStatus];
  if (config) {
    return config;
  }

  return {
    text: status || '알 수 없음',
    bg: colors.neutral[100],
    fg: colors.neutral[800],
  };
};

function getClubMembershipStatusBadgeConfig(status) {
  if (!status || status === 'null' || status === '') return null;
  const normalizedStatus = String(status).toUpperCase().trim();
  const validStatuses = ['APPROVED', 'ACTIVE', 'PENDING', 'REJECTED'];
  if (!validStatuses.includes(normalizedStatus)) return null;

  return clubMembershipStatusBadgeConfig[normalizedStatus] || null;
};

function getClubTypeBadgeConfig(type) {
  const normalizedType = String(type || '').toUpperCase();
  return clubTypeBadgeConfig[normalizedType] || null;
};

function getClubRoleBadgeConfig(role) {
  if (!role) return null;
  const normalizedRole = String(role).toUpperCase();
  return clubRoleBadgeConfig[normalizedRole] || clubRoleBadgeConfig.MEMBER;
};

function formatClubDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ko-KR');
  } catch {
    return '-';
  }
};

function normalizePaginatedResponse(payload) {
  if (Array.isArray(payload)) return { data: payload, total_pages: 1 };
  if (!payload || typeof payload !== 'object') return { data: [], total_pages: 1 };
  if (Array.isArray(payload.data)) return payload;
  const data = responseUtils.extractList(payload);
  const totalPages = payload.total_pages || payload.totalPages || 1;
  return { ...payload, data, total_pages: totalPages };
};
function getClubPageNumbers({ currentPage, totalPages }) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const groupStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
  const groupEnd = Math.min(groupStart + 4, totalPages);
  const numbers = [];
  for (let page = groupStart; page <= groupEnd; page += 1) {
    numbers.push(page);
  }
  return numbers;
};

function getClubCardVariant(activeTab) { return activeTab === 'applications' ? 'applications' : activeTab; }
function normalizeClubActivities(activities) {
  return activities.map((item, index) => {
    const activityKey = item?.id || item?.activity_id || item?.title || `activity-${index}`;
    const title = item?.title || '활동';
    const detail = item?.description || item?.detail || '-';
    let activityDate = '-';

    if (item?.date) {
      activityDate = String(item.date).slice(0, 10);
    } else if (item?.created_at) {
      activityDate = item.created_at.slice(0, 10);
    }

    return {
      id: activityKey,
      title,
      detail,
      date: activityDate,
    };
  });
}

function buildClubDetailDisplay(club) {
  const clubStatus = club?.status || club?.membership_status;
  const clubStatusLabel = clubDetailStatusLabel[clubStatus] || clubStatus || '-';
  const clubType = club?.type;
  const clubTypeLabel = clubDetailTypeLabel[clubType] || clubType || '모임';
  const clubName = club?.name || '클럽명 없음';
  const clubDescription = club?.description || club?.additional_info;
  const clubSubtitle = clubDescription || '-';
  const clubIntro = clubDescription || '등록된 소개가 없습니다.';
  const location = club?.location || '-';
  const memberCount = club?.member_count ?? '-';
  const representativeName = club?.representative_name || '-';
  const contactInfo = club?.contact_info || '-';
  const additionalInfo = club?.additional_info || '-';

  return {
    clubStatusLabel,
    clubTypeLabel,
    clubName,
    clubSubtitle,
    clubIntro,
    location,
    memberCount,
    representativeName,
    contactInfo,
    additionalInfo,
  };
};
function buildFeeSummary(fees) {
  if (fees.length === 0) {
    return { amount: '-', nextDue: '-' };
  }
  const sortedByDue = fees
    .filter((fee) => fee?.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const nextDue = sortedByDue[0]?.due_date
    ? sortedByDue[0].due_date.slice(0, 10)
    : '-';
  const recurring = fees.find((fee) => fee?.amount !== undefined && fee?.amount !== null);
  const amountValue = recurring?.amount;
  const amount =
    amountValue !== undefined && amountValue !== null
      ? `${Number(amountValue).toLocaleString('ko-KR')}원`
      : '-';
  return { amount, nextDue };
};

function normalizeFeeItem(fee) {
  const title = fee?.title || fee?.type || '회비';
  const amountValue = fee?.amount;
  const amount =
    amountValue !== undefined && amountValue !== null
      ? `${Number(amountValue).toLocaleString('ko-KR')}원`
      : '-';
  const status = fee?.status || fee?.payment_status || '';

  return {
    id: fee?.id || fee?.fee_id || title,
    title,
    amount,
    status: status || '-',
  };
};
function normalizeClubMembers(members) {
  let pendingCount = 0;
  const normalizedMembers = members.map((member) => {
    const status = member?.status || member?.membership_status || 'ACTIVE';
    if (status === 'PENDING' || status === 'WAITING') {
      pendingCount += 1;
    }

    return {
      id: member?.id || member?.member_id || member?.user_id,
      name:
        member?.user?.name ||
        member?.user?.realname ||
        member?.user?.nickname ||
        member?.name ||
        member?.nickname ||
        '-',
      role: member?.role || member?.membership_role || '-',
      status,
    };
  });

  return {
    normalizedMembers,
    pendingCount,
  };
};

function buildMemberSummary({ total, pending }) { return `총 ${total}명 · 승인 대기 ${pending}명`; }
function normalizeClubNotices(notices) {
  return notices.map((notice) => ({
    id: notice?.id || notice?.notice_id || notice?.title,
    title: notice?.title || '공지사항',
    date: notice?.created_at ? notice.created_at.slice(0, 10) : notice?.date || '-',
    pinned: notice?.is_pinned || notice?.is_important || notice?.pinned || false,
  }));
}

const defaultClubRegisterErrors = {
  name: '',
  description: '',
  member_count: '',
  location: '',
  contact: '',
  additional_info: '',
  has_regular_fee: '',
  regular_fee_amount: '',
  regular_fee_cycle: '',
  regular_fee_description: '',
  general: '',
};

function buildClubRegisterPayload(formData) {
  return ({
    name: formData.name,
    type: formData.type,
    description: formData.description,
    member_count: Number(formData.memberCount) || 1,
    location: formData.location,
    contact_info: formData.contact,
    additional_info: formData.additionalInfo || null,
    has_regular_fee: formData.hasRegularFee,
    regular_fee_amount: formData.hasRegularFee
      ? Number(formData.regularFeeAmount) || 0
      : null,
    regular_fee_cycle: formData.hasRegularFee
      ? formData.regularFeeCycle || null
      : null,
    regular_fee_description: formData.hasRegularFee
      ? formData.regularFeeDescription || null
      : null,
  });
}
function normalizeClubRegulations(regulations) {
  return regulations.map((regulation) => ({
    id: regulation?.id || regulation?.regulation_id || regulation?.title,
    title: regulation?.title || '규정',
    updated: regulation?.updated_at
      ? regulation.updated_at.slice(0, 10)
      : regulation?.created_at
        ? regulation.created_at.slice(0, 10)
        : '-',
  }));
}

function getRegulationUpdatedDate(regulation) {
  return regulation?.updated_at
    ? regulation.updated_at.slice(0, 10)
    : regulation?.created_at
      ? regulation.created_at.slice(0, 10)
      : '-';
}
function buildClubStats(statsData) {
  const activeMembers = statsData?.active_members ?? statsData?.activeMembers ?? '-';
  const totalMeetings = statsData?.total_meetings ?? statsData?.totalMeetings ?? '-';
  const settlementCompleted =
    statsData?.settlement_completed ?? statsData?.settlementCompleted ?? '-';

  return [
    { id: 'members', label: '활성 멤버', value: activeMembers },
    { id: 'meetings', label: '총 모임', value: totalMeetings },
    { id: 'settlement', label: '정산 완료', value: settlementCompleted },
  ];
};

export const clubUtils = {
  getClubStatusBadgeConfig,
  getClubMembershipStatusBadgeConfig,
  getClubTypeBadgeConfig,
  getClubRoleBadgeConfig,
  formatClubDate,
  normalizePaginatedResponse,
  getClubPageNumbers,
  getClubCardVariant,
  normalizeClubActivities,
  buildClubDetailDisplay,
  buildFeeSummary,
  normalizeFeeItem,
  normalizeClubMembers,
  buildMemberSummary,
  normalizeClubNotices,
  defaultClubRegisterErrors,
  buildClubRegisterPayload,
  normalizeClubRegulations,
  getRegulationUpdatedDate,
  buildClubStats,
};