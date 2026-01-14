import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView, StyleSheet, Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChipOption from '@/components/meetings/ChipOption';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DateTimeField from '@/components/ui/DateTimeField';
import ScreenHeader from '@/components/ui/ScreenHeader';
import {
    roundingMeetingSubtypes,
    roundingSettlementMethods,
    roundingTeamModes,
} from '@/constants/meetingConstants';
import { meetingsApi } from '@/lib/api/api';
import {
    createFetchClubsHandler,
    createFetchMeetingHandler,
    createFieldChangeHandler,
    createOptionPressHandler,
    createSubmitHandler,
} from '@/lib/handler/meetings';
import { extractData, extractList } from '@/lib/util/meetingUtils';
import {
    buildRoundingFormFromData,
    buildRoundingPayload,
    getRoundingMeetingTitle,
    validateRoundingForm,
} from '@/lib/util/roundingForm';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';





export function RoundingForm({ mode = 'create' }) {
  const router = useRouter();
  const { meetingId } = useLocalSearchParams();
  const meetingIdValue = Array.isArray(meetingId) ? meetingId[0] : meetingId;
  const isEditMode = mode === 'edit';

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    meeting_time: '',
    application_deadline: '',
    club_id: '',
    course_name: '',
    reservation_name: '',
    hole_count: '18',
    tee_times: '',
    max_participants: '',
    team_size: '4',
    team_formation_mode: 'GENDER_SEPARATED',
    meeting_subtype: 'REGULAR',
    green_fee: '',
    caddy_fee: '',
    cart_fee: '',
    settlement_method: 'EQUAL_SPLIT',
  });
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleFieldChange = useMemo(
    () => createFieldChangeHandler({ setForm }),
    [setForm]
  );
  const handleClubSelect = useMemo(
    () => createOptionPressHandler({ onChange: handleFieldChange, field: 'club_id' }),
    [handleFieldChange]
  );
  const handleTeamModeSelect = useMemo(
    () => createOptionPressHandler({ onChange: handleFieldChange, field: 'team_formation_mode' }),
    [handleFieldChange]
  );
  const handleMeetingSubtypeSelect = useMemo(
    () => createOptionPressHandler({ onChange: handleFieldChange, field: 'meeting_subtype' }),
    [handleFieldChange]
  );
  const handleSettlementSelect = useMemo(
    () => createOptionPressHandler({ onChange: handleFieldChange, field: 'settlement_method' }),
    [handleFieldChange]
  );

  const meetingTitle = useMemo(
    () => getRoundingMeetingTitle(isEditMode),
    [isEditMode]
  );

  const fetchClubs = useMemo(
    () =>
      createFetchClubsHandler({
        fetchMyClubs: meetingsApi.fetchMyClubs,
        extractList,
        isEditMode,
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
        fetchRound: meetingsApi.fetchRound,
        extractData,
        setForm,
        setLoading,
        alert: Alert.alert,
        buildFormFromData: buildRoundingFormFromData,
      }),
    [isEditMode, meetingIdValue, setForm, setLoading]
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
        isEditMode,
        meetingIdValue,
        createRound: meetingsApi.createRound,
        updateRound: meetingsApi.updateRound,
        extractData,
        router,
        alert: Alert.alert,
        setSaving,
        setFieldErrors,
        validateForm: validateRoundingForm,
        buildPayload: buildRoundingPayload,
        settlementMethods: roundingSettlementMethods,
      }),
    [
      form,
      isEditMode,
      meetingIdValue,
      router,
      setSaving,
      setFieldErrors,
    ]
  );

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
              <Text style={styles.sectionSubtitle}>모임의 기본 정보를 입력해주세요.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>모임명</Text>
                <TextInput
                  value={form.name}
                  onChangeText={handleFieldChange('name')}
                  placeholder="예: 봄맞이 라운딩"
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
                <Text style={styles.label}>장소</Text>
                <TextInput
                  value={form.location}
                  onChangeText={handleFieldChange('location')}
                  placeholder="예: 서울 강동구"
                  style={[styles.input, fieldErrors.location && styles.inputError]}
                  placeholderTextColor={colors.neutral[400]}
                />
                {fieldErrors.location && (
                  <Text style={styles.errorText}>{fieldErrors.location}</Text>
                )}
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
                  <Text style={styles.helperText}>가입된 클럽이 없습니다.</Text>
                ) : (
                  <View style={styles.chipRow}>
                    {clubs.map((club) => (
                      <ChipOption
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
              <Text style={styles.sectionTitle}>골프장 정보</Text>
              <Text style={styles.sectionSubtitle}>골프장/예약 정보를 입력해주세요.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>골프장명</Text>
                <TextInput
                  value={form.course_name}
                  onChangeText={handleFieldChange('course_name')}
                  placeholder="예: 한강 GC"
                  style={[styles.input, fieldErrors.course_name && styles.inputError]}
                  placeholderTextColor={colors.neutral[400]}
                />
                {fieldErrors.course_name && (
                  <Text style={styles.errorText}>{fieldErrors.course_name}</Text>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>예약자명</Text>
                <TextInput
                  value={form.reservation_name}
                  onChangeText={handleFieldChange('reservation_name')}
                  placeholder="예약자명을 입력하세요"
                  style={[styles.input, fieldErrors.reservation_name && styles.inputError]}
                  placeholderTextColor={colors.neutral[400]}
                />
                {fieldErrors.reservation_name && (
                  <Text style={styles.errorText}>{fieldErrors.reservation_name}</Text>
                )}
              </View>

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>홀 수</Text>
                  <TextInput
                    value={form.hole_count}
                    onChangeText={handleFieldChange('hole_count')}
                    placeholder="18"
                    keyboardType="numeric"
                    style={[styles.input, fieldErrors.hole_count && styles.inputError]}
                    placeholderTextColor={colors.neutral[400]}
                  />
                  {fieldErrors.hole_count && (
                    <Text style={styles.errorText}>{fieldErrors.hole_count}</Text>
                  )}
                </View>
                <View style={[styles.halfField, styles.halfFieldLast]}>
                  <Text style={styles.label}>티타임</Text>
                  <TextInput
                    value={form.tee_times}
                    onChangeText={handleFieldChange('tee_times')}
                    placeholder="예: 09:00, 09:10"
                    style={[styles.input, fieldErrors.tee_times && styles.inputError]}
                    placeholderTextColor={colors.neutral[400]}
                  />
                  {fieldErrors.tee_times && (
                    <Text style={styles.errorText}>{fieldErrors.tee_times}</Text>
                  )}
                </View>
              </View>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>팀 구성</Text>
              <Text style={styles.sectionSubtitle}>팀 구성 정보를 입력해주세요.</Text>

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>최대 인원</Text>
                  <TextInput
                    value={form.max_participants}
                    onChangeText={handleFieldChange('max_participants')}
                    placeholder="예: 16"
                    keyboardType="numeric"
                    style={[styles.input, fieldErrors.max_participants && styles.inputError]}
                    placeholderTextColor={colors.neutral[400]}
                  />
                  {fieldErrors.max_participants && (
                    <Text style={styles.errorText}>{fieldErrors.max_participants}</Text>
                  )}
                </View>
                <View style={[styles.halfField, styles.halfFieldLast]}>
                  <Text style={styles.label}>조당 인원</Text>
                  <TextInput
                    value={form.team_size}
                    onChangeText={handleFieldChange('team_size')}
                    placeholder="4"
                    keyboardType="numeric"
                    style={[styles.input, fieldErrors.team_size && styles.inputError]}
                    placeholderTextColor={colors.neutral[400]}
                  />
                  {fieldErrors.team_size && (
                    <Text style={styles.errorText}>{fieldErrors.team_size}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>팀 구성 방식</Text>
                <View style={styles.chipRow}>
                  {roundingTeamModes.map((modeOption) => (
                    <ChipOption
                      key={modeOption.id}
                      label={modeOption.label}
                      selected={form.team_formation_mode === modeOption.id}
                      onPress={handleTeamModeSelect(modeOption.id)}
                      styles={styles}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>모임 유형</Text>
                <View style={styles.chipRow}>
                  {roundingMeetingSubtypes.map((subtype) => (
                    <ChipOption
                      key={subtype.id}
                      label={subtype.label}
                      selected={form.meeting_subtype === subtype.id}
                      onPress={handleMeetingSubtypeSelect(subtype.id)}
                      styles={styles}
                    />
                  ))}
                </View>
              </View>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>정산 정보</Text>
              <Text style={styles.sectionSubtitle}>비용 정보를 입력해주세요.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>그린피</Text>
                <TextInput
                  value={form.green_fee}
                  onChangeText={handleFieldChange('green_fee')}
                  placeholder="예: 120000"
                  keyboardType="numeric"
                  style={[styles.input, fieldErrors.green_fee && styles.inputError]}
                  placeholderTextColor={colors.neutral[400]}
                />
                {fieldErrors.green_fee && (
                  <Text style={styles.errorText}>{fieldErrors.green_fee}</Text>
                )}
              </View>

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>캐디피</Text>
                  <TextInput
                    value={form.caddy_fee}
                    onChangeText={handleFieldChange('caddy_fee')}
                    placeholder="예: 150000"
                    keyboardType="numeric"
                    style={[styles.input, fieldErrors.caddy_fee && styles.inputError]}
                    placeholderTextColor={colors.neutral[400]}
                  />
                  {fieldErrors.caddy_fee && (
                    <Text style={styles.errorText}>{fieldErrors.caddy_fee}</Text>
                  )}
                </View>
                <View style={[styles.halfField, styles.halfFieldLast]}>
                  <Text style={styles.label}>카트비</Text>
                  <TextInput
                    value={form.cart_fee}
                    onChangeText={handleFieldChange('cart_fee')}
                    placeholder="예: 100000"
                    keyboardType="numeric"
                    style={[styles.input, fieldErrors.cart_fee && styles.inputError]}
                    placeholderTextColor={colors.neutral[400]}
                  />
                  {fieldErrors.cart_fee && (
                    <Text style={styles.errorText}>{fieldErrors.cart_fee}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>정산 방식</Text>
                <View style={styles.chipRow}>
                  {roundingSettlementMethods.map((method) => (
                    <ChipOption
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

            <Button variant="primary" size="lg" onPress={handleSubmit} loading={saving}>
              {isEditMode ? '수정 완료' : '라운딩 모임 생성'}
            </Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function RoundingCreateScreen() {
  return <RoundingForm mode="create" />;
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  card: {
    marginBottom: tokens.spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.padding.mega,
  },
  loadingText: { ...base.textSmMuted, marginTop: tokens.spacing.sm2, fontSize: tokens.font.base },
  sectionTitle: base.sectionTitle,
  sectionSubtitle: { ...base.sectionSubtitle, marginTop: tokens.spacing.xxs, marginBottom: tokens.spacing.sm2 },
  label: base.labelSm,
  helperText: base.textSmSubtle,
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    fontSize: tokens.font.base,
    color: colors.neutral[900],
    backgroundColor: colors.white,
    marginBottom: tokens.spacing.sm2,
  },
  inputError: {
    borderColor: colors.error[500],
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  fieldGroup: {
    marginBottom: tokens.spacing.sm2,
  },
  halfField: {
    flex: 1,
    marginRight: tokens.spacing.sm2,
  },
  halfFieldLast: {
    marginRight: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
    marginRight: tokens.spacing.xs2,
    marginBottom: tokens.spacing.xs2,
  },
  chipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  chipTextActive: {
    color: colors.primary[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  errorText: { ...base.textSmError, marginTop: tokens.spacing.xxs },
});
