import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
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
import { useAuth } from '@/context/AuthContext';
import { clubsApi, meetingsApi } from '@/lib/api/api';
import { createFetchMembersHandler } from '@/lib/handler/clubs';
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

  const { user } = useAuth();
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
    is_private: false,
    selected_participants: [],
    selected_guests: [],
  });
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubMembers, setClubMembers] = useState([]);
  const [clubMembersLoading, setClubMembersLoading] = useState(false);
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

  // 클럽 멤버 조회
  const fetchClubMembers = useMemo(
    () =>
      createFetchMembersHandler({
        clubId: form.club_id,
        fetchClubMembers: clubsApi.getClubMembers,
        extractList,
        setMembers: setClubMembers,
        setIsLoading: setClubMembersLoading,
        setError: () => {},
      }),
    [form.club_id]
  );

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  // 클럽 선택 시 멤버 목록 조회
  useEffect(() => {
    if (form.club_id && form.is_private) {
      fetchClubMembers();
    } else {
      setClubMembers([]);
    }
  }, [form.club_id, form.is_private, fetchClubMembers]);

  // 프라이빗 라운딩 토글 (is_private은 boolean이므로 true/false로 설정)
  const handleTogglePrivate = useCallback((isPrivate) => {
    setForm((prev) => ({
      ...prev,
      is_private: isPrivate,
      selected_participants: !isPrivate ? [] : prev.selected_participants,
      selected_guests: !isPrivate ? [] : prev.selected_guests,
    }));
  }, []);

  // 참가자 선택/해제
  const handleToggleParticipant = useCallback((userId) => {
    setForm((prev) => {
      const current = Array.isArray(prev.selected_participants) ? prev.selected_participants : [];
      const isSelected = current.includes(userId);
      return {
        ...prev,
        selected_participants: isSelected
          ? current.filter((id) => id !== userId)
          : [...current, userId],
      };
    });
  }, []);

  // 게스트 추가
  const handleAddGuest = useCallback(() => {
    setForm((prev) => {
      const current = Array.isArray(prev.selected_guests) ? prev.selected_guests : [];
      return {
        ...prev,
        selected_guests: [
          ...current,
          {
            name: '',
            birthdate: '',
            gender: 'MALE',
            average_score: '',
            handicap: '',
          },
        ],
      };
    });
  }, []);

  // 게스트 제거
  const handleRemoveGuest = useCallback((index) => {
    setForm((prev) => {
      const current = Array.isArray(prev.selected_guests) ? prev.selected_guests : [];
      return {
        ...prev,
        selected_guests: current.filter((_, i) => i !== index),
      };
    });
  }, []);

  // 게스트 정보 변경
  const handleGuestChange = useCallback((index, field, value) => {
    setForm((prev) => {
      const current = Array.isArray(prev.selected_guests) ? prev.selected_guests : [];
      const updated = [...current];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return {
        ...prev,
        selected_guests: updated,
      };
    });
  }, []);

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

              {/* 프라이빗 라운딩 선택 */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>라운딩 유형</Text>
                <View style={styles.chipRow}>
                  <ChipOption
                    label="일반 라운딩"
                    selected={!form.is_private}
                    onPress={() => handleTogglePrivate(false)}
                    styles={styles}
                  />
                  <ChipOption
                    label="프라이빗 라운딩"
                    selected={form.is_private}
                    onPress={() => handleTogglePrivate(true)}
                    styles={styles}
                  />
                </View>
                <Text style={styles.helperText}>
                  {form.is_private
                    ? '프라이빗 라운딩은 선택한 참가자에게만 보입니다.'
                    : '일반 라운딩은 클럽 전체 멤버에게 공개됩니다.'}
                </Text>
              </View>

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

            {/* 프라이빗 라운딩 참가자 선택 */}
            {form.is_private && form.club_id && (
              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>참가자 선택</Text>
                <Text style={styles.sectionSubtitle}>
                  프라이빗 라운딩에 참가할 클럽 멤버를 선택해주세요. (최소 1명 이상)
                </Text>

                {clubMembersLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary[600]} />
                    <Text style={styles.helperText}>멤버 목록을 불러오는 중...</Text>
                  </View>
                ) : clubMembers.length === 0 ? (
                  <Text style={styles.helperText}>클럽 멤버가 없습니다.</Text>
                ) : (
                  <>
                    <View style={styles.memberList}>
                      {clubMembers
                        .filter((member) => {
                          const status = member?.status || member?.membership_status || 'ACTIVE';
                          return status === 'ACTIVE' || status === 'APPROVED';
                        })
                        .map((member) => {
                          const memberId = member?.id || member?.user_id || member?.member_id;
                          const memberName =
                            member?.user?.realname ||
                            member?.user?.nickname ||
                            member?.name ||
                            member?.nickname ||
                            '이름 없음';
                          const isSelected = Array.isArray(form.selected_participants)
                            ? form.selected_participants.includes(memberId)
                            : false;
                          const isCurrentUser = user?.id === memberId;

                          return (
                            <Pressable
                              key={memberId}
                              onPress={() => handleToggleParticipant(memberId)}
                              style={({ pressed }) => [
                                styles.memberItem,
                                isSelected && styles.memberItemSelected,
                                pressed && styles.memberItemPressed,
                              ]}
                            >
                              <View style={styles.memberItemContent}>
                                <FontAwesome5
                                  name={isSelected ? 'check-circle' : 'circle'}
                                  size={20}
                                  color={isSelected ? colors.primary[600] : colors.neutral[400]}
                                />
                                <Text style={[styles.memberName, isSelected && styles.memberNameSelected]}>
                                  {memberName}
                                  {isCurrentUser && ' (나)'}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        })}
                    </View>
                    {fieldErrors.selected_participants && (
                      <Text style={styles.errorText}>{fieldErrors.selected_participants}</Text>
                    )}
                    {Array.isArray(form.selected_participants) && form.selected_participants.length > 0 && (
                      <Text style={styles.helperText}>
                        {form.selected_participants.length}명이 선택되었습니다.
                      </Text>
                    )}
                  </>
                )}
              </Card>
            )}

            {/* 프라이빗 라운딩 게스트 추가 */}
            {form.is_private && (
              <Card style={styles.card}>
                <View style={styles.sectionRow}>
                  <View>
                    <Text style={styles.sectionTitle}>게스트 추가</Text>
                    <Text style={styles.sectionSubtitle}>게스트를 추가할 수 있습니다. (선택사항)</Text>
                  </View>
                  <Button variant="secondary" size="sm" onPress={handleAddGuest}>
                    <FontAwesome5 name="plus" size={12} color={colors.primary[600]} />
                    <Text style={styles.addButtonText}>게스트 추가</Text>
                  </Button>
                </View>

                {Array.isArray(form.selected_guests) && form.selected_guests.length > 0 && (
                  <View style={styles.guestList}>
                    {form.selected_guests.map((guest, index) => (
                      <Card key={index} style={styles.guestCard}>
                        <View style={styles.guestHeader}>
                          <Text style={styles.guestTitle}>게스트 {index + 1}</Text>
                          <Pressable
                            onPress={() => handleRemoveGuest(index)}
                            style={styles.removeButton}
                          >
                            <FontAwesome5 name="times" size={16} color={colors.error[600]} />
                          </Pressable>
                        </View>

                        <View style={styles.fieldGroup}>
                          <Text style={styles.label}>이름</Text>
                          <TextInput
                            value={guest.name || ''}
                            onChangeText={(value) => handleGuestChange(index, 'name', value)}
                            placeholder="게스트 이름"
                            style={[styles.input, fieldErrors[`guest_${index}_name`] && styles.inputError]}
                            placeholderTextColor={colors.neutral[400]}
                          />
                          {fieldErrors[`guest_${index}_name`] && (
                            <Text style={styles.errorText}>{fieldErrors[`guest_${index}_name`]}</Text>
                          )}
                        </View>

                        <View style={styles.row}>
                          <View style={styles.halfField}>
                            <Text style={styles.label}>생년월일</Text>
                            <DateTimeField
                              value={guest.birthdate || ''}
                              onChange={(value) => handleGuestChange(index, 'birthdate', value)}
                              placeholder="YYYY-MM-DD"
                              error={fieldErrors[`guest_${index}_birthdate`]}
                              minimumDate={undefined}
                            />
                          </View>
                          <View style={[styles.halfField, styles.halfFieldLast]}>
                            <Text style={styles.label}>성별</Text>
                            <View style={styles.chipRow}>
                              <ChipOption
                                label="남성"
                                selected={guest.gender === 'MALE'}
                                onPress={() => handleGuestChange(index, 'gender', 'MALE')}
                                styles={styles}
                              />
                              <ChipOption
                                label="여성"
                                selected={guest.gender === 'FEMALE'}
                                onPress={() => handleGuestChange(index, 'gender', 'FEMALE')}
                                styles={styles}
                              />
                            </View>
                          </View>
                        </View>

                        <View style={styles.row}>
                          <View style={styles.halfField}>
                            <Text style={styles.label}>평균 타수</Text>
                            <TextInput
                              value={guest.average_score || ''}
                              onChangeText={(value) => handleGuestChange(index, 'average_score', value)}
                              placeholder="예: 100"
                              keyboardType="numeric"
                              style={[styles.input, fieldErrors[`guest_${index}_average_score`] && styles.inputError]}
                              placeholderTextColor={colors.neutral[400]}
                            />
                          </View>
                          <View style={[styles.halfField, styles.halfFieldLast]}>
                            <Text style={styles.label}>핸디캡</Text>
                            <TextInput
                              value={guest.handicap || ''}
                              onChangeText={(value) => handleGuestChange(index, 'handicap', value)}
                              placeholder="예: 20.0"
                              keyboardType="numeric"
                              style={[styles.input, fieldErrors[`guest_${index}_handicap`] && styles.inputError]}
                              placeholderTextColor={colors.neutral[400]}
                            />
                          </View>
                        </View>
                      </Card>
                    ))}
                  </View>
                )}
              </Card>
            )}

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
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.sm2,
  },
  memberList: {
    marginTop: tokens.spacing.sm,
    maxHeight: 300,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.padding.sm,
    paddingHorizontal: tokens.padding.base,
    borderRadius: tokens.radius.base,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    marginBottom: tokens.spacing.xs,
  },
  memberItemSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  memberItemPressed: {
    opacity: 0.7,
  },
  memberItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberName: {
    marginLeft: tokens.spacing.sm,
    fontSize: tokens.font.base,
    color: colors.neutral[700],
  },
  memberNameSelected: {
    color: colors.primary[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  guestList: {
    marginTop: tokens.spacing.md,
  },
  guestCard: {
    marginBottom: tokens.spacing.md,
    padding: tokens.padding.md,
    backgroundColor: colors.neutral[50],
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  guestTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  removeButton: {
    padding: tokens.padding.xs,
  },
  addButtonText: {
    marginLeft: tokens.spacing.xs,
    fontSize: tokens.font.sm,
    color: colors.primary[600],
    fontWeight: tokens.fontWeight.semibold,
  },
});
