import {
  clubMembershipStatusBadgeConfig,
  clubRoleBadgeConfig,
  clubStatusBadgeConfig,
  clubTypeBadgeConfig,
} from '../constants/clubConstants';
import { colors } from '../theme/colors';

import { extractList } from './responseUtils';

export const getClubStatusBadgeConfig = (status, clubDeletedAt) => {
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

export const getClubMembershipStatusBadgeConfig = (status) => {
  if (!status || status === 'null' || status === '') return null;
  const normalizedStatus = String(status).toUpperCase().trim();
  const validStatuses = ['APPROVED', 'ACTIVE', 'PENDING', 'REJECTED'];
  if (!validStatuses.includes(normalizedStatus)) return null;

  return clubMembershipStatusBadgeConfig[normalizedStatus] || null;
};

export const getClubTypeBadgeConfig = (type) => {
  const normalizedType = String(type || '').toUpperCase();
  return clubTypeBadgeConfig[normalizedType] || null;
};

export const getClubRoleBadgeConfig = (role) => {
  if (!role) return null;
  const normalizedRole = String(role).toUpperCase();
  return clubRoleBadgeConfig[normalizedRole] || clubRoleBadgeConfig.MEMBER;
};

export const formatClubDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ko-KR');
  } catch {
    return '-';
  }
};

export const normalizePaginatedResponse = (payload) => {
  if (Array.isArray(payload)) return { data: payload, total_pages: 1 };
  if (!payload || typeof payload !== 'object') return { data: [], total_pages: 1 };
  if (Array.isArray(payload.data)) return payload;
  const data = extractList(payload);
  const totalPages = payload.total_pages || payload.totalPages || 1;
  return { ...payload, data, total_pages: totalPages };
};
