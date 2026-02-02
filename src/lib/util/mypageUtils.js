
import { mypageApi } from '@/lib/api/api';
import { extractData } from '@/lib/util/responseUtils';

import { colors } from '../../styles/colors';
import {
  convertToKST,
  normalizeNumber,
  parseTeeTimes,
  toDateTimeLocalValue,
  validateMeetingTimeWithTeeTimes,
} from '../util/meetingUtils';

export function formatProfileDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('ko-KR');
};

export function getGenderLabel(gender) {
  if (!gender) return '-';
  const normalized = String(gender).toUpperCase();
  if (['M', 'MALE', '남성'].includes(normalized)) return '남성';
  if (['F', 'FEMALE', '여성'].includes(normalized)) return '여성';
  return gender;
};

export function normalizeGender(gender) {
  if (!gender) return 'none';
  const normalized = String(gender).toUpperCase();
  if (normalized === 'M' || normalized === 'MALE' || normalized === '남성') return 'male';
  if (normalized === 'F' || normalized === 'FEMALE' || normalized === '여성') return 'female';
  return 'none';
};

export function formatBirthdate(value) {
  if (!value) return '';
  if (typeof value === 'string' && value.includes('T')) {
    return value.split('T')[0];
  }
  return value;
};

export function calcHandicapFromAvg(avgStr) {
  const num = Number(avgStr);
  if (!avgStr || Number.isNaN(num)) return null;
  if (num < 55 || num > 144) return null;
  return Math.max(0, Math.min(72, Math.round(num - 72)));
};

// export function formatDateYYYYMMDD(date) {
//   if (!date) return '';
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const day = String(date.getDate()).padStart(2, '0');
//   return `${year}-${month}-${day}`;
// };
/**
 * Date / ISO string / datetime string → "YYYY-MM-DD"
 * - RN / Web 공통
 * - 잘못된 값은 빈 문자열 반환
 */
export function formatDateYYYYMMDD(value) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseBirthdate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function normalizeBirthdate(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = parseBirthdate(value);
  return parsed ? formatDateYYYYMMDD(parsed) : '';
};

export function getBirthDateValue(birthdate, fallback) {
  const parsed = parseBirthdate(birthdate);
  return parsed || fallback;
};

export function isNicknameSame(profileNickname, formNickname) {
  if (!profileNickname) return false;
  return profileNickname === (formNickname || '').trim();
};

export function buildProfileFormData(user, prevFormData) {
  const averageScore = user?.average_score != null ? String(user.average_score) : '';
  return {
    ...prevFormData,
    nickname: user?.nickname || '',
    realname: user?.realname || '',
    phone_number: user?.phone_number || '',
    birthdate: normalizeBirthdate(user?.birthdate),
    gender: user?.gender || '',
    average_score: averageScore,
    calculatedHandicap: calcHandicapFromAvg(averageScore),
  };
};

export function buildProfilePayload(formData, profile) {
  const payload = {
    nickname: formData.nickname.trim(),
    realname: formData.realname.trim(),
    phone_number: formData.phone_number.trim(),
    birthdate: formData.birthdate || null,
    gender: formData.gender || profile?.gender || null,
  };

  return payload;
};

export function validateProfileForm({
  formData,
  isNicknameSameValue,
  nicknameChecked,
}) {
  const nextErrors = {};
  const nickname = formData.nickname?.trim();

  if (!nickname) {
    nextErrors.nickname = '닉네임을 입력해주세요.';
  } else if (nickname.length < 2 || nickname.length > 20) {
    nextErrors.nickname = '닉네임은 2-20자여야 합니다.';
  } else if (!/^[a-zA-Z가-힣0-9]+$/.test(nickname)) {
    nextErrors.nickname = '닉네임은 영문, 한글, 숫자만 사용 가능합니다.';
  } else if (!isNicknameSameValue && !nicknameChecked) {
    nextErrors.nickname = '닉네임 중복확인을 해주세요.';
  }

  if (!formData.realname?.trim()) {
    nextErrors.realname = '실명을 입력해주세요.';
  }

  if (!formData.phone_number?.trim()) {
    nextErrors.phone_number = '전화번호를 입력해주세요.';
  }

  if (!formData.birthdate) {
    nextErrors.birthdate = '생년월일을 선택해주세요.';
  }

  return nextErrors;
};

export function validateChangePasswordForm(formData) {
  const errors = {};

  if (!formData.currentPassword) {
    errors.currentPassword = '현재 비밀번호를 입력해주세요.';
  }

  if (!formData.newPassword) {
    errors.newPassword = '새 비밀번호를 입력해주세요.';
  } else if (formData.newPassword.length < 6 || formData.newPassword.length > 32) {
    errors.newPassword = '비밀번호는 6~32자여야 합니다.';
  } else {
    const rules = [
      /[A-Z]/.test(formData.newPassword),
      /[a-z]/.test(formData.newPassword),
      /[0-9]/.test(formData.newPassword),
      /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword),
    ];
    if (rules.filter(Boolean).length < 2) {
      errors.newPassword = '영문 대/소문자, 숫자, 특수문자 중 2개 이상 포함해야 합니다.';
    }
    if (formData.newPassword === formData.currentPassword) {
      errors.newPassword = '현재 비밀번호와 달라야 합니다.';
    }
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = '비밀번호 확인을 입력해주세요.';
  } else if (formData.newPassword !== formData.confirmPassword) {
    errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
  }

  return errors;
};

export function getChangePasswordScreenError(formData) {
  if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
    return '모든 항목을 입력해주세요.';
  }
  if (formData.newPassword !== formData.confirmPassword) {
    return '새 비밀번호가 일치하지 않습니다.';
  }
  return '';
};

export function getHandicapDisplay(profile, handicapInfo) {
  if (!profile) {
    return { value: '-', badge: null, description: null, type: 'none' };
  }

  const hasCalculated =
    handicapInfo?.calculated_handicap != null &&
    handicapInfo?.handicap_calculation_count >= 1;

  if (hasCalculated) {
    return {
      value: handicapInfo.calculated_handicap.toFixed(1),
      badge: '자동 계산됨',
      description: `누적 평균으로 자동 계산됨 (${handicapInfo.handicap_calculation_count}회 기록)`,
      type: 'calculated',
    };
  }

  if (handicapInfo?.initial_handicap != null) {
    return {
      value: handicapInfo.initial_handicap.toFixed(1),
      badge: null,
      description: '초기 핸디캡',
      type: 'initial',
    };
  }

  if (profile?.handicap != null) {
    return {
      value: Number(profile.handicap).toFixed(1),
      badge: null,
      description: '기본 핸디캡',
      type: 'base',
    };
  }

  return { value: '-', badge: null, description: null, type: 'none' };
};

export function buildProfileInfoItems(profile, { formatProfileDate, getGenderLabel }) {
  return [
    { label: '실명', value: profile?.realname || '-' },
    { label: '닉네임', value: profile?.nickname || '-' },
    { label: '이메일', value: profile?.email || '-' },
    { label: '연락처', value: profile?.phone_number || '-' },
    { label: '성별', value: getGenderLabel(profile?.gender) },
    { label: '생년월일', value: formatProfileDate(profile?.birthdate) },
    { label: '가입일', value: formatProfileDate(profile?.created_at) },
  ];
}

export function getProfileInfoIconName(label) {
  if (label === '이메일') return 'envelope';
  if (label === '성별') return 'venus-mars';
  if (label === '생년월일') return 'calendar-alt';
  if (label === '가입일') return 'calendar-check';
  if (label === '연락처') return 'phone';
  if (label === '닉네임') return 'id-card';
  return 'user-alt';
};
export function toYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function fromYmd(value) { return (value ? new Date(`${value}T00:00:00`) : new Date()); }

export function hasMeetingFilters({ typeFilter, startDate, endDate }) { return typeFilter !== 'all' || startDate !== '' || endDate !== ''; }

export function formatNotificationDate(dateString) {
  try {
    if (!dateString) return '날짜 정보 없음';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '날짜 정보 없음';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '날짜 정보 없음';
  }
};

export function isUnreadNotification(notification) { return notification.status === 'UNREAD' || !notification.read_at; }

export function getNotificationIcon(type) {
  switch (type) {
    case 'CLUB_MEMBERSHIP_APPROVED':
    case 'CLUB_MEMBERSHIP_REJECTED':
    case 'CLUB_MEMBERSHIP_REQUEST':
    case 'CLUB_INVITATION':
      return { name: 'users', color: colors.blue[600] };
    case 'MEETING_REMINDER':
    case 'MEETING_CANCELLATION':
    case 'MEETING_COMPLETED':
    case 'TEAM_FORMATION_COMPLETED':
      return { name: 'calendar-alt', color: colors.emerald[600] };
    case 'NEW_NOTICE':
      return { name: 'file-alt', color: colors.yellow[600] };
    case 'MEETING_SETTLEMENT_COMPLETED':
    case 'SOCIAL_SETTLEMENT_COMPLETED':
      return { name: 'money-bill-wave', color: colors.violet[600] };
    default:
      return { name: 'bell', color: colors.neutral[600] };
  }
};

export const notificationTypeLabels = {
  all: '전체 타입',
  CLUB_MEMBERSHIP_APPROVED: '클럽 가입 승인',
  CLUB_MEMBERSHIP_REJECTED: '클럽 가입 거절',
  CLUB_MEMBERSHIP_REQUEST: '가입 신청',
  MEETING_REMINDER: '모임 알림',
  TEAM_FORMATION_COMPLETED: '팀 편성 완료',
  NEW_NOTICE: '공지사항',
  MEETING_SETTLEMENT_COMPLETED: '정산 완료',
  SOCIAL_SETTLEMENT_COMPLETED: '소셜 정산 완료',
};
export function asNumber(value, fallback = 0) {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(number) ? number : fallback;
};

export function pickData(response) {
  if (!response) return null;
  if (response.data !== undefined) return response.data;
  return response;
};

export function formatKoreanDate(dateLike) {
  if (!dateLike) return '-';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일`;
};

export function getGrossScoreHandicap(grossScore) {
  if (!grossScore) return null;
  const gross = parseInt(grossScore, 10);
  if (Number.isNaN(gross)) return null;
  const handicap = gross - 72;
  const clamped = Math.max(0, Math.min(72, handicap));
  return clamped.toFixed(1);
};

export function getRecordErrorMessage(error) { return error?.response?.data?.detail || error?.message || '알 수 없는 오류가 발생했습니다.'; }
export function getWithdrawValidationError({ agreed, confirmText }) {
  if (!agreed) return '안내사항에 동의해주세요.';
  if (confirmText !== '회원탈퇴') return '정확히 \"회원탈퇴\"를 입력해주세요.';
  return '';
};

export function getRoundingMeetingTitle(isEditMode) { return isEditMode ? '라운딩 모임 수정' : '라운딩 모임 만들기'; }

export function buildRoundingFormFromData({ data, fallback }) {
  return ({
    ...fallback,
    name: data.name ?? '',
    description: data.description ?? '',
    location: data.location ?? '',
    meeting_time: toDateTimeLocalValue(data.meeting_time),
    application_deadline: toDateTimeLocalValue(data.application_deadline),
    club_id: data.club_id ?? data.club?.id ?? '',
    course_name: data.course_name ?? '',
    reservation_name: data.reservation_name ?? '',
    hole_count: data.hole_count ? String(data.hole_count) : '18',
    tee_times: Array.isArray(data.tee_times) ? data.tee_times.join(', ') : data.tee_times ?? '',
    max_participants: data.max_participants !== undefined ? String(data.max_participants) : '',
    team_size: data.team_size !== undefined ? String(data.team_size) : '',
    team_formation_mode: data.team_formation_mode || fallback.team_formation_mode,
    meeting_subtype: data.meeting_subtype || fallback.meeting_subtype,
    green_fee: data.green_fee !== undefined ? String(data.green_fee) : '',
    caddy_fee: data.caddy_fee !== undefined ? String(data.caddy_fee) : '',
    cart_fee: data.cart_fee !== undefined ? String(data.cart_fee) : '',
    settlement_method: data.settlement_method || fallback.settlement_method,
  });
}

export function validateRoundingForm(form) {
  const errors = {};
  const teeTimes = parseTeeTimes(form.tee_times);

  if (!form.name.trim()) errors.name = '모임명을 입력해주세요.';
  if (!form.location.trim()) errors.location = '장소를 입력해주세요.';
  if (!form.meeting_time) errors.meeting_time = '모임 시간을 입력해주세요.';
  if (!form.application_deadline) errors.application_deadline = '신청 마감일을 입력해주세요.';
  if (form.meeting_time && form.application_deadline) {
    const meetingDate = new Date(form.meeting_time);
    const deadlineDate = new Date(form.application_deadline);
    if (!Number.isNaN(meetingDate.getTime()) && !Number.isNaN(deadlineDate.getTime())) {
      if (meetingDate < deadlineDate) {
        errors.application_deadline = '신청 마감일은 모임 시간 이전이어야 합니다.';
      }
    }
  }
  if (!form.club_id) errors.club_id = '클럽을 선택해주세요.';
  if (!form.course_name.trim()) errors.course_name = '골프장명을 입력해주세요.';
  if (!form.reservation_name.trim()) errors.reservation_name = '예약자명을 입력해주세요.';
  if (teeTimes.length === 0) errors.tee_times = '티타임을 입력해주세요.';
  if (form.meeting_time && teeTimes.length > 0) {
    if (!validateMeetingTimeWithTeeTimes(form.meeting_time, teeTimes)) {
      errors.meeting_time = '모임 시간은 티업 시간보다 이전이어야 합니다.';
    }
  }

  const maxParticipants = normalizeNumber(form.max_participants, 0);
  const teamSize = normalizeNumber(form.team_size, 0);
  if (!maxParticipants || maxParticipants <= 0) {
    errors.max_participants = '최대 참가자 수는 1명 이상이어야 합니다.';
  }
  if (!teamSize || teamSize <= 0) {
    errors.team_size = '한 조당 인원 수는 1명 이상이어야 합니다.';
  }
  if (maxParticipants && teamSize && teamSize > maxParticipants) {
    errors.team_size = '한 조당 인원 수는 최대 참가자 수보다 클 수 없습니다.';
  }

  const greenFee = normalizeNumber(form.green_fee, -1);
  const caddyFee = normalizeNumber(form.caddy_fee, -1);
  const cartFee = normalizeNumber(form.cart_fee, -1);
  if (greenFee <= 0) errors.green_fee = '그린피를 입력해주세요.';
  if (caddyFee <= 0) errors.caddy_fee = '캐디피를 입력해주세요.';
  if (cartFee <= 0) errors.cart_fee = '카트비를 입력해주세요.';

  const holeCount = normalizeNumber(form.hole_count, 18);
  if (holeCount < 1) {
    errors.hole_count = '홀 수는 1 이상이어야 합니다.';
  }

  return errors;
};

export function resolveSettlementMethod(method, settlementMethods) { return settlementMethods.some((item) => item.id === method) ? method : 'EQUAL_SPLIT'; }

export function buildRoundingPayload({ form, settlementMethods }) {
  const teeTimes = parseTeeTimes(form.tee_times);
  const greenFee = normalizeNumber(form.green_fee, 0);
  const caddyFee = normalizeNumber(form.caddy_fee, 0);
  const cartFee = normalizeNumber(form.cart_fee, 0);

  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    location: form.location.trim() || undefined,
    meeting_time: convertToKST(form.meeting_time),
    application_deadline: convertToKST(form.application_deadline),
    club_id: form.club_id || undefined,
    course_name: form.course_name.trim() || undefined,
    reservation_name: form.reservation_name.trim() || undefined,
    hole_count: normalizeNumber(form.hole_count, 18),
    tee_times: teeTimes,
    max_participants: normalizeNumber(form.max_participants, 0),
    team_size: normalizeNumber(form.team_size, 0),
    team_formation_mode: form.team_formation_mode,
    meeting_subtype: form.meeting_subtype,
    green_fee: greenFee,
    caddy_fee: caddyFee,
    cart_fee: cartFee,
    total_cost: greenFee + caddyFee + cartFee,
    settlement_method: resolveSettlementMethod(
      form.settlement_method,
      settlementMethods
    ),
  };
};

export async function ensureProfileCompleted({
  router,
  alertMessage = '클럽 이용 전 프로필을 완성해 주세요!',
  redirectPath = '/mypage/edit',
}) {
  try {
    const response = await mypageApi.fetchMyProfile();
    const user = extractData(response);

    if (!user) {
      alert('사용자 정보를 불러올 수 없습니다.');
      return false;
    }

    const {
      realname,
      phone_number,
      gender,
      birthdate,
      average_score,
    } = user;

    const requiredFields = [
      realname,
      phone_number,
      gender,
      birthdate,
      average_score,
    ];

    const isCompleted = !requiredFields.some(
      v => v == null || v === ''
    );

    if (!isCompleted) {
      alert(alertMessage);
      router.replace(redirectPath);
      return false;
    }

    return true;
  } catch (error) {
    console.error('프로필 완성 여부 확인 실패:', error);
    alert('프로필 정보를 확인할 수 없습니다.');
    return false;
  }
}
// export const mypageUtils = {
//   formatProfileDate,
//   getGenderLabel,
//   normalizeGender,
//   formatBirthdate,
//   isSocialLoginUser,
//   calcHandicapFromAvg,
//   formatDateYYYYMMDD,
//   parseBirthdate,
//   normalizeBirthdate,
//   getBirthDateValue,
//   isNicknameSame,
//   buildProfileFormData,
//   buildProfilePayload,
//   validateProfileForm,
//   validateChangePasswordForm,
//   getChangePasswordScreenError,
//   getHandicapDisplay,
//   buildProfileInfoItems,
//   getProfileInfoIconName,
//   toYmd,
//   fromYmd,
//   hasMeetingFilters,
//   formatNotificationDate,
//   isUnreadNotification,
//   getNotificationIcon,
//   notificationTypeLabels,
//   asNumber,
//   pickData,
//   formatKoreanDate,
//   getGrossScoreHandicap,
//   getRecordErrorMessage,
//   getWithdrawValidationError,
//   getRoundingMeetingTitle,
//   buildRoundingFormFromData,
//   validateRoundingForm,
//   resolveSettlementMethod,
//   buildRoundingPayload,
// };

export function getAverageScoreDisplay(profile) {
  if (!profile) {
    return { label: '평균 타수', value: '-' };
  }

  if (profile.average_score != null) {
    return {
      label: '평균 타수',
      value: `${profile.average_score}타`,
    };
  }

  if (profile.average_score_init != null) {
    return {
      label: '초기 평균 타수',
      value: `${profile.average_score_init}타`,
    };
  }

  return {
    label: '평균 타수',
    value: '-',
  };
}

export function getHandicapDisplayInfo(profile) {
  if (!profile) {
    return { label: '핸디캡', value: '-' };
  }

  if (profile.handicap != null) {
    return {
      label: '핸디캡',
      value: profile.handicap,
    };
  }

  if (profile.handicap_init != null) {
    return {
      label: '초기 핸디캡',
      value: profile.handicap_init,
    };
  }

  return {
    label: '핸디캡',
    value: '-',
  };
}
