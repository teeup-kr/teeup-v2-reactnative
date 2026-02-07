import { convertToKST, normalizeNumber, toDateTimeLocalValue } from "./meetingUtils";

export function getSocialMeetingTitle(isEditMode) { return isEditMode ? '소셜 모임 수정' : '소셜 모임 만들기'; }

export function buildSocialFormFromData({ data, fallback }) {
  return ({
    ...fallback,
    name: data.name ?? '',
    description: data.description ?? '',
    type: data.type || fallback.type,
    venue_name: data.venue_name ?? '',
    meeting_time: toDateTimeLocalValue(data.meeting_time),
    application_deadline: toDateTimeLocalValue(data.application_deadline),
    max_participants: data.max_participants !== undefined ? String(data.max_participants) : '',
    social_cost: data.social_cost !== undefined ? String(data.social_cost) : '',
    settlement_method: data.settlement_method ?? fallback.settlement_method,
    club_id: data.club_id ?? data.club?.id ?? '',
  });
}

export function getParticipantTypeFromData(data) { return data.max_participants && Number(data.max_participants) > 0 ? 'LIMITED' : 'ALL'; }

export function validateSocialForm({ form, participantType }) {
  const errors = {};

  if (!form.name.trim()) errors.name = '모임명을 입력해주세요.';
  if (!form.venue_name.trim()) errors.venue_name = '장소명을 입력해주세요.';
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

  const socialCost = normalizeNumber(form.social_cost, null);
  if (socialCost === null || Number.isNaN(socialCost) || socialCost < 0) {
    errors.social_cost = '참가 비용을 입력해주세요.';
  }

  if (participantType === 'LIMITED') {
    const maxParticipants = normalizeNumber(form.max_participants, 0);
    if (!maxParticipants || maxParticipants <= 0) {
      errors.max_participants = '참가자 수는 1명 이상이어야 합니다.';
    }
  }

  return errors;
};

export function resolveSocialSettlementMethod(method, settlementMethods) { return settlementMethods.some((item) => item.id === method) ? method : 'EQUAL_SPLIT'; }

export function buildSocialPayload({ form, participantType, settlementMethods }) {
  return ({
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    type: form.type,
    venue_name: form.venue_name.trim() || undefined,
    meeting_time: convertToKST(form.meeting_time),
    application_deadline: convertToKST(form.application_deadline),
    max_participants:
      participantType === 'ALL' ? 0 : normalizeNumber(form.max_participants, 0),
    social_cost: normalizeNumber(form.social_cost, 0),
    settlement_method: resolveSocialSettlementMethod(
      form.settlement_method,
      settlementMethods
    ),
    club_id: form.club_id || undefined,
  });
}

// export const socialFormUtils = {
//   getSocialMeetingTitle,
//   buildSocialFormFromData,
//   validateSocialForm,
//   buildSocialPayload,
// };