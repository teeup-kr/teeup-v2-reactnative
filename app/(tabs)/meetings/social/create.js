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
    createFieldChangeHandler,
    createOptionPressHandler,
    createParticipantTypeHandler,
    createSubmitHandler,
} from '@/lib/handler/meetings';
import { backOrHome } from '@/lib/navigation/cappedHistory';
import { extractData, extractList } from '@/lib/util/meetingUtils';
import {
    buildSocialFormFromData,
    buildSocialPayload,
    getParticipantTypeFromData,
    getSocialMeetingTitle,
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
          Number(form.social_cost) > 0
      ),
    [form]
  );

  const handleFieldChange = useMemo(
    () => createFieldChangeHandler({ setForm }),
    [setForm]
  );
  const handleTypeSelect = useMemo(
    () => createOptionPressHandler({ onChange: handleFieldChange, field: 'type' }),
    [handleFieldChange]
  );
  const handleClubSelect = useMemo(
    () => createOptionPressHandler({ onChange: handleFieldChange, field: 'club_id' }),
    [handleFieldChange]
  );
  const handleSettlementSelect = useMemo(
    () => createOptionPressHandler({ onChange: handleFieldChange, field: 'settlement_method' }),
    [handleFieldChange]
  );
  const handleParticipantTypeSelect = useMemo(
    () => createParticipantTypeHandler({ setParticipantType, onChange: handleFieldChange }),
    [setParticipantType, handleFieldChange]
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
    if (!isEditMode && !hasDraft) {
      backOrHome(router);
      return;
    }

    Alert.alert(
      '취소 확인',
      isEditMode
        ? '저장하지 않은 변경 사항이 모두 사라집니다. 수정을 취소하시겠습니까?'
        : '작성 중인 내용이 모두 사라집니다. 모임 생성을 취소하시겠습니까?',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '취소',
          style: 'destructive',
          onPress: () => backOrHome(router),
        },
      ]
    );
  }, [hasDraft, isEditMode, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={meetingTitle} />
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
                <Text style={styles.label}>참가 비용</Text>
                <TextInput
                  value={form.social_cost}
                  onChangeText={handleFieldChange('social_cost')}
                  placeholder="예: 30000"
                  keyboardType="numeric"
                  style={[styles.input, fieldErrors.social_cost && styles.inputError]}
                  placeholderTextColor={colors.neutral[400]}
                />
                {fieldErrors.social_cost && (
                  <Text style={styles.errorText}>{fieldErrors.social_cost}</Text>
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
                    onChangeText={handleFieldChange('max_participants')}
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
