import { StyleSheet } from 'react-native';
import { tokens } from '@/styles/style';

import {
useLocalSearchParams,
useRouter } from 'expo-router';
import { useCallback,
useEffect,
useMemo,
useState } from 'react';
import {
  ActivityIndicator,
Alert,
Pressable,
ScrollView,
Text,
TextInput,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DateTimeField from '@/components/ui/DateTimeField';
import ScreenHeader from '@/components/ui/ScreenHeader';
import {
  roundingMeetingSubtypes,
  roundingSettlementMethods,
  roundingTeamModes,
} from '@/constants/meetingConstants';
import { clubApi, roundsApi } from '@/lib/api';
import {
  convertToKST,
  extractData,
  extractList,
  normalizeNumber,
  parseTeeTimes,
  toDateTimeLocalValue,
  validateMeetingTimeWithTeeTimes,
} from '@/lib/meetingUtils';

const ChipOption = ({ label, selected, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.chip,
      selected && styles.chipActive,
      pressed && styles.chipPressed,
    ]}
  >
    <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

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

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const meetingTitle = useMemo(
    () => (isEditMode ? '라운딩 모임 수정' : '라운딩 모임 만들기'),
    [isEditMode],
  );

  const fetchClubs = useCallback(async () => {
    try {
      setClubsLoading(true);
      const response = await clubApi.getMyClubs();
      const list = extractList(response);
      const activeClubs = list.filter(
        (club) => club.status === 'ACTIVE' || club.status === 'APPROVED',
      );
      setClubs(activeClubs);
      if (!isEditMode && activeClubs.length === 1) {
        setForm((prev) => ({ ...prev, club_id: activeClubs[0].id }));
      }
    } catch (error) {
      console.error('클럽 목록 조회 실패:', error);
      setClubs([]);
    } finally {
      setClubsLoading(false);
    }
  }, [isEditMode]);

  const fetchMeeting = useCallback(async () => {
    if (!isEditMode || !meetingIdValue) return;
    try {
      setLoading(true);
      const response = await roundsApi.getRound(meetingIdValue);
      const data = extractData(response);
      if (!data) return;
      setForm((prev) => ({
        ...prev,
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
        team_formation_mode: data.team_formation_mode || prev.team_formation_mode,
        meeting_subtype: data.meeting_subtype || prev.meeting_subtype,
        green_fee: data.green_fee !== undefined ? String(data.green_fee) : '',
        caddy_fee: data.caddy_fee !== undefined ? String(data.caddy_fee) : '',
        cart_fee: data.cart_fee !== undefined ? String(data.cart_fee) : '',
        settlement_method: data.settlement_method || prev.settlement_method,
      }));
    } catch (error) {
      console.error('모임 조회 실패:', error);
      Alert.alert('오류', '모임 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [isEditMode, meetingIdValue]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  const validateForm = () => {
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

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('확인 필요', '입력 항목을 확인해주세요.');
      return;
    }

    const teeTimes = parseTeeTimes(form.tee_times);
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
      settlement_method: roundingSettlementMethods.some((method) => method.id === form.settlement_method)
        ? form.settlement_method
        : 'EQUAL_SPLIT',
    };

    try {
      setSaving(true);
      const response = isEditMode
        ? await roundsApi.updateRound(meetingIdValue, payload)
        : await roundsApi.createRound(payload);
      const data = extractData(response);
      const createdId = data?.id || data?.meeting_id || meetingIdValue;
      Alert.alert(
        '완료',
        isEditMode ? '모임 정보가 수정되었습니다.' : '라운딩 모임이 생성되었습니다.',
      );
      if (createdId) {
        router.replace(`/meetings/rounding/${createdId}`);
      } else {
        router.replace('/meetings');
      }
    } catch (error) {
      console.error('라운딩 저장 실패:', error);
      Alert.alert('오류', error?.message || '모임 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={meetingTitle} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.colors.primary[600]} />
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
                  onChangeText={(value) => handleChange('name', value)}
                  placeholder="예: 봄맞이 라운딩"
                  style={[styles.input, fieldErrors.name && styles.inputError]}
                  placeholderTextColor={tokens.colors.neutral[400]}
                />
                {fieldErrors.name && <Text style={styles.errorText}>{fieldErrors.name}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>설명</Text>
                <TextInput
                  value={form.description}
                  onChangeText={(value) => handleChange('description', value)}
                  placeholder="모임 소개를 입력하세요"
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholderTextColor={tokens.colors.neutral[400]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>장소</Text>
                <TextInput
                  value={form.location}
                  onChangeText={(value) => handleChange('location', value)}
                  placeholder="예: 서울 강동구"
                  style={[styles.input, fieldErrors.location && styles.inputError]}
                  placeholderTextColor={tokens.colors.neutral[400]}
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
                onChange={(value) => handleChange('meeting_time', value)}
                placeholder="날짜/시간 선택"
                error={fieldErrors.meeting_time}
                minimumDate={isEditMode ? undefined : new Date()}
              />

              <DateTimeField
                label="신청 마감"
                value={form.application_deadline}
                onChange={(value) => handleChange('application_deadline', value)}
                placeholder="날짜/시간 선택"
                error={fieldErrors.application_deadline}
                minimumDate={isEditMode ? undefined : new Date()}
              />

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>클럽</Text>
                {clubsLoading ? (
                  <ActivityIndicator size="small" color={tokens.colors.primary[600]} />
                ) : clubs.length === 0 ? (
                  <Text style={styles.helperText}>가입된 클럽이 없습니다.</Text>
                ) : (
                  <View style={styles.chipRow}>
                    {clubs.map((club) => (
                      <ChipOption
                        key={club.id}
                        label={club.name}
                        selected={form.club_id === club.id}
                        onPress={() => handleChange('club_id', club.id)}
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
                  onChangeText={(value) => handleChange('course_name', value)}
                  placeholder="예: 한강 GC"
                  style={[styles.input, fieldErrors.course_name && styles.inputError]}
                  placeholderTextColor={tokens.colors.neutral[400]}
                />
                {fieldErrors.course_name && (
                  <Text style={styles.errorText}>{fieldErrors.course_name}</Text>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>예약자명</Text>
                <TextInput
                  value={form.reservation_name}
                  onChangeText={(value) => handleChange('reservation_name', value)}
                  placeholder="예약자명을 입력하세요"
                  style={[styles.input, fieldErrors.reservation_name && styles.inputError]}
                  placeholderTextColor={tokens.colors.neutral[400]}
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
                    onChangeText={(value) => handleChange('hole_count', value)}
                    placeholder="18"
                    keyboardType="numeric"
                    style={[styles.input, fieldErrors.hole_count && styles.inputError]}
                    placeholderTextColor={tokens.colors.neutral[400]}
                  />
                  {fieldErrors.hole_count && (
                    <Text style={styles.errorText}>{fieldErrors.hole_count}</Text>
                  )}
                </View>
                <View style={[styles.halfField, styles.halfFieldLast]}>
                  <Text style={styles.label}>티타임</Text>
                  <TextInput
                    value={form.tee_times}
                    onChangeText={(value) => handleChange('tee_times', value)}
                    placeholder="예: 09:00, 09:10"
                    style={[styles.input, fieldErrors.tee_times && styles.inputError]}
                    placeholderTextColor={tokens.colors.neutral[400]}
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
                    onChangeText={(value) => handleChange('max_participants', value)}
                    placeholder="예: 16"
                    keyboardType="numeric"
                    style={[styles.input, fieldErrors.max_participants && styles.inputError]}
                    placeholderTextColor={tokens.colors.neutral[400]}
                  />
                  {fieldErrors.max_participants && (
                    <Text style={styles.errorText}>{fieldErrors.max_participants}</Text>
                  )}
                </View>
                <View style={[styles.halfField, styles.halfFieldLast]}>
                  <Text style={styles.label}>조당 인원</Text>
                  <TextInput
                    value={form.team_size}
                    onChangeText={(value) => handleChange('team_size', value)}
                    placeholder="4"
                    keyboardType="numeric"
                    style={[styles.input, fieldErrors.team_size && styles.inputError]}
                    placeholderTextColor={tokens.colors.neutral[400]}
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
                      onPress={() => handleChange('team_formation_mode', modeOption.id)}
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
                      onPress={() => handleChange('meeting_subtype', subtype.id)}
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
                  onChangeText={(value) => handleChange('green_fee', value)}
                  placeholder="예: 120000"
                  keyboardType="numeric"
                  style={[styles.input, fieldErrors.green_fee && styles.inputError]}
                  placeholderTextColor={tokens.colors.neutral[400]}
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
                    onChangeText={(value) => handleChange('caddy_fee', value)}
                    placeholder="예: 150000"
                    keyboardType="numeric"
                    style={[styles.input, fieldErrors.caddy_fee && styles.inputError]}
                    placeholderTextColor={tokens.colors.neutral[400]}
                  />
                  {fieldErrors.caddy_fee && (
                    <Text style={styles.errorText}>{fieldErrors.caddy_fee}</Text>
                  )}
                </View>
                <View style={[styles.halfField, styles.halfFieldLast]}>
                  <Text style={styles.label}>카트비</Text>
                  <TextInput
                    value={form.cart_fee}
                    onChangeText={(value) => handleChange('cart_fee', value)}
                    placeholder="예: 100000"
                    keyboardType="numeric"
                    style={[styles.input, fieldErrors.cart_fee && styles.inputError]}
                    placeholderTextColor={tokens.colors.neutral[400]}
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
                      onPress={() => handleChange('settlement_method', method.id)}
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
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: tokens.colors.neutral[600],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.neutral[900],
  },
  sectionSubtitle: {
    fontSize: 12,
    color: tokens.colors.neutral[500],
    marginTop: 4,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: tokens.colors.neutral[700],
    marginBottom: 6,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: tokens.colors.neutral[500],
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.neutral[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: tokens.colors.neutral[900],
    backgroundColor: tokens.colors.white,
    marginBottom: 12,
  },
  inputError: {
    borderColor: tokens.colors.error[500],
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  halfField: {
    flex: 1,
    marginRight: 12,
  },
  halfFieldLast: {
    marginRight: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.colors.neutral[300],
    backgroundColor: tokens.colors.white,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[500],
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    fontSize: 12,
    color: tokens.colors.neutral[600],
  },
  chipTextActive: {
    color: tokens.colors.primary[700],
    fontWeight: '600',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: tokens.colors.error[600],
  },
});
