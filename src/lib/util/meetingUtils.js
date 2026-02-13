import { colors } from '../../styles/colors';

import { extractData, extractList } from './responseUtils';

export { extractData, extractList };

export function formatYmd(date) {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export function parseYmd(value) {
  if (!value) return null;
  const [yyyy, mm, dd] = String(value).split('-').map((v) => Number(v));
  if (!yyyy || !mm || !dd) return null;
  return new Date(yyyy, mm - 1, dd);
};

/** 입력용: 숫자만 남기고 최대 8자리 (YYYYMMDD) */
export function normalizeBirthdateInput(value) {
  if (value == null || value === '') return '';
  const digits = String(value).replace(/\D/g, '').slice(0, 8);
  return digits;
}

const BIRTHDATE_YEAR_MIN = 1900;
const BIRTHDATE_YEAR_MAX = new Date().getFullYear();

/** 생년월일이 유효한 범위(1900~올해, 올바른 월/일)인지 검사 */
function isValidBirthdate(yyyy, mm, dd) {
  const year = Number(yyyy);
  const month = Number(mm);
  const day = Number(dd);
  if (year < BIRTHDATE_YEAR_MIN || year > BIRTHDATE_YEAR_MAX) return false;
  if (month < 1 || month > 12) return false;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return false;
  return true;
}

/** API 전송용: 8자리(YYYYMMDD) 또는 YYYY-MM-DD → YYYY-MM-DD(유효할 때만), 그 외 null */
export function formatBirthdateForApi(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  let yyyy; let mm; let dd;
  if (digits.length === 8) {
    yyyy = digits.slice(0, 4);
    mm = digits.slice(4, 6);
    dd = digits.slice(6, 8);
  } else if (trimmed.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    [yyyy, mm, dd] = trimmed.split('-');
  } else {
    return null;
  }
  if (!isValidBirthdate(yyyy, mm, dd)) return null;
  return `${yyyy}-${mm}-${dd}`;
}

export function isPastDateTime(value) {
  if (!value) return false;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date.getTime() <= Date.now();
  } catch {
    return false;
  }
};

export function getDateRange(startDate, endDate) {
  if (!startDate && !endDate) return null;
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end) {
    end.setHours(23, 59, 59, 999);
  }
  return { startDate: start, endDate: end };
};

export function filterByDate(meetings, dateRange) {
  if (!dateRange || (!dateRange.startDate && !dateRange.endDate)) return meetings;
  return meetings.filter((meeting) => {
    if (!meeting?.meeting_time) return false;
    const meetingDate = new Date(meeting.meeting_time);
    if (Number.isNaN(meetingDate.getTime())) return false;

    if (dateRange.startDate && dateRange.endDate) {
      return meetingDate >= dateRange.startDate && meetingDate <= dateRange.endDate;
    }
    if (dateRange.startDate) {
      return meetingDate >= dateRange.startDate;
    }
    if (dateRange.endDate) {
      return meetingDate <= dateRange.endDate;
    }
    return true;
  });
};

export function isMeetingActive(meeting) {
  const status = meeting?.status;
  const participantCount = meeting?.participant_count || 0;
  const applicationDeadline = meeting?.application_deadline;
  const applicationClosedEarly = meeting?.application_closed_early || false;
  const meetingType = meeting?.meeting_type || meeting?.type;
  const isRoundingMeeting = meetingType === 'ROUND' || meetingType === 'ROUNDING';
  const meetingTime = meeting?.meeting_time;
  const settlementConfirmed = meeting?.settlement_confirmed;
  const roundingCompletedAt = meeting?.rounding_completed_at;

  const isMinParticipantsNotMet = isRoundingMeeting
    ? participantCount >= 1 && participantCount <= 3
    : participantCount === 1;

  const isDeadlinePassed = applicationDeadline ? isPastDateTime(applicationDeadline) : false;
  const isApplicationClosed = isDeadlinePassed || applicationClosedEarly;

  const isCanceled =
    status === 'CANCELED' || (status === 'SCHEDULED' && isApplicationClosed && isMinParticipantsNotMet);

  if (settlementConfirmed === true) {
    return false;
  }

  if (meeting?.is_completed === true) {
    return false;
  }

  if (status === 'COMPLETED') {
    return false;
  }

  const isMeetingTimePassed = meetingTime ? isPastDateTime(meetingTime) : false;

  if (isRoundingMeeting) {
    if (roundingCompletedAt) {
      return false;
    }
    if (isMeetingTimePassed && !roundingCompletedAt) {
      return false;
    }
  } else if (isMeetingTimePassed) {
    return false;
  }

  return !isCanceled;
};

export function filterByStatus(meetings, statusFilter) {
  if (statusFilter === 'active') {
    return meetings.filter((meeting) => isMeetingActive(meeting));
  }
  return meetings.filter((meeting) => !isMeetingActive(meeting));
};

export function formatMeetingTime(meetingTime) {
  try {
    if (!meetingTime) return meetingTime;
    const date = new Date(meetingTime);
    if (Number.isNaN(date.getTime())) return meetingTime;

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');

    return `${yyyy}년 ${mm}월 ${dd}일 ${hh}:${min}`;
  } catch {
    return meetingTime;
  }
};

export function formatMeetingTimeShort(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function formatCost(cost) {
  if (!cost) return '미정';
  try {
    return `${Number(cost).toLocaleString()}원`;
  } catch {
    return `${cost}원`;
  }
};

export function getMeetingTypeBadgeConfig(type) {
  const normalized = String(type || '').toUpperCase();
  if (normalized === 'SOCIAL') {
    return { text: '소셜', backgroundColor: colors.success[50], textColor: colors.success[700] };
  }
  return { text: '라운딩', backgroundColor: colors.info[50], textColor: colors.info[700] };
};

export function getMeetingStatusBadgeConfigs(meeting) {
  const status = meeting?.status;
  const participantCount = meeting?.participant_count || 0;
  const applicationDeadline = meeting?.application_deadline;
  const applicationClosedEarly = meeting?.application_closed_early || false;
  const meetingType = meeting?.meeting_type || meeting?.type;
  const isRoundingMeeting = meetingType === 'ROUND' || meetingType === 'ROUNDING';
  const meetingTime = meeting?.meeting_time;

  const isMinParticipantsNotMet = isRoundingMeeting
    ? participantCount >= 1 && participantCount <= 3
    : participantCount === 1;

  const isDeadlinePassed = applicationDeadline ? isPastDateTime(applicationDeadline) : false;
  const isApplicationClosed = isDeadlinePassed || applicationClosedEarly;
  const isMeetingTimePassed = meetingTime ? isPastDateTime(meetingTime) : false;

  const isMeetingCompleted =
    meeting?.is_completed === true || meeting?.status === 'COMPLETED' || isMeetingTimePassed;

  const isCanceled =
    status === 'CANCELED' || (status === 'SCHEDULED' && isApplicationClosed && isMinParticipantsNotMet);

  if (isCanceled) {
    return [{ key: 'canceled', text: '취소', backgroundColor: colors.error[50], textColor: colors.error[700] }];
  }

  if (meeting?.settlement_confirmed === true) {
    return [{ key: 'closed', text: '종료', backgroundColor: colors.success[50], textColor: colors.success[700] }];
  }

  if (isRoundingMeeting && isMeetingTimePassed && !meeting?.rounding_completed_at) {
    return [
      {
        key: 'not-started',
        text: '미진행',
        backgroundColor: colors.neutral[100],
        textColor: colors.neutral[700],
      },
    ];
  }

  if (status === 'IN_PROGRESS') {
    return [
      {
        key: 'in-progress',
        text: '진행중',
        backgroundColor: colors.warning[50],
        textColor: colors.warning[700],
      },
    ];
  }

  if (meeting?.settlement_confirmed === false && Array.isArray(meeting?.teams) && meeting.teams.length > 0) {
    return [
      {
        key: 'done',
        text: '완료',
        backgroundColor: colors.success[50],
        textColor: colors.success[700],
      },
    ];
  }

  const isApplicationClosedStatus = status === 'SCHEDULED' && isApplicationClosed && !isMinParticipantsNotMet;
  const badges = [];

  if (isApplicationClosedStatus) {
    badges.push({
      key: 'closed-recruit',
      text: '모집마감',
      backgroundColor: colors.warning[50],
      textColor: colors.warning[700],
    });
  }

  if (isMeetingCompleted && !isCanceled) {
    badges.push({
      key: 'meeting-done',
      text: '모임완료',
      backgroundColor: colors.success[50],
      textColor: colors.success[700],
    });
  }

  if (!isApplicationClosedStatus && !isMeetingCompleted) {
    badges.push({
      key: 'scheduled',
      text: '예정',
      backgroundColor: colors.info[50],
      textColor: colors.info[700],
    });
  }

  return badges;
};

export function getMeetingStatusKey(meeting) {
  if (!meeting) return 'UPCOMING';

  if (meeting.settlement_confirmed) {
    return 'COMPLETED';
  }

  if (meeting.rounding_completed_at || meeting.is_completed) {
    return 'COMPLETED';
  }

  const applicationClosed =
    meeting.application_closed_early ||
    (meeting.application_deadline && isPastDateTime(meeting.application_deadline));

  if (applicationClosed) {
    return 'CLOSED';
  }

  if (meeting.meeting_time && isPastDateTime(meeting.meeting_time)) {
    return 'COMPLETED';
  }

  return 'UPCOMING';
};

export function toDateTimeLocalValue(value) {
  if (!value) return '';
  const safeValue = typeof value === 'string' && value.includes(' ') ? value.replace(' ', 'T') : value;
  const date = new Date(safeValue);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function convertToKST(value) {
  if (!value) return undefined;
  const normalized = value.trim().replace(' ', 'T');
  if (normalized.includes('+') || normalized.endsWith('Z')) return normalized;
  if (normalized.length === 16) return `${normalized}:00+09:00`;
  return `${normalized}+09:00`;
};

export function normalizeNumber(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

export function parseTeeTimes(value) {
  console.log('parseTeeTimes input:', value);
  if (Array.isArray(value)) {
    return value
      .map((time) => String(time).trim())
      .filter((time) => time.length > 0);
  }
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(',')
    .map((time) => time.trim())
    .filter((time) => time.length > 0);
}

export function validateMeetingTimeWithTeeTimes(meetingTime, teeTimes) {
  if (!meetingTime || teeTimes.length === 0) return true;
  const meetingDate = new Date(meetingTime);
  if (Number.isNaN(meetingDate.getTime())) return true;
  const meetingDateStr = meetingTime.includes('T') ? meetingTime.split('T')[0] : meetingTime.substring(0, 10);
  const earliest = [...teeTimes].sort()[0];
  if (!earliest) return true;
  const [teeHour, teeMinute] = earliest.split(':').map(Number);
  if (Number.isNaN(teeHour) || Number.isNaN(teeMinute)) return true;
  const teeDateTime = new Date(`${meetingDateStr}T00:00:00`);
  teeDateTime.setHours(teeHour, teeMinute, 0, 0);
  return meetingDate < teeDateTime;
};

export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ko-KR');
};

export function formatMeetingListDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('ko-KR');
};
export function getPageNumbers({ currentPage, totalPages }) {
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

export function getActiveFilters({
  activeTab,
  roundingSearchQuery,
  roundingStartDate,
  roundingEndDate,
  socialSearchQuery,
  socialStartDate,
  socialEndDate,
  participatingSearchQuery,
  participatingStartDate,
  participatingEndDate,
}) {
  if (activeTab === 'rounding') {
    return Boolean(roundingSearchQuery || roundingStartDate || roundingEndDate);
  }
  if (activeTab === 'social') {
    return Boolean(socialSearchQuery || socialStartDate || socialEndDate);
  }
  return Boolean(participatingSearchQuery || participatingStartDate || participatingEndDate);
};
export function getTypeSlug(meetingType) { return meetingType === 'social' ? 'social' : 'rounding'; }

export function getMeetingDomainType(typeSlug) { return typeSlug === 'social' ? 'SOCIAL' : 'ROUND'; }

/**
 * API 응답에서 meeting_type / settlement_method 등이 문자열("ROUND") 또는 Enum 직렬화 객체로 올 수 있음.
 * 항상 문자열로 비교할 수 있도록 값만 추출.
 */
export function normalizeEnumValue(v) {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  return v?.value ?? null;
}

/** meeting의 모임 타입 문자열 (ROUND / SOCIAL) */
export function getMeetingTypeValue(meeting) {
  return normalizeEnumValue(meeting?.meeting_type ?? meeting?.type) ?? null;
}

/** meeting의 정산 방법 문자열 (EQUAL_SPLIT / INDIVIDUAL 등) */
export function getSettlementMethodValue(meeting) {
  return normalizeEnumValue(meeting?.settlement_method) ?? null;
}

export function getMyParticipantId({ user, participants }) {
  if (!user?.id) return null;
  const match = participants.find((participant) => participant.user_id === user.id);
  return match?.id || null;
};

export function getCurrentHandicap(handicapInfo) { return handicapInfo?.calculated_handicap ?? handicapInfo?.initial_handicap ?? null; }

export function buildUserInfoFromProfile(profile) {
  return ({
    realname: profile?.realname || '',
    average_score: profile?.average_score || '',
    phone_number: profile?.phone_number || '',
    birthdate: profile?.birthdate ? profile.birthdate.split('T')[0] : '',
    gender: profile?.gender || '',
    handicap: '',
  });
}

export function getIsJoined({ participants, user }) { return participants.some((participant) => participant.user_id === user?.id); }

export function getUserRole({ meeting, user }) { return meeting?.user_role || meeting?.role || user?.role; }
export function getExpenseAmountValue(expense) { return expense?.amount ?? expense?.price ?? expense?.cost; }

export function formatExpenseAmount(expense) {
  const value = getExpenseAmountValue(expense);
  return value !== undefined && value !== null
    ? `${Number(value).toLocaleString('ko-KR')}원`
    : '-';
};

export function getExpenseLabel(expense) { return expense?.label || expense?.title || '경비'; }

export function getTotalExpenseAmount(expenses) {
  const amounts = expenses
    .map((expense) => {
      const value = getExpenseAmountValue(expense);
      return value !== undefined && value !== null ? Number(value) : null;
    })
    .filter((value) => Number.isFinite(value));
  if (amounts.length === 0) return '-';
  const total = amounts.reduce((sum, value) => sum + value, 0);
  return `${total.toLocaleString('ko-KR')}원`;
};

export function normalizeMyMeetings(meetings) {
  return meetings.map((meeting) => {
    const meetingType = getMeetingTypeValue(meeting) || meeting?.meeting_type || meeting?.type || 'ROUND';
    const typeSlug = meetingType === 'ROUND' || meetingType === 'ROUNDING' ? 'rounding' : 'social';
    return {
      id: meeting?.id || meeting?.meeting_id,
      name: meeting?.meeting_name || meeting?.title || '모임',
      type: typeSlug,
      date: formatMeetingListDate(meeting?.meeting_time || meeting?.date),
      status: meeting?.status || meeting?.application_status || '-',
    };
  });
}
export function normalizePlayers(participants) {
  return participants.map((participant) => ({
    id: participant?.id || participant?.participant_id || participant?.user_id,
    name:
      participant?.user?.name ||
      participant?.user?.realname ||
      participant?.user?.nickname ||
      participant?.name ||
      participant?.nickname ||
      '-',
    score:
      participant?.score ??
      participant?.total_score ??
      participant?.simple_score ??
      participant?.average_score ??
      '',
  }));
}
export function getParticipantsFromResponse(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

export function buildMeetingStats({ participants, meeting }) {
  const participantCount = participants.length;
  const scoreValues = participants
    .map((participant) => {
      const score = participant?.score ?? participant?.total_score ?? participant?.average_score;
      return score !== undefined && score !== null ? Number(score) : null;
    })
    .filter((value) => Number.isFinite(value));
  const average = scoreValues.length
    ? (scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length).toFixed(1)
    : meeting?.average_score ?? '-';
  const best = scoreValues.length ? Math.min(...scoreValues) : meeting?.best_score ?? '-';

  return [
    { id: 'participants', label: '참가자', value: `${participantCount}명` },
    { id: 'average', label: '평균 타수', value: average },
    { id: 'best', label: '베스트 스코어', value: best },
  ];
};

// export const meetingUtils = {
//   formatYmd,
//   parseYmd,
//   isPastDateTime,
//   getDateRange,
//   filterByDate,
//   filterByStatus,
//   formatMeetingTime,
//   formatMeetingTimeShort,
//   formatCost,
//   getMeetingTypeBadgeConfig,
//   getMeetingStatusBadgeConfigs,
//   getMeetingStatusKey,
//   toDateTimeLocalValue,
//   convertToKST,
//   normalizeNumber,
//   parseTeeTimes,
//   validateMeetingTimeWithTeeTimes,
//   formatDateTime,
//   formatMeetingListDate,
//   getPageNumbers,
//   getActiveFilters,
//   getTypeSlug,
//   getMeetingDomainType,
//   getMyParticipantId,
//   getCurrentHandicap,
//   buildUserInfoFromProfile,
//   getIsJoined,
//   getUserRole,
//   formatExpenseAmount,
//   getExpenseLabel,
//   getTotalExpenseAmount,
//   normalizeMyMeetings,
//   normalizePlayers,
//   getParticipantsFromResponse,
//   buildMeetingStats,
// };
