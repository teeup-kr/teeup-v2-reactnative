import { convertToKST, formatBirthdateForApi, normalizeNumber, parseTeeTimes, toDateTimeLocalValue, validateMeetingTimeWithTeeTimes } from '../util/meetingUtils';

export function getRoundingMeetingTitle(isEditMode) { return isEditMode ? '라운딩 모임 수정' : '라운딩 모임 만들기'; }

function normalizeParticipantId(item) {
  if (item === null || item === undefined) return null;
  if (typeof item === 'object') {
    const id = item.id ?? item.user_id ?? item.member_id ?? null;
    return id === null || id === undefined ? null : id;
  }
  return item;
}

function normalizeParticipantIds(items) {
  if (!Array.isArray(items)) return [];
  const unique = new Map();
  items.forEach((item) => {
    const id = normalizeParticipantId(item);
    if (id === null || id === undefined || id === '') return;
    unique.set(String(id), id);
  });
  return Array.from(unique.values());
}

function buildParticipantDetails(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      id: item.id ?? item.user_id ?? item.member_id,
      name:
        item.name ??
        item.user?.realname ??
        item.user?.nickname ??
        item.nickname ??
        '',
      gender: item.gender ?? null,
      handicap: item.handicap ?? item.handicap_index ?? null,
      club_id: item.club_id ?? item.club?.id ?? null,
      club_name: item.club_name ?? item.club?.name ?? '',
      is_me: Boolean(item.is_me),
    }))
    .filter((item) => item.id !== null && item.id !== undefined && item.id !== '');
}

export function buildRoundingFormFromData({ data, fallback }) {
  const normalizedParticipants = normalizeParticipantIds(data.selected_participants);
  const participantDetails =
    Array.isArray(data.selected_participant_details) && data.selected_participant_details.length > 0
      ? buildParticipantDetails(data.selected_participant_details)
      : buildParticipantDetails(data.selected_participants);

  const teeTimesArray = Array.isArray(data.tee_times)
    ? [...data.tee_times]
    : data.tee_times
      ? parseTeeTimes(String(data.tee_times))
      : [];

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
    tee_times: teeTimesArray,
    max_participants: data.max_participants !== undefined ? String(data.max_participants) : '',
    team_size: data.team_size !== undefined ? String(data.team_size) : '',
    team_formation_mode: data.team_formation_mode || fallback.team_formation_mode,
    meeting_subtype: data.meeting_subtype || fallback.meeting_subtype,
    green_fee: data.green_fee !== undefined ? String(data.green_fee) : '',
    caddy_fee: data.caddy_fee !== undefined ? String(data.caddy_fee) : '',
    cart_fee: data.cart_fee !== undefined ? String(data.cart_fee) : '',
    settlement_method: data.settlement_method || fallback.settlement_method,
    is_private: data.is_private ?? false,
    selected_participants: normalizedParticipants,
    selected_participant_details: participantDetails,
    selected_guests: data.selected_guests ?? [],
  });
}

function getTeeTimesArray(formTeeTimes) {
  if (Array.isArray(formTeeTimes)) {
    return formTeeTimes.map((t) => String(t).trim()).filter((t) => t.length > 0);
  }
  return parseTeeTimes(formTeeTimes);
}

export function validateRoundingForm(input) {
  const form = input?.form ?? input ?? {};
  console.log('Validating rounding form:', form);
  const errors = {};
  const teeTimes = getTeeTimesArray(form.tee_times);

  if (!form.name?.trim()) errors.name = '모임명을 입력해주세요.';
  if (!form.location?.trim()) errors.location = '장소를 입력해주세요.';
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
  if (!form.course_name?.trim()) errors.course_name = '골프장명을 입력해주세요.';
  if (!form.reservation_name?.trim()) errors.reservation_name = '예약자명을 입력해주세요.';
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

  // 프라이빗 라운딩 검증
  if (form.is_private) {
    const selectedParticipants = normalizeParticipantIds(form.selected_participants);
    if (selectedParticipants.length === 0) {
      errors.selected_participants = '프라이빗 라운딩은 최소 1명 이상의 참가자를 선택해야 합니다.';
    }
  }

  return errors;
};

export function resolveSettlementMethod(method, settlementMethods) { return settlementMethods.some((item) => item.id === method) ? method : 'EQUAL_SPLIT'; }

export function buildRoundingPayload({ form, settlementMethods }) {
  const teeTimes = getTeeTimesArray(form.tee_times);
  const greenFee = normalizeNumber(form.green_fee, 0);
  const caddyFee = normalizeNumber(form.caddy_fee, 0);
  const cartFee = normalizeNumber(form.cart_fee, 0);

  const payload = {
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
    is_private: form.is_private || false,
  };

  // 프라이빗 라운딩인 경우 참가자 및 게스트 정보 추가
  if (form.is_private) {
    const selectedParticipants = normalizeParticipantIds(form.selected_participants);
    if (selectedParticipants.length > 0) {
      payload.selected_participants = selectedParticipants;
    }

    const selectedGuests = Array.isArray(form.selected_guests) ? form.selected_guests : [];
    if (selectedGuests.length > 0) {
      payload.selected_guests = selectedGuests.map((guest) => {
        let birthdateValue = undefined;
        if (guest.birthdate) {
          const dateStr = String(guest.birthdate).trim();
          const apiFormatted = formatBirthdateForApi(dateStr);
          if (apiFormatted) {
            birthdateValue = apiFormatted;
          } else {
            birthdateValue = convertToKST(dateStr);
          }
        }
        return {
          name: guest.name?.trim(),
          birthdate: birthdateValue,
          gender: guest.gender,
          average_score: guest.average_score ? normalizeNumber(guest.average_score, 0) : undefined,
          handicap: guest.handicap ? normalizeNumber(guest.handicap, 0) : undefined,
        };
      }).filter((guest) => guest.name); // 이름이 있는 게스트만 포함
    }
  }

  return payload;
};

// export const roundingFormUtils = {
//   getRoundingMeetingTitle,
//   buildRoundingFormFromData,
//   validateRoundingForm,
//   buildRoundingPayload,
// };
