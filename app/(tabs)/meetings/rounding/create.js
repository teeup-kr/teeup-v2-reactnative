import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
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
import { clubsApi, meetingsApi, mypageApi } from '@/lib/api/api';
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

function normalizeId(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    return value.id ?? value.user_id ?? value.member_id ?? null;
  }
  return value;
}

function dedupeIds(values = []) {
  const map = new Map();
  values.forEach((value) => {
    const id = normalizeId(value);
    if (id === null || id === undefined || id === '') return;
    map.set(String(id), id);
  });
  return Array.from(map.values());
}

function getUserName(user) {
  if (!user || typeof user !== 'object') return '나';
  return (
    user.realname ||
    user.name ||
    user.nickname ||
    user.username ||
    user.email ||
    '나'
  );
}

function getMemberDisplayName(member) {
  return (
    member?.name ||
    member?.user?.realname ||
    member?.user?.nickname ||
    member?.nickname ||
    '이름 없음'
  );
}

function buildSelectedMemberFromUser(user) {
  const id = normalizeId(user?.id);
  if (id === null || id === undefined || id === '') return null;
  const gender = user?.gender ?? user?.user_gender ?? null;
  const handicap =
    user?.handicap ??
    user?.handicap_init ??
    user?.handicap_index ??
    user?.initial_handicap ??
    user?.calculated_handicap ??
    null;

  return {
    id,
    name: getUserName(user),
    gender,
    handicap,
    club_id: null,
    club_name: '',
    is_me: true,
  };
}

function buildSelectedMemberFromSearch(member, club) {
  const id = normalizeId(member?.id);
  if (id === null || id === undefined || id === '') return null;
  return {
    id,
    name: getMemberDisplayName(member),
    gender: member?.gender || null,
    handicap: member?.handicap ?? member?.handicap_index ?? null,
    club_id: club?.club_id ?? null,
    club_name: club?.club_name || '',
    is_me: false,
  };
}

const PARTICIPANTS_PER_PAGE = 5;

function compareParticipantName(left, right) {
  const leftName = String(left?.name || '');
  const rightName = String(right?.name || '');
  if (leftName === rightName) return 0;
  return leftName.localeCompare(rightName, 'ko-KR');
}





export function RoundingForm({ mode = 'create' }) {
  const router = useRouter();
  const { meetingId } = useLocalSearchParams();
  const meetingIdValue = Array.isArray(meetingId) ? meetingId[0] : meetingId;
  const isEditMode = mode === 'edit';

  const { user } = useAuth();
  const [myProfile, setMyProfile] = useState(null);
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
    selected_participant_details: [],
    selected_guests: [],
  });
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [participantModalVisible, setParticipantModalVisible] = useState(false);
  const [participantSearchKeyword, setParticipantSearchKeyword] = useState('');
  const [participantSearchLoading, setParticipantSearchLoading] = useState(false);
  const [participantSearchResults, setParticipantSearchResults] = useState([]);
  const [outsideParticipantPage, setOutsideParticipantPage] = useState(1);
  const [modalParticipantPage, setModalParticipantPage] = useState(1);

  const estimatedTotalCost = useMemo(() => {
    const greenFee = Number(form.green_fee) || 0;
    const caddyFee = Number(form.caddy_fee) || 0;
    const cartFee = Number(form.cart_fee) || 0;
    return greenFee + caddyFee + cartFee;
  }, [form.green_fee, form.caddy_fee, form.cart_fee]);

  const hasDraft = useMemo(
    () =>
      Boolean(
        form.name.trim() ||
          form.description.trim() ||
          form.location.trim() ||
          form.meeting_time ||
          form.application_deadline ||
          form.club_id ||
          form.course_name.trim() ||
          form.reservation_name.trim() ||
          form.tee_times.trim() ||
          form.max_participants ||
          Number(form.green_fee) > 0 ||
          Number(form.caddy_fee) > 0 ||
          Number(form.cart_fee) > 0 ||
          (Array.isArray(form.selected_participants) && form.selected_participants.length > 0) ||
          (Array.isArray(form.selected_guests) && form.selected_guests.length > 0)
      ),
    [form]
  );

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

  useEffect(() => {
    let isMounted = true;

    const fetchMyProfile = async () => {
      try {
        const response = await mypageApi.fetchMyProfile();
        const profile = extractData(response);
        if (isMounted && profile) {
          setMyProfile(profile);
        }
      } catch (profileError) {
        console.error('내 프로필 조회 실패:', profileError);
      }
    };

    fetchMyProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const mySelectedMember = useMemo(
    () => buildSelectedMemberFromUser(myProfile ?? user),
    [myProfile, user]
  );

  const selectedParticipantDetails = useMemo(() => {
    const ids = dedupeIds(form.selected_participants);
    const details = Array.isArray(form.selected_participant_details)
      ? form.selected_participant_details
      : [];
    const detailMap = new Map();

    details.forEach((member) => {
      const id = normalizeId(member?.id);
      if (id === null || id === undefined || id === '') return;
      detailMap.set(String(id), {
        id,
        name: getMemberDisplayName(member),
        gender: member?.gender ?? null,
        handicap: member?.handicap ?? member?.handicap_index ?? null,
        club_id: member?.club_id ?? null,
        club_name: member?.club_name ?? '',
        is_me: Boolean(member?.is_me),
      });
    });

    return ids.map((id) => {
      const key = String(id);
      if (detailMap.has(key)) return detailMap.get(key);
      if (mySelectedMember && String(mySelectedMember.id) === key) return mySelectedMember;
      return {
        id,
        name: `멤버 #${id}`,
        gender: null,
        handicap: null,
        club_id: null,
        club_name: '',
        is_me: false,
      };
    });
  }, [form.selected_participant_details, form.selected_participants, mySelectedMember]);

  const sortedSelectedParticipants = useMemo(() => {
    const meId = mySelectedMember ? String(mySelectedMember.id) : null;
    return [...selectedParticipantDetails].sort((left, right) => {
      const leftIsMe =
        Boolean(left?.is_me) || (meId !== null && String(normalizeId(left?.id)) === meId);
      const rightIsMe =
        Boolean(right?.is_me) || (meId !== null && String(normalizeId(right?.id)) === meId);

      if (leftIsMe && !rightIsMe) return -1;
      if (!leftIsMe && rightIsMe) return 1;
      return compareParticipantName(left, right);
    });
  }, [selectedParticipantDetails, mySelectedMember]);

  const totalParticipantPages = useMemo(
    () => Math.max(1, Math.ceil(sortedSelectedParticipants.length / PARTICIPANTS_PER_PAGE)),
    [sortedSelectedParticipants.length]
  );

  const outsidePagedParticipants = useMemo(() => {
    const start = (outsideParticipantPage - 1) * PARTICIPANTS_PER_PAGE;
    return sortedSelectedParticipants.slice(start, start + PARTICIPANTS_PER_PAGE);
  }, [outsideParticipantPage, sortedSelectedParticipants]);

  const modalPagedParticipants = useMemo(() => {
    const start = (modalParticipantPage - 1) * PARTICIPANTS_PER_PAGE;
    return sortedSelectedParticipants.slice(start, start + PARTICIPANTS_PER_PAGE);
  }, [modalParticipantPage, sortedSelectedParticipants]);

  useEffect(() => {
    setOutsideParticipantPage((prev) => Math.min(prev, totalParticipantPages));
    setModalParticipantPage((prev) => Math.min(prev, totalParticipantPages));
  }, [totalParticipantPages]);

  const handleOutsidePrevPage = useCallback(() => {
    setOutsideParticipantPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleOutsideNextPage = useCallback(() => {
    setOutsideParticipantPage((prev) => Math.min(totalParticipantPages, prev + 1));
  }, [totalParticipantPages]);

  const handleModalPrevPage = useCallback(() => {
    setModalParticipantPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleModalNextPage = useCallback(() => {
    setModalParticipantPage((prev) => Math.min(totalParticipantPages, prev + 1));
  }, [totalParticipantPages]);

  const selectedParticipantIdSet = useMemo(
    () => new Set(dedupeIds(form.selected_participants).map((id) => String(id))),
    [form.selected_participants]
  );

  const searchResultGroups = useMemo(() => {
    const groups = Array.isArray(participantSearchResults) ? participantSearchResults : [];
    const resultIds = new Set();

    groups.forEach((group) => {
      const members = Array.isArray(group?.members) ? group.members : [];
      members.forEach((member) => {
        const id = normalizeId(member?.id);
        if (id === null || id === undefined || id === '') return;
        resultIds.add(String(id));
      });
    });

    const stickyMembers = selectedParticipantDetails
      .filter((member) => !resultIds.has(String(normalizeId(member?.id))))
      .map((member) => ({
        id: member.id,
        name: member.name,
        gender: member.gender,
        handicap: member.handicap,
      }));

    if (stickyMembers.length === 0) {
      return groups;
    }

    return [
      {
        club_id: 'selected',
        club_name: '선택된 참가자',
        members: stickyMembers,
      },
      ...groups,
    ];
  }, [participantSearchResults, selectedParticipantDetails]);

  const ensureMyselfParticipant = useCallback((prev) => {
    if (!mySelectedMember) return prev;
    const currentIds = dedupeIds(prev.selected_participants);
    const hasMe = currentIds.some((id) => String(id) === String(mySelectedMember.id));
    if (hasMe) {
      const currentDetails = Array.isArray(prev.selected_participant_details)
        ? prev.selected_participant_details
        : [];
      const myDetailIndex = currentDetails.findIndex(
        (member) => String(normalizeId(member?.id)) === String(mySelectedMember.id)
      );
      if (myDetailIndex >= 0) {
        const existing = currentDetails[myDetailIndex] ?? {};
        const shouldUpdate =
          existing?.name !== mySelectedMember.name ||
          existing?.gender !== mySelectedMember.gender ||
          existing?.handicap !== mySelectedMember.handicap ||
          existing?.is_me !== true;

        if (!shouldUpdate) {
          return prev;
        }

        const nextDetails = [...currentDetails];
        nextDetails[myDetailIndex] = {
          ...existing,
          ...mySelectedMember,
          is_me: true,
        };
        return {
          ...prev,
          selected_participant_details: nextDetails,
        };
      }

      return {
        ...prev,
        selected_participant_details: [...currentDetails, mySelectedMember],
      };
    }

    return {
      ...prev,
      selected_participants: [...currentIds, mySelectedMember.id],
      selected_participant_details: [
        ...(Array.isArray(prev.selected_participant_details) ? prev.selected_participant_details : []),
        mySelectedMember,
      ],
    };
  }, [mySelectedMember]);

  useEffect(() => {
    if (!form.is_private) return;
    setForm((prev) => ensureMyselfParticipant(prev));
  }, [form.is_private, ensureMyselfParticipant]);

  useEffect(() => {
    if (form.is_private) return;
    setParticipantModalVisible(false);
    setParticipantSearchKeyword('');
    setParticipantSearchResults([]);
    setOutsideParticipantPage(1);
    setModalParticipantPage(1);
  }, [form.is_private]);

  // 프라이빗 라운딩 토글 (is_private은 boolean이므로 true/false로 설정)
  const handleTogglePrivate = useCallback((isPrivate) => {
    setForm((prev) => {
      if (!isPrivate) {
        return {
          ...prev,
          is_private: false,
          selected_participants: [],
          selected_participant_details: [],
          selected_guests: [],
        };
      }

      return ensureMyselfParticipant({
        ...prev,
        is_private: true,
      });
    });
  }, [ensureMyselfParticipant]);

  const handleOpenParticipantModal = useCallback(() => {
    if (!form.is_private) return;
    setParticipantSearchKeyword('');
    setParticipantSearchResults([]);
    setModalParticipantPage(1);
    setParticipantModalVisible(true);
  }, [form.is_private]);

  const handleCloseParticipantModal = useCallback(() => {
    if (participantSearchLoading) return;
    setParticipantModalVisible(false);
  }, [participantSearchLoading]);

  const handleSearchParticipants = useCallback(async ({ keywordOverride } = {}) => {
    const keyword = String(keywordOverride ?? participantSearchKeyword ?? '').trim();
    const params = keyword ? { name: keyword, limit: 50 } : {};
    try {
      setParticipantSearchLoading(true);
      const response = await clubsApi.searchClubMembersByName(params);
      const payload = response?.data && !Array.isArray(response.data) ? response.data : response;
      const groups = Array.isArray(payload?.data) ? payload.data : [];
      const filteredGroups = form.club_id
        ? groups.filter((group) => String(group?.club_id) === String(form.club_id))
        : groups;
      setParticipantSearchResults(filteredGroups);
    } catch (searchError) {
      console.error('멤버 검색 실패:', searchError);
      Alert.alert('오류', searchError?.message || '멤버 검색에 실패했습니다.');
      setParticipantSearchResults([]);
    } finally {
      setParticipantSearchLoading(false);
    }
  }, [form.club_id, participantSearchKeyword]);

  useEffect(() => {
    if (!participantModalVisible || !form.is_private) return;

    let isMounted = true;
    const fetchAllMembers = async () => {
      try {
        setParticipantSearchLoading(true);
        const response = await clubsApi.searchClubMembersByName({});
        const payload = response?.data && !Array.isArray(response.data) ? response.data : response;
        const groups = Array.isArray(payload?.data) ? payload.data : [];
        const filteredGroups = form.club_id
          ? groups.filter((group) => String(group?.club_id) === String(form.club_id))
          : groups;
        if (isMounted) {
          setParticipantSearchResults(filteredGroups);
        }
      } catch (searchError) {
        console.error('전체 멤버 조회 실패:', searchError);
        if (isMounted) {
          setParticipantSearchResults([]);
        }
      } finally {
        if (isMounted) {
          setParticipantSearchLoading(false);
        }
      }
    };

    fetchAllMembers();
    return () => {
      isMounted = false;
    };
  }, [participantModalVisible, form.is_private, form.club_id]);

  const handleToggleParticipantFromSearch = useCallback((nextMember) => {
    if (!nextMember || normalizeId(nextMember.id) === null) return;
    setForm((prev) => {
      const currentIds = dedupeIds(prev.selected_participants);
      const currentDetails = Array.isArray(prev.selected_participant_details)
        ? prev.selected_participant_details
        : [];
      const memberId = normalizeId(nextMember.id);
      const alreadySelected = currentIds.some((id) => String(id) === String(memberId));

      if (alreadySelected && mySelectedMember && String(mySelectedMember.id) === String(memberId)) {
        Alert.alert('안내', "'나'는 프라이빗 라운딩 참가자에서 제외할 수 없습니다.");
        return prev;
      }

      if (alreadySelected) {
        return {
          ...prev,
          selected_participants: currentIds.filter((id) => String(id) !== String(memberId)),
          selected_participant_details: currentDetails.filter(
            (member) => String(normalizeId(member?.id)) !== String(memberId)
          ),
        };
      }

      return {
        ...prev,
        selected_participants: [...currentIds, memberId],
        selected_participant_details: [...currentDetails, nextMember],
      };
    });
    setFieldErrors((prev) => {
      if (!prev?.selected_participants) return prev;
      const nextErrors = { ...prev };
      delete nextErrors.selected_participants;
      return nextErrors;
    });
  }, [mySelectedMember]);

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
        canCreateMeeting,
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
      canCreateMeeting,
      meetingIdValue,
      router,
      setSaving,
      setFieldErrors,
    ]
  );

  const handleCancel = useCallback(() => {
    if (!isEditMode && !hasDraft) {
      router.back();
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
          onPress: () => router.back(),
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
                  <Text style={styles.helperText}>
                    {isEditMode
                      ? '가입된 클럽이 없습니다.'
                      : '모임 생성 권한(리더/매니저)이 있는 클럽이 없습니다.'}
                  </Text>
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

            {/* 프라이빗 라운딩 참가자 목록 */}
            {form.is_private && (
              <Card style={styles.card}>
                <View style={styles.sectionRow}>
                  <View>
                    <Text style={styles.sectionTitle}>참가자 목록</Text>
                    <Text style={styles.sectionSubtitle}>
                      프라이빗 라운딩 참가자입니다. '나'는 기본으로 포함됩니다.
                    </Text>
                  </View>
                  <Pressable style={styles.editParticipantsButton} onPress={handleOpenParticipantModal}>
                    <FontAwesome5 name="edit" size={12} color={colors.white} />
                    <Text style={styles.editParticipantsButtonText}>편집</Text>
                  </Pressable>
                </View>

                {sortedSelectedParticipants.length === 0 ? (
                  <Text style={styles.helperText}>참가자가 없습니다.</Text>
                ) : (
                  <>
                    <View style={styles.memberList}>
                    {outsidePagedParticipants.map((member) => {
                      const participantId = normalizeId(member?.id);
                      const isMe =
                        (member?.is_me === true) ||
                        (mySelectedMember && String(participantId) === String(mySelectedMember.id));
                      const genderLabel =
                        member?.gender === 'FEMALE'
                          ? '여성'
                          : member?.gender === 'MALE'
                            ? '남성'
                            : '성별 미입력';
                      const handicapLabel =
                        member?.handicap !== null &&
                        member?.handicap !== undefined &&
                        member?.handicap !== ''
                          ? `핸디캡 ${member.handicap}`
                          : '핸디캡 미입력';

                      return (
                        <View key={String(participantId)} style={styles.memberItem}>
                          <View style={styles.memberItemContent}>
                            <FontAwesome5 name="user" size={14} color={colors.primary[600]} />
                            <View style={styles.memberTextGroup}>
                              <Text style={styles.memberName}>
                                {member?.name || `멤버 #${participantId}`}
                                {isMe ? ' (나)' : ''}
                              </Text>
                              <Text style={styles.memberMeta}>
                                {genderLabel} · {handicapLabel}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                    </View>
                    <View style={styles.paginationRow}>
                      <Pressable
                        onPress={handleOutsidePrevPage}
                        disabled={outsideParticipantPage <= 1}
                        style={[
                          styles.paginationButton,
                          outsideParticipantPage <= 1 && styles.paginationButtonDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.paginationButtonText,
                            outsideParticipantPage <= 1 && styles.paginationButtonTextDisabled,
                          ]}
                        >
                          이전
                        </Text>
                      </Pressable>
                      <Text style={styles.paginationInfo}>
                        {outsideParticipantPage}/{totalParticipantPages}
                      </Text>
                      <Pressable
                        onPress={handleOutsideNextPage}
                        disabled={outsideParticipantPage >= totalParticipantPages}
                        style={[
                          styles.paginationButton,
                          outsideParticipantPage >= totalParticipantPages && styles.paginationButtonDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.paginationButtonText,
                            outsideParticipantPage >= totalParticipantPages && styles.paginationButtonTextDisabled,
                          ]}
                        >
                          다음
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}

                {fieldErrors.selected_participants && (
                  <Text style={styles.errorText}>{fieldErrors.selected_participants}</Text>
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

              <View style={styles.totalCostCard}>
                <Text style={styles.totalCostLabel}>예상 총 비용</Text>
                <Text style={styles.totalCostValue}>{estimatedTotalCost.toLocaleString('ko-KR')}원</Text>
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
                {isEditMode ? '수정 완료' : '라운딩 모임 생성'}
              </Button>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={participantModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseParticipantModal}
      >
        <View style={styles.participantModalBackdrop}>
          <View style={styles.participantModalCard}>
            <View style={styles.participantModalHeader}>
              <Text style={styles.participantModalTitle}>참가자 편집</Text>
              <Pressable onPress={handleCloseParticipantModal} style={styles.participantModalCloseButton}>
                <FontAwesome5 name="times" size={16} color={colors.neutral[600]} />
              </Pressable>
            </View>

            <View style={styles.participantSearchRow}>
              <TextInput
                value={participantSearchKeyword}
                onChangeText={setParticipantSearchKeyword}
                placeholder="이름으로 검색"
                placeholderTextColor={colors.neutral[400]}
                style={styles.participantSearchInput}
                returnKeyType="search"
                onSubmitEditing={handleSearchParticipants}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.participantSearchButton,
                  pressed && styles.memberItemPressed,
                ]}
                onPress={handleSearchParticipants}
                disabled={participantSearchLoading}
              >
                <Text style={styles.participantSearchButtonText}>검색</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.participantSearchResultArea}>
              {participantSearchLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary[600]} />
                  <Text style={styles.helperText}>검색 중...</Text>
                </View>
              ) : searchResultGroups.length === 0 ? (
                <Text style={styles.helperText}>
                  {participantSearchKeyword.trim()
                    ? '검색 결과가 없습니다.'
                    : '이름을 입력 후 검색하세요.'}
                </Text>
              ) : (
                searchResultGroups.map((clubGroup) => (
                  <View key={String(clubGroup?.club_id || clubGroup?.club_name)} style={styles.searchClubGroup}>
                    <Text style={styles.searchClubTitle}>
                      {clubGroup?.club_name || '클럽'}
                    </Text>
                    {(Array.isArray(clubGroup?.members) ? clubGroup.members : [])
                      .slice()
                      .sort((left, right) => {
                        const leftId = normalizeId(left?.id);
                        const rightId = normalizeId(right?.id);
                        const leftSelected =
                          leftId !== null &&
                          leftId !== undefined &&
                          leftId !== '' &&
                          selectedParticipantIdSet.has(String(leftId));
                        const rightSelected =
                          rightId !== null &&
                          rightId !== undefined &&
                          rightId !== '' &&
                          selectedParticipantIdSet.has(String(rightId));
                        if (leftSelected === rightSelected) return 0;
                        return leftSelected ? -1 : 1;
                      })
                      .map((member) => {
                      const participant = buildSelectedMemberFromSearch(member, clubGroup);
                      if (!participant) return null;
                      const memberId = participant.id;
                      const alreadySelected = selectedParticipantIdSet.has(String(memberId));

                      return (
                        <Pressable
                          key={String(memberId)}
                          onPress={() => handleToggleParticipantFromSearch(participant)}
                          style={({ pressed }) => [
                            styles.searchResultItem,
                            alreadySelected && styles.searchResultItemSelected,
                            pressed && styles.memberItemPressed,
                          ]}
                        >
                          <View style={styles.searchResultContent}>
                            <Text style={[styles.memberName, alreadySelected && styles.memberNameSelected]}>
                              {participant.name}
                            </Text>
                            <Text style={styles.searchResultMeta}>
                              {participant.gender === 'FEMALE'
                                ? '여성'
                                : participant.gender === 'MALE'
                                  ? '남성'
                                  : '성별 미입력'}
                              {participant.handicap !== null && participant.handicap !== undefined
                                ? ` · 핸디캡 ${participant.handicap}`
                                : ''}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.searchToggleButton,
                              alreadySelected
                                ? styles.searchToggleButtonSelected
                                : styles.searchToggleButtonUnselected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.searchToggleButtonText,
                                alreadySelected
                                  ? styles.searchToggleButtonTextSelected
                                  : styles.searchToggleButtonTextUnselected,
                              ]}
                            >
                              {alreadySelected ? '선택됨' : '추가'}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.modalSelectedSection}>
              <Text style={styles.modalSelectedTitle}>
                선택된 참가자 {sortedSelectedParticipants.length}명
              </Text>
              <ScrollView style={styles.modalSelectedList}>
                {modalPagedParticipants.map((member) => {
                  const participantId = normalizeId(member?.id);
                  const isMe =
                    (member?.is_me === true) ||
                    (mySelectedMember && String(participantId) === String(mySelectedMember.id));
                  const genderLabel =
                    member?.gender === 'FEMALE'
                      ? '여성'
                      : member?.gender === 'MALE'
                        ? '남성'
                        : '성별 미입력';
                  const handicapLabel =
                    member?.handicap !== null &&
                    member?.handicap !== undefined &&
                    member?.handicap !== ''
                      ? `핸디캡 ${member.handicap}`
                      : '핸디캡 미입력';
                  return (
                    <View key={String(participantId)} style={styles.modalSelectedItem}>
                      <View style={styles.modalSelectedTextGroup}>
                        <Text style={styles.memberName}>
                          {member?.name || `멤버 #${participantId}`}
                          {isMe ? ' (나)' : ''}
                        </Text>
                        <Text style={styles.memberMeta}>
                          {genderLabel} · {handicapLabel}
                        </Text>
                      </View>
                      <Text style={styles.modalSelectedStatusText}>선택됨</Text>
                    </View>
                  );
                })}
              </ScrollView>
              <View style={styles.paginationRow}>
                <Pressable
                  onPress={handleModalPrevPage}
                  disabled={modalParticipantPage <= 1}
                  style={[
                    styles.paginationButton,
                    modalParticipantPage <= 1 && styles.paginationButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.paginationButtonText,
                      modalParticipantPage <= 1 && styles.paginationButtonTextDisabled,
                    ]}
                  >
                    이전
                  </Text>
                </Pressable>
                <Text style={styles.paginationInfo}>
                  {modalParticipantPage}/{totalParticipantPages}
                </Text>
                <Pressable
                  onPress={handleModalNextPage}
                  disabled={modalParticipantPage >= totalParticipantPages}
                  style={[
                    styles.paginationButton,
                    modalParticipantPage >= totalParticipantPages && styles.paginationButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.paginationButtonText,
                      modalParticipantPage >= totalParticipantPages && styles.paginationButtonTextDisabled,
                    ]}
                  >
                    다음
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  editParticipantsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: tokens.radius.base,
    backgroundColor: colors.primary[600],
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
  },
  editParticipantsButtonText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.white,
  },
  memberList: {
    marginTop: tokens.spacing.sm,
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
  memberTextGroup: {
    marginLeft: tokens.spacing.sm,
    flex: 1,
  },
  memberName: {
    fontSize: tokens.font.base,
    color: colors.neutral[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  memberMeta: {
    marginTop: 2,
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  memberNameSelected: {
    color: colors.primary[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  participantModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.lg,
  },
  participantModalCard: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.xl,
    padding: tokens.padding.md,
    width: '100%',
    maxWidth: 720,
    height: '90%',
  },
  participantModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm2,
  },
  participantModalTitle: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  participantModalCloseButton: {
    padding: tokens.padding.xs,
  },
  participantSearchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: tokens.spacing.sm2,
  },
  participantSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    fontSize: tokens.font.base,
    color: colors.neutral[900],
    backgroundColor: colors.white,
  },
  participantSearchButton: {
    borderRadius: tokens.radius.base,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    paddingHorizontal: tokens.padding.sm,
  },
  participantSearchButtonText: {
    fontSize: tokens.font.sm,
    color: colors.white,
    fontWeight: tokens.fontWeight.semibold,
  },
  participantSearchResultArea: {
    maxHeight: 280,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.base,
    padding: tokens.padding.sm,
    marginBottom: tokens.spacing.sm2,
  },
  searchClubGroup: {
    marginBottom: tokens.spacing.sm2,
  },
  searchClubTitle: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
    marginBottom: tokens.spacing.xs,
  },
  searchResultItem: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.base,
    backgroundColor: colors.white,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.sm,
    marginBottom: tokens.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchResultItemSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  searchToggleButton: {
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.padding.xs2,
    paddingVertical: tokens.padding.xxs,
  },
  searchToggleButtonSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[100],
  },
  searchToggleButtonUnselected: {
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  searchToggleButtonText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
  searchToggleButtonTextSelected: {
    color: colors.primary[700],
  },
  searchToggleButtonTextUnselected: {
    color: colors.neutral[600],
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultMeta: {
    marginTop: 2,
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  modalSelectedSection: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: tokens.padding.sm,
  },
  modalSelectedTitle: {
    fontSize: tokens.font.sm,
    color: colors.neutral[800],
    fontWeight: tokens.fontWeight.semibold,
    marginBottom: tokens.spacing.xs2,
  },
  modalSelectedList: {
    maxHeight: 180,
  },
  modalSelectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.base,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
    marginBottom: tokens.spacing.xs,
  },
  modalSelectedTextGroup: {
    flex: 1,
    marginRight: tokens.spacing.sm2,
  },
  modalSelectedStatusText: {
    fontSize: tokens.font.xs,
    color: colors.primary[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  paginationRow: {
    marginTop: tokens.spacing.xs2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  paginationButton: {
    minWidth: 64,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    backgroundColor: colors.white,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
  },
  paginationButtonText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  paginationButtonTextDisabled: {
    color: colors.neutral[400],
  },
  paginationInfo: {
    fontSize: tokens.font.xs,
    color: colors.neutral[700],
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
  totalCostCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.base,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.sm,
  },
  totalCostLabel: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  totalCostValue: {
    marginTop: 2,
    fontSize: tokens.font.base,
    color: colors.neutral[900],
    fontWeight: tokens.fontWeight.bold,
  },
  submitRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: tokens.spacing.lg,
  },
  submitButton: {
    flex: 1,
  },
});
