import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView, StyleSheet, Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DateTimeField from '@/components/ui/DateTimeField';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SelectableChip from '@/components/ui/SelectableChip';
import { socialSettlementMethods, socialTypeOptions } from '@/constants/meetingConstants';
import { meetingsApi } from '@/lib/api/api';
import {
  createFetchClubsHandler,
  createFetchMeetingHandler,
  createParticipantTypeHandler,
  createSubmitHandler,
} from '@/lib/handler/meetings';
import { backOrHome } from '@/lib/navigation/cappedHistory';
import { confirmDiscardDraft } from '@/lib/util/confirmDiscard';
import { extractData, extractList } from '@/lib/util/meetingUtils';
import {
  buildSocialFormFromData,
  buildSocialPayload,
  getParticipantTypeFromData,
  getSocialMeetingTitle,
  normalizeMaxParticipantsInput,
  validateSocialForm,
} from '@/lib/util/socialForm';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';





export function SocialForm({ mode = 'create' }) {
  const router = useRouter();
  const { meetingId } = useLocalSearchParams();
  const meetingIdValue = Array.isArray(meetingId) ? meetingId[0] : meetingId;
  const isEditMode = mode === 'edit';

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'CASUAL',
    venue_name: '',
    meeting_time: '',
    application_deadline: '',
    max_participants: '',
    social_cost: '',
    settlement_method: 'EQUAL_SPLIT',
    club_id: '',
    social_notes: '',
  });
  const [participantType, setParticipantType] = useState('ALL');
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const hasDraft = useMemo(
    () =>
      Boolean(
        form.name.trim() ||
          form.description.trim() ||
          form.venue_name.trim() ||
          form.meeting_time ||
          form.application_deadline ||
          form.club_id ||
          form.max_participants ||
          form.social_notes.trim()
      ),
    [form]
  );

  const handleFieldChange = useMemo(
    () =>
      (field) =>
        (value) => {
          if (field === 'max_participants') {
            const nextValue = String(value ?? '');
            const digitsOnly = nextValue.replace(/\D/g, '');

            setForm((prev) => ({ ...prev, [field]: digitsOnly }));
            setFieldErrors((prev) => {
              if (nextValue !== digitsOnly) {
                return { ...prev, max_participants: '숫자만 입력해주세요.' };
              }
              if (!prev.max_participants) return prev;
              const nextErrors = { ...prev };
              delete nextErrors.max_participants;
              return nextErrors;
            });
            return;
          }
          setForm((prev) => ({ ...prev, [field]: value }));
        },
    [setForm, setFieldErrors]
  );
  const handleTypeSelect = useMemo(
    () =>
      (value) =>
        () => {
          handleFieldChange('type')(value);
        },
    [handleFieldChange]
  );
  const handleClubSelect = useMemo(
    () =>
      (value) =>
        () => {
          handleFieldChange('club_id')(value);
        },
    [handleFieldChange]
  );
  const handleSettlementSelect = useMemo(
    () =>
      (value) =>
        () => {
          handleFieldChange('settlement_method')(value);
        },
    [handleFieldChange]
  );
  const handleParticipantTypeSelect = useMemo(
    () => createParticipantTypeHandler({ setParticipantType, onChange: handleFieldChange }),
    [setParticipantType, handleFieldChange]
  );
  const handleMaxParticipantsChange = useCallback(
    (raw) => {
      const normalized = normalizeMaxParticipantsInput(raw);
      setForm((prev) => ({ ...prev, max_participants: normalized }));
    },
    [setForm]
  );

  const meetingTitle = useMemo(
    () => getSocialMeetingTitle(isEditMode),
    [isEditMode]
  );
  const canCreateMeeting = useMemo(
    () => isEditMode || clubs.length > 0,
    [isEditMode, clubs.length]
  );

  const fetchClubs = useMemo(
    () =>
      createFetchClubsHandler({
        fetchMyClubs: meetingsApi.fetchMyClubs,
        extractList,
        isEditMode,
        onlyManageableClubs: !isEditMode,
        setClubs,
        setClubsLoading,
        setForm,
      }),
    [isEditMode, setClubs, setClubsLoading, setForm]
  );

  const fetchMeeting = useMemo(
    () =>
      createFetchMeetingHandler({
        isEditMode,
        meetingIdValue,
        fetchSocial: meetingsApi.fetchSocial,
        extractData,
        setForm,
        setLoading,
        setParticipantType,
        alert: Alert.alert,
        buildFormFromData: buildSocialFormFromData,
        getParticipantType: getParticipantTypeFromData,
      }),
    [isEditMode, meetingIdValue, setForm, setLoading, setParticipantType]
  );

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  useEffect(() => {
    const relationError = '신청 마감일은 모임 시간 이전이어야 합니다.';

    setFieldErrors((prev) => {
      const hasRelationError = prev.application_deadline === relationError;

      if (!form.meeting_time || !form.application_deadline) {
        if (!hasRelationError) return prev;
        const nextErrors = { ...prev };
        delete nextErrors.application_deadline;
        return nextErrors;
      }

      const meetingDate = new Date(form.meeting_time);
      const deadlineDate = new Date(form.application_deadline);
      const isInvalidOrder =
        !Number.isNaN(meetingDate.getTime()) &&
        !Number.isNaN(deadlineDate.getTime()) &&
        meetingDate < deadlineDate;

      if (!isInvalidOrder) {
        if (!hasRelationError) return prev;
        const nextErrors = { ...prev };
        delete nextErrors.application_deadline;
        return nextErrors;
      }

      if (hasRelationError) return prev;
      return { ...prev, application_deadline: relationError };
    });
  }, [form.application_deadline, form.meeting_time]);

  const handleSubmit = useMemo(
    () =>
      createSubmitHandler({
        form,
        participantType,
        isEditMode,
        canCreateMeeting,
        meetingIdValue,
        createSocial: meetingsApi.createSocial,
        updateSocial: meetingsApi.updateSocial,
        extractData,
        router,
        alert: Alert.alert,
        setSaving,
        setFieldErrors,
        validateForm: validateSocialForm,
        buildPayload: buildSocialPayload,
        settlementMethods: socialSettlementMethods,
      }),
    [
      form,
      participantType,
      isEditMode,
      canCreateMeeting,
      meetingIdValue,
      router,
      setSaving,
      setFieldErrors,
    ]
  );

  const handleCancel = useCallback(() => {
    const leave = () => backOrHome(router);

    if (!isEditMode && !hasDraft) {
      leave();
      return;
    }

    confirmDiscardDraft({
      title: '취소 확인',
      message: isEditMode
        ? '저장하지 않은 변경 사항이 모두 사라집니다. 수정을 취소하시겠습니까?'
        : '작성 중인 내용이 모두 사라집니다. 모임 생성을 취소하시겠습니까?',
      onConfirm: leave,
    });
  }, [hasDraft, isEditMode, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={meetingTitle} onBack={handleCancel} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.loadingText}>모임 정보를 불러오는 중...</Text>
          </View>
        ) : (
          <>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>기본 정보</Text>
              <Text style={styles.sectionSubtitle}>소셜 모임 정보를 입력해주세요.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>모임명</Text>
                <TextInput
                  value={form.name}
                  onChangeText={handleFieldChange('name')}
                  placeholder="예: 봄맞이 저녁 모임"
                  style={[styles.input, fieldErrors.name && styles.inputError]}
                  placeholderTextColor={colors.neutral[400]}
                />
                {fieldErrors.name && <Text style={styles.errorText}>{fieldErrors.name}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>설명</Text>
                <TextInput
                  value={form.description}
                  onChangeText={handleFieldChange('description')}
                  placeholder="모임 소개를 입력하세요"
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>모임 유형</Text>
                  <View style={styles.chipRow}>
                    {socialTypeOptions.map((typeOption) => (
                      <SelectableChip
                        key={typeOption.id}
                        label={typeOption.label}
                        selected={form.type === typeOption.id}
                        onPress={handleTypeSelect(typeOption.id)}
                        styles={styles}
                    />
                  ))}
                </View>
              </View>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>일정 및 클럽</Text>
              <Text style={styles.sectionSubtitle}>모임 일정을 설정해주세요.</Text>

              <DateTimeField
                label="모임 시간"
                value={form.meeting_time}
                onChange={handleFieldChange('meeting_time')}
                placeholder="날짜/시간 선택"
                error={fieldErrors.meeting_time}
                minimumDate={isEditMode ? undefined : new Date()}
              />

              <DateTimeField
                label="신청 마감"
                value={form.application_deadline}
                onChange={handleFieldChange('application_deadline')}
                placeholder="날짜/시간 선택"
                error={fieldErrors.application_deadline}
                minimumDate={isEditMode ? undefined : new Date()}
              />

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>클럽</Text>
                {clubsLoading ? (
                  <ActivityIndicator size="small" color={colors.primary[600]} />
                ) : clubs.length === 0 ? (
                  <Text style={styles.helperText}>
                    {isEditMode
                      ? '가입된 클럽이 없습니다.'
                      : '모임 생성 권한(리더/매니저)이 있는 클럽이 없습니다.'}
                  </Text>
                ) : (
                  <View style={styles.chipRow}>
                    {clubs.map((club) => (
                      <SelectableChip
                        key={club.id}
                        label={club.name}
                        selected={form.club_id === club.id}
                        onPress={handleClubSelect(club.id)}
                        styles={styles}
                      />
                    ))}
                  </View>
                )}
                {fieldErrors.club_id && (
                  <Text style={styles.errorText}>{fieldErrors.club_id}</Text>
                )}
              </View>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>장소 및 비용</Text>
              <Text style={styles.sectionSubtitle}>장소와 비용 정보를 입력해주세요.</Text>
              <Text style={styles.sectionNotice}>참가자 안내용으로 기록하는 항목입니다.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>장소명</Text>
                <TextInput
                  value={form.venue_name}
                  onChangeText={handleFieldChange('venue_name')}
                  placeholder="예: 판교 라운지"
                  style={[styles.input, fieldErrors.venue_name && styles.inputError]}
                  placeholderTextColor={colors.neutral[400]}
                />
                {fieldErrors.venue_name && (
                  <Text style={styles.errorText}>{fieldErrors.venue_name}</Text>
                )}
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>정산 방식</Text>
                <View style={styles.chipRow}>
                  {socialSettlementMethods.map((method) => (
                    <SelectableChip
                      key={method.id}
                      label={method.label}
                      selected={form.settlement_method === method.id}
                      onPress={handleSettlementSelect(method.id)}
                      styles={styles}
                    />
                  ))}
                </View>
                <Text style={styles.label}>참가자 안내용으로 기록하는 항목입니다.</Text>
              </View>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>참가자 설정</Text>
              <Text style={styles.sectionSubtitle}>참가자 수를 설정해주세요.</Text>

              <View style={styles.fieldGroup}>
                <View style={styles.chipRow}>
                  <SelectableChip
                    label="모든 클럽 멤버"
                    selected={participantType === 'ALL'}
                    onPress={handleParticipantTypeSelect('ALL')}
                    styles={styles}
                  />
                  <SelectableChip
                    label="참가자 수 설정"
                    selected={participantType === 'LIMITED'}
                    onPress={handleParticipantTypeSelect('LIMITED')}
                    styles={styles}
                  />
                </View>
              </View>

              {participantType === 'LIMITED' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>참가자 수</Text>
                  <TextInput
                    value={form.max_participants}
                    onChangeText={handleMaxParticipantsChange}
                    placeholder="예: 20"
                    keyboardType="numeric"
                    style={[styles.input, fieldErrors.max_participants && styles.inputError]}
                    placeholderTextColor={colors.neutral[400]}
                  />
                  {fieldErrors.max_participants && (
                    <Text style={styles.errorText}>{fieldErrors.max_participants}</Text>
                  )}
                </View>
              )}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>운영진용 메모</Text>
              <Text style={styles.sectionSubtitle}>참가자에게 보이지 않으며, 운영진만 볼 수 있습니다.</Text>
              <View style={styles.fieldGroup}>
                <TextInput
                  value={form.social_notes}
                  onChangeText={handleFieldChange('social_notes')}
                  placeholder="메모를 입력하세요 (선택)"
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholderTextColor={colors.neutral[400]}
                  textAlignVertical="top"
                />
              </View>
            </Card>

            <View style={styles.submitRow}>
              <Button
                variant="outline"
                size="lg"
                onPress={handleCancel}
                disabled={saving}
                style={styles.submitButton}
              >
                취소
              </Button>
              <Button
                variant="primary"
                size="lg"
                onPress={handleSubmit}
                loading={saving}
                disabled={!canCreateMeeting}
                style={styles.submitButton}
              >
                {isEditMode ? '수정 완료' : '소셜 모임 생성'}
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function SocialCreateScreen() {
  return <SocialForm mode="create" />;
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  card: base.formScreenCard,
  loadingContainer: base.formScreenLoadingContainer,
  loadingText: base.formScreenLoadingText,
  sectionTitle: base.sectionTitle,
  sectionSubtitle: base.formScreenSectionSubtitle,
  sectionNotice: {
    ...base.textSmSubtle,
    marginTop: tokens.spacing.xxs,
  },
  label: base.labelSm,
  helperText: base.textSmSubtle,
  input: { ...base.formInput, marginBottom: tokens.spacing.sm2 },
  inputError: base.formInputError,
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  fieldGroup: base.formFieldGroup,
  chipRow: base.chipRow,
  chip: base.chipSoft,
  chipActive: base.chipSoftActive,
  chipPressed: base.chipSoftPressed,
  chipText: base.chipSoftText,
  chipTextActive: base.chipSoftTextActive,
  errorText: { ...base.formErrorText, marginTop: tokens.spacing.xxs },
  submitRow: base.formScreenSubmitRow,
  submitButton: base.formScreenSubmitButton,
});
