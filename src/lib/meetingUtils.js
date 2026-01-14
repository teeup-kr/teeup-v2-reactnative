import { colors } from '@/theme/colors';
export { extractData, extractList } from './responseUtils';

export const formatYmd = (date) => {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const parseYmd = (value) => {
  if (!value) return null;
  const [yyyy, mm, dd] = String(value).split('-').map((v) => Number(v));
  if (!yyyy || !mm || !dd) return null;
  return new Date(yyyy, mm - 1, dd);
};

export const isPastDateTime = (value) => {
  if (!value) return false;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date.getTime() <= Date.now();
  } catch {
    return false;
  }
};

export const getDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return null;
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end) {
    end.setHours(23, 59, 59, 999);
  }
  return { startDate: start, endDate: end };
};

export const filterByDate = (meetings, dateRange) => {
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

export const isMeetingActive = (meeting) => {
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

export const filterByStatus = (meetings, statusFilter) => {
  if (statusFilter === 'active') {
    return meetings.filter((meeting) => isMeetingActive(meeting));
  }
  return meetings.filter((meeting) => !isMeetingActive(meeting));
};

export const formatMeetingTime = (meetingTime) => {
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

export const formatMeetingTimeShort = (value) => {
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

export const formatCost = (cost) => {
  if (!cost) return '미정';
  try {
    return `${Number(cost).toLocaleString()}원`;
  } catch {
    return `${cost}원`;
  }
};

export const getMeetingTypeBadgeConfig = (type) => {
  const normalized = String(type || '').toUpperCase();
  if (normalized === 'SOCIAL') {
    return { text: '소셜', backgroundColor: colors.success[50], textColor: colors.success[700] };
  }
  return { text: '라운딩', backgroundColor: colors.info[50], textColor: colors.info[700] };
};

export const getMeetingStatusBadgeConfigs = (meeting) => {
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

export const getMeetingStatusKey = (meeting) => {
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

export const toDateTimeLocalValue = (value) => {
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

export const convertToKST = (value) => {
  if (!value) return undefined;
  const normalized = value.trim().replace(' ', 'T');
  if (normalized.includes('+') || normalized.endsWith('Z')) return normalized;
  if (normalized.length === 16) return `${normalized}:00+09:00`;
  return `${normalized}+09:00`;
};

export const normalizeNumber = (value, fallback = 0) => {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

export const parseTeeTimes = (value) =>
  value
    .split(',')
    .map((time) => time.trim())
    .filter((time) => time.length > 0);

export const validateMeetingTimeWithTeeTimes = (meetingTime, teeTimes) => {
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

export const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ko-KR');
};

export const formatMeetingListDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('ko-KR');
};
