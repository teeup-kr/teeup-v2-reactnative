
import {
useLocalSearchParams,
useRouter } from 'expo-router';
import { useCallback,
useEffect,
useMemo,
useState } from 'react';
import { StyleSheet } from 'react-native';
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
import { socialSettlementMethods, socialTypeOptions } from '@/constants/meetingConstants';
import { clubApi, socialsApi } from '@/lib/api';
import {
  convertToKST,
  extractData,
  extractList,
  normalizeNumber,
  toDateTimeLocalValue,
} from '@/lib/meetingUtils';
import { base, tokens } from '@/styles/style';

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
    social_settlement_method: 'EQUAL_SPLIT',
    club_id: '',
  });
  const [participantType, setParticipantType] = useState('ALL');
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const meetingTitle = useMemo(
    () => (isEditMode ? '소셜 모임 수정' : '소셜 모임 만들기'),
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
      const response = await socialsApi.getSocial(meetingIdValue);
      const data = extractData(response);
      if (!data) return;
      setForm((prev) => ({
        ...prev,
        name: data.name ?? '',
        description: data.description ?? '',
        type: data.type || prev.type,
        venue_name: data.venue_name ?? '',
        meeting_time: toDateTimeLocalValue(data.meeting_time),
        application_deadline: toDateTimeLocalValue(data.application_deadline),
        max_participants: data.max_participants !== undefined ? String(data.max_participants) : '',
        social_cost: data.social_cost !== undefined ? String(data.social_cost) : '',
        social_settlement_method: data.social_settlement_method || prev.social_settlement_method,
        club_id: data.club_id ?? data.club?.id ?? '',
      }));
      if (data.max_participants && Number(data.max_participants) > 0) {
        setParticipantType('LIMITED');
      } else {
        setParticipantType('ALL');
      }
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

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('확인 필요', '입력 항목을 확인해주세요.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      venue_name: form.venue_name.trim() || undefined,
      meeting_time: convertToKST(form.meeting_time),
      application_deadline: convertToKST(form.application_deadline),
      max_participants:
        participantType === 'ALL' ? 0 : normalizeNumber(form.max_participants, 0),
      social_cost: normalizeNumber(form.social_cost, 0),
      social_settlement_method: socialSettlementMethods.some((method) => method.id === form.social_settlement_method)
        ? form.social_settlement_method
        : 'EQUAL_SPLIT',
      club_id: form.club_id || undefined,
    };

    try {
      setSaving(true);
      const response = isEditMode
        ? await socialsApi.updateSocial(meetingIdValue, payload)
        : await socialsApi.createSocial(payload);
      const data = extractData(response);
      const createdId = data?.id || data?.meeting_id || meetingIdValue;
      Alert.alert(
        '완료',
        isEditMode ? '모임 정보가 수정되었습니다.' : '소셜 모임이 생성되었습니다.',
      );
      if (createdId) {
        router.replace(`/meetings/social/${createdId}`);
      } else {
        router.replace('/meetings');
      }
    } catch (error) {
      console.error('소셜 저장 실패:', error);
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
              <Text style={styles.sectionSubtitle}>소셜 모임 정보를 입력해주세요.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>모임명</Text>
                <TextInput
                  value={form.name}
                  onChangeText={(value) => handleChange('name', value)}
                  placeholder="예: 봄맞이 저녁 모임"
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
                <Text style={styles.label}>모임 유형</Text>
                <View style={styles.chipRow}>
                  {socialTypeOptions.map((typeOption) => (
                    <ChipOption
                      key={typeOption.id}
                      label={typeOption.label}
                      selected={form.type === typeOption.id}
                      onPress={() => handleChange('type', typeOption.id)}
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
              <Text style={styles.sectionTitle}>장소 및 비용</Text>
              <Text style={styles.sectionSubtitle}>장소와 비용 정보를 입력해주세요.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>장소명</Text>
                <TextInput
                  value={form.venue_name}
                  onChangeText={(value) => handleChange('venue_name', value)}
                  placeholder="예: 판교 라운지"
                  style={[styles.input, fieldErrors.venue_name && styles.inputError]}
                  placeholderTextColor={tokens.colors.neutral[400]}
                />
                {fieldErrors.venue_name && (
                  <Text style={styles.errorText}>{fieldErrors.venue_name}</Text>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>참가 비용</Text>
                <TextInput
                  value={form.social_cost}
                  onChangeText={(value) => handleChange('social_cost', value)}
                  placeholder="예: 30000"
                  keyboardType="numeric"
                  style={[styles.input, fieldErrors.social_cost && styles.inputError]}
                  placeholderTextColor={tokens.colors.neutral[400]}
                />
                {fieldErrors.social_cost && (
                  <Text style={styles.errorText}>{fieldErrors.social_cost}</Text>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>정산 방식</Text>
                <View style={styles.chipRow}>
                  {socialSettlementMethods.map((method) => (
                    <ChipOption
                      key={method.id}
                      label={method.label}
                      selected={form.social_settlement_method === method.id}
                      onPress={() => handleChange('social_settlement_method', method.id)}
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
                  <ChipOption
                    label="모든 클럽 멤버"
                    selected={participantType === 'ALL'}
                    onPress={() => {
                      setParticipantType('ALL');
                      handleChange('max_participants', '');
                    }}
                  />
                  <ChipOption
                    label="참가자 수 설정"
                    selected={participantType === 'LIMITED'}
                    onPress={() => setParticipantType('LIMITED')}
                  />
                </View>
              </View>

              {participantType === 'LIMITED' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>참가자 수</Text>
                  <TextInput
                    value={form.max_participants}
                    onChangeText={(value) => handleChange('max_participants', value)}
                    placeholder="예: 20"
                    keyboardType="numeric"
                    style={[styles.input, fieldErrors.max_participants && styles.inputError]}
                    placeholderTextColor={tokens.colors.neutral[400]}
                  />
                  {fieldErrors.max_participants && (
                    <Text style={styles.errorText}>{fieldErrors.max_participants}</Text>
                  )}
                </View>
              )}
            </Card>

            <Button variant="primary" size="lg" onPress={handleSubmit} loading={saving}>
              {isEditMode ? '수정 완료' : '소셜 모임 생성'}
            </Button>
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
    borderColor: tokens.colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    fontSize: tokens.font.base,
    color: tokens.colors.neutral[900],
    backgroundColor: tokens.colors.white,
    marginBottom: tokens.spacing.sm2,
  },
  inputError: {
    borderColor: tokens.colors.error[500],
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  fieldGroup: {
    marginBottom: tokens.spacing.sm2,
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
    borderColor: tokens.colors.neutral[300],
    backgroundColor: tokens.colors.white,
    marginRight: tokens.spacing.xs2,
    marginBottom: tokens.spacing.xs2,
  },
  chipActive: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[500],
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    fontSize: tokens.font.sm,
    color: tokens.colors.neutral[600],
  },
  chipTextActive: {
    color: tokens.colors.primary[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  errorText: { ...base.textSmError, marginTop: tokens.spacing.xxs },
});
