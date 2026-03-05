import { getMeetingTypeValue } from '@/lib/util/meetingUtils';
import { ensureProfileCompleted } from '@/lib/util/mypageUtils';

async function ensureMeetingProfileCompleted(router) {
    return ensureProfileCompleted({
        router,
        alertMessage: '모임 이용 전 프로필을 완성해 주세요!',
    });
}

function getClubRoleValue(club) {
    return String(club?.my_role || club?.membership_role || club?.role || '').toUpperCase();
}

function canManageClubMeetings(club) {
    const role = getClubRoleValue(club);
    return role === 'LEADER' || role === 'MANAGER';
}

function getTotalPages(payload) {
    const totalPages = Number(payload?.total_pages);
    if (!Number.isFinite(totalPages) || totalPages <= 0) return 1;
    return totalPages;
}

export function createFetchUserInfoHandler({
    fetchMyProfile,
    fetchUserHandicap,
    extractData,
    setUser,
    setUserInfo,
    setUserInfoLoading,
    setHandicapInfo,
    setHandicapLoading,
    buildUserInfoFromProfile,
}) {
    return async function () {
        try {
            setUserInfoLoading(true);
            const response = await fetchMyProfile();
            const profile = extractData(response);
            setUser(profile);
            setUserInfo(buildUserInfoFromProfile(profile));

            if (profile?.id) {
                setHandicapLoading(true);
                const handicapResponse = await fetchUserHandicap(profile.id);
                setHandicapInfo(extractData(handicapResponse));
            }
        } catch (error) {
            console.error('사용자 정보 조회 실패:', error);
        } finally {
            setUserInfoLoading(false);
            setHandicapLoading(false);
        }
    };
}

/** 게스트 목록을 정산/참가자 UI에서 쓰는 participant 형태로 정규화 (guest_id, id, guest_name 등) */
function normalizeGuestsToParticipants(guestList) {
    if (!Array.isArray(guestList)) return [];
    return guestList.map((g) => ({
        id: g?.id ?? g?.participant_id,
        guest_id: g?.guest_id ?? g?.id,
        guest_name: g?.guest_name ?? g?.name ?? g?.realname,
        name: g?.name ?? g?.guest_name,
        status: g?.status ?? 'CONFIRMED',
    }));
}

export function createFetchParticipantsHandler({
    meetingIdValue,
    typeSlug,
    meeting,
    fetchRoundParticipants,
    fetchSocialParticipants,
    fetchGuests,
    extractList,
    setParticipants,
    setConfirmedParticipants,
}) {
    return async function () {
        if (!meetingIdValue) return;

        try {
            if (typeSlug === 'social') {
                if (typeof fetchSocialParticipants === 'function') {
                    const response = await fetchSocialParticipants(meetingIdValue);
                    const list = extractList(response);
                    setParticipants(list);
                    if (typeof setConfirmedParticipants === 'function') {
                        setConfirmedParticipants(
                            list.filter((p) => String(p?.status || '').toUpperCase() === 'CONFIRMED')
                        );
                    }
                } else {
                    const list = extractList(meeting?.participants);
                    setParticipants(list);
                }
                return;
            }

            const response = await fetchRoundParticipants(meetingIdValue);
            const list = extractList(response);
            let merged = Array.isArray(list) ? [...list] : [];

            if (typeof fetchGuests === 'function') {
                try {
                    const guestsResponse = await fetchGuests(meetingIdValue);
                    const guestsRaw = extractList(guestsResponse);
                    const guests = normalizeGuestsToParticipants(guestsRaw);
                    const existingKeys = new Set(merged.map((p) => (p?.user_id != null ? `user:${p.user_id}` : p?.guest_id != null ? `guest:${p.guest_id}` : `id:${p?.id}`)));
                    guests.forEach((g) => {
                        const key = g?.guest_id != null ? `guest:${g.guest_id}` : `id:${g?.id}`;
                        if (!existingKeys.has(key)) {
                            merged.push(g);
                            existingKeys.add(key);
                        }
                    });
                } catch (guestError) {
                    console.warn('게스트 목록 조회 실패:', guestError);
                }
            }

            setParticipants(merged);
            if (typeof setConfirmedParticipants === 'function') {
                const confirmed = merged.filter(
                    (p) => p?.guest_id != null || String(p?.status || '').toUpperCase() === 'CONFIRMED'
                );
                setConfirmedParticipants(confirmed);
            }
        } catch (error) {
            console.error('참가자 조회 실패:', error);
        }
    };
}

export function createFetchTeamsHandler({ meetingIdValue, isRoundingMeeting, fetchRoundTeams, extractList, setTeams }) {
    return async function () {
        if (!meetingIdValue || !isRoundingMeeting) return;

        try {
            const response = await fetchRoundTeams(meetingIdValue);
            setTeams(extractList(response));
        } catch (error) {
            console.error('팀 조회 실패:', error);
        }
    };
}

export function createFetchApplicationStatusHandler({ meetingIdValue, isRoundingMeeting, fetchApplicationStatus, extractData, setApplicationStatus }) {
    return async function () {
        if (!meetingIdValue || !isRoundingMeeting) return;
        try {
            const response = await fetchApplicationStatus(meetingIdValue);
            setApplicationStatus(extractData(response));
        } catch (error) {
            console.error('신청 상태 조회 실패:', error);
        }
    };
}

export function createUpdateUserInfoHandler({
    userInfo,
    userId,
    updateMyProfile,
    updateUserHandicap,
    setProcessingAction,
    setIsEditingUserInfo,
    fetchUserInfo,
    alert,
}) {
    return async function () {
        try {
            setProcessingAction(true);
            await updateMyProfile({
                realname: userInfo.realname,
                average_score: userInfo.average_score ? Number(userInfo.average_score) : null,
                phone_number: userInfo.phone_number || null,
                birthdate: userInfo.birthdate || null,
                gender: userInfo.gender || null,
            });

            const handicapRaw = userInfo?.handicap;
            if (
                typeof updateUserHandicap === 'function' &&
                userId &&
                handicapRaw !== undefined &&
                handicapRaw !== null &&
                `${handicapRaw}`.trim() !== ''
            ) {
                const handicapValue = Number(handicapRaw);
                if (Number.isFinite(handicapValue)) {
                    await updateUserHandicap(userId, { initial_handicap: handicapValue });
                }
            }

            setIsEditingUserInfo(false);
            fetchUserInfo();
        } catch (error) {
            alert('오류', error?.message || '회원정보 수정에 실패했습니다.');
        } finally {
            setProcessingAction(false);
        }
    };
}

export function createJoinHandler({
    typeSlug,
    meetingIdValue,
    joinSocial,
    joinRound,
    router,
    setJoinModalOpen,
    setProcessingAction,
    fetchParticipants,
    fetchMeeting,
    alert,
}) {
    return async function () {
        const isCompleted = await ensureMeetingProfileCompleted(router);
        if (!isCompleted) return;
        try {
            setProcessingAction(true);
            if (typeSlug === 'social') {
                await joinSocial(meetingIdValue);
            } else {
                await joinRound(meetingIdValue);
            }
            setJoinModalOpen(false);
            fetchParticipants();
            fetchMeeting();
        } catch (error) {
            alert('오류', error?.message || '참가 신청에 실패했습니다.');
        } finally {
            setProcessingAction(false);
        }
    };
}

export function createLeaveHandler({
    typeSlug,
    meetingIdValue,
    leaveSocial,
    leaveRound,
    router,
    setProcessingAction,
    fetchParticipants,
    fetchMeeting,
    alert,
}) {
    return async () => {
        const isCompleted = await ensureMeetingProfileCompleted(router);
        if (!isCompleted) return;
        alert('참가 취소', '참가를 취소하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
                text: '확인',
                onPress: async () => {
                    try {
                        setProcessingAction(true);
                        if (typeSlug === 'social') {
                            await leaveSocial(meetingIdValue);
                        } else {
                            await leaveRound(meetingIdValue);
                        }
                        fetchParticipants();
                        fetchMeeting();
                    } catch (error) {
                        alert('오류', error?.message || '참가 취소에 실패했습니다.');
                    } finally {
                        setProcessingAction(false);
                    }
                },
            },
        ]);
    };
}

export function createAutoFormTeamsHandler({
    meetingIdValue,
    autoFormTeams,
    router,
    extractList,
    setProcessingAction,
    setPreviewTeams,
    setTeamPreviewOpen,
    setTeams,
    setPreviewFormation,
    fetchTeams,
    onCloseTeamFormation,
    alert,
}) {
    return async function (payload = {}) {
        if (!meetingIdValue) return null;
        const isCompleted = await ensureMeetingProfileCompleted(router);
        if (!isCompleted) return null;
        try {
            setProcessingAction(true);
            const response = await autoFormTeams(meetingIdValue, payload);
            const teamsData = extractList(response?.teams || response?.data?.teams || response);
            if (payload.preview && !payload.batchMode) {
                if (typeof setPreviewFormation === 'function') {
                    const mode = payload?.formation_mode;
                    const size = payload?.team_size;
                    if (mode || size) {
                        setPreviewFormation({ mode, teamSize: size });
                    }
                }
                setPreviewTeams(teamsData);
                setTeamPreviewOpen(true);
            } else if (!payload.batchMode) {
                setTeams(teamsData);
                if (typeof fetchTeams === 'function' && (!teamsData || teamsData.length === 0)) {
                    await fetchTeams();
                }
                if (typeof onCloseTeamFormation === 'function') {
                    onCloseTeamFormation();
                }
            }
            return response;
        } catch (error) {
            alert('오류', error?.message || '팀 편성에 실패했습니다.');
            return null;
        } finally {
            setProcessingAction(false);
        }
    };
}

export function createConfirmTeamsHandler({
    meetingIdValue,
    confirmTeamFormation,
    router,
    setProcessingAction,
    setTeamPreviewOpen,
    fetchTeams,
    fetchMeeting,
    alert,
}) {
    return async function () {
        if (!meetingIdValue) return;
        const isCompleted = await ensureMeetingProfileCompleted(router);
        if (!isCompleted) return;
        try {
            setProcessingAction(true);
            await confirmTeamFormation(meetingIdValue);
            setTeamPreviewOpen(false);
            fetchTeams();
            fetchMeeting();
        } catch (error) {
            alert('오류', error?.message || '팀 편성 확정에 실패했습니다.');
        } finally {
            setProcessingAction(false);
        }
    };
}

export function createStartRoundingHandler({ meetingIdValue, startRounding, router, setProcessingAction, fetchMeeting, alert }) {
    return async function () {
        if (!meetingIdValue) return;
        const isCompleted = await ensureMeetingProfileCompleted(router);
        if (!isCompleted) return;
        try {
            setProcessingAction(true);
            await startRounding(meetingIdValue);
            fetchMeeting();
        } catch (error) {
            alert('오류', error?.message || '모임 진행 시작에 실패했습니다.');
        } finally {
            setProcessingAction(false);
        }
    };
}

export function createCompleteRoundingHandler({
    meetingIdValue,
    completeRounding,
    router,
    setProcessingAction,
    setRoundingCompleteOpen,
    fetchMeeting,
    alert,
}) {
    return async function () {
        if (!meetingIdValue) return;
        const isCompleted = await ensureMeetingProfileCompleted(router);
        if (!isCompleted) return;
        try {
            setProcessingAction(true);
            await completeRounding(meetingIdValue);
            setRoundingCompleteOpen(true);
            fetchMeeting();
        } catch (error) {
            alert('오류', error?.message || '라운딩 종료에 실패했습니다.');
        } finally {
            setProcessingAction(false);
        }
    };
}

export function createConfirmSettlementHandler({ meetingIdValue, confirmSettlement, router, setProcessingAction, fetchMeeting, alert }) {
    return async function () {
        if (!meetingIdValue) return;
        const isCompleted = await ensureMeetingProfileCompleted(router);
        if (!isCompleted) return;
        try {
            setProcessingAction(true);
            await confirmSettlement(meetingIdValue);
            fetchMeeting();
        } catch (error) {
            alert('오류', error?.message || '정산 확정에 실패했습니다.');
        } finally {
            setProcessingAction(false);
        }
    };
}

export function createSaveHistoryHandler({ previewTeams, setFormationHistory }) {
    return () => {
        if (!previewTeams.length) return;
        setFormationHistory((prev) => [
            {
                id: Date.now(),
                title: `편성 ${prev.length + 1}`,
                created_at: new Date().toLocaleString('ko-KR'),
                teams: previewTeams,
            },
            ...prev,
        ]);
    };
}

export function createRestoreHistoryHandler({ setTeams }) {
    return (item) => {
        if (item?.teams) {
            setTeams(item.teams);
        }
    };
}

export function createScoreSuccessHandler({ setScoreModalOpen, fetchMeeting, fetchParticipants }) {
    return () => {
        setScoreModalOpen(false);
        fetchMeeting();
        fetchParticipants();
    };
}

export function createFetchExpensesHandler({ meetingId, fetchRoundExpenses, extractList, setExpenses, setIsLoading, setError }) {
    return async function () {
        if (!meetingId) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            setError('');
            const response = await fetchRoundExpenses(meetingId);
            const list = extractList(response);
            setExpenses(list);
        } catch (error) {
            console.error('경비 조회 실패:', error);
            setError(error?.message || '경비 정보를 불러오는데 실패했습니다.');
            setExpenses([]);
        } finally {
            setIsLoading(false);
        }
    };
}
export function createFetchRoundingMeetingsHandler({
    fetchRounds,
    extractList,
    roundingPage,
    roundingSearchQuery,
    roundingStartDate,
    roundingEndDate,
    roundingStatusFilter,
    setRoundingMeetings,
    setRoundingTotalPages,
}) {
    return async function (page = roundingPage, search = roundingSearchQuery) {
        try {
            const response = await fetchRounds({
                page,
                limit: 6,
                ...(search ? { search } : {}),
                ...(roundingStartDate ? { start_date: roundingStartDate } : {}),
                ...(roundingEndDate ? { end_date: roundingEndDate } : {}),
                status_group: roundingStatusFilter,
            });
            setRoundingMeetings(extractList(response));
            setRoundingTotalPages(getTotalPages(response));
        } catch (error) {
            console.error('라운딩 조회 실패:', error);
            setRoundingMeetings([]);
            setRoundingTotalPages(1);
        }
    };
}

export function createFetchSocialMeetingsHandler({
    fetchSocials,
    extractList,
    socialPage,
    socialSearchQuery,
    socialStartDate,
    socialEndDate,
    socialStatusFilter,
    setSocialMeetings,
    setSocialTotalPages,
}) {
    return async function (page = socialPage, search = socialSearchQuery) {
        try {
            const response = await fetchSocials({
                page,
                limit: 6,
                ...(search ? { search } : {}),
                ...(socialStartDate ? { start_date: socialStartDate } : {}),
                ...(socialEndDate ? { end_date: socialEndDate } : {}),
                status_group: socialStatusFilter,
            });
            setSocialMeetings(extractList(response));
            setSocialTotalPages(getTotalPages(response));
        } catch (error) {
            console.error('소셜 모임 조회 실패:', error);
            setSocialMeetings([]);
            setSocialTotalPages(1);
        }
    };
}

export function createFetchParticipatingMeetingsHandler({
    fetchMyParticipatingMeetings,
    extractList,
    participatingPage,
    participatingSearchQuery,
    participatingStartDate,
    participatingEndDate,
    participatingStatusFilter,
    setParticipatingMeetings,
    setParticipatingTotalPages,
}) {
    return async function (page = participatingPage, search = participatingSearchQuery) {
        try {
            const response = await fetchMyParticipatingMeetings({
                page,
                limit: 6,
                ...(search ? { search } : {}),
                ...(participatingStartDate ? { start_date: participatingStartDate } : {}),
                ...(participatingEndDate ? { end_date: participatingEndDate } : {}),
                status_group: participatingStatusFilter,
            });
            setParticipatingMeetings(extractList(response));
            setParticipatingTotalPages(getTotalPages(response));
        } catch (error) {
            console.error('내가 참가한 모임 조회 실패:', error);
            setParticipatingMeetings([]);
            setParticipatingTotalPages(1);
        }
    };
}

export function createTabChangeHandler({
    setActiveTab,
    setRoundingPage,
    setSocialPage,
    setParticipatingPage,
    router,
}) {
    return (tab) => {
        const nextTab = tab === 'social' || tab === 'participating' ? tab : 'rounding';
        setActiveTab(nextTab);
        router.setParams({ tab: nextTab });

        if (nextTab === 'rounding') {
            setRoundingPage(1);
        } else if (nextTab === 'social') {
            setSocialPage(1);
        } else {
            setParticipatingPage(1);
        }
    };
}

export function createSearchHandler({
    activeTab,
    roundingSearchInput,
    socialSearchInput,
    participatingSearchInput,
    setRoundingSearchQuery,
    setSocialSearchQuery,
    setParticipatingSearchQuery,
    setRoundingPage,
    setSocialPage,
    setParticipatingPage,
}) {
    return () => {
        if (activeTab === 'rounding') {
            setRoundingSearchQuery(roundingSearchInput);
            setRoundingPage(1);
        } else if (activeTab === 'social') {
            setSocialSearchQuery(socialSearchInput);
            setSocialPage(1);
        } else {
            setParticipatingSearchQuery(participatingSearchInput);
            setParticipatingPage(1);
        }
    };
}

export function createCreateMeetingHandler({ router }) {
    return (type) =>
        async () => {
            const isCompleted = await ensureMeetingProfileCompleted(router);
            if (!isCompleted) return;
            if (type === 'rounding') {
                router.push('/meetings/rounding/create');
            } else {
                router.push('/meetings/social/create');
            }
        };
}

export function createMeetingPressHandler({ router }) {
    return (meeting) =>
        () => {
            const meetingType = getMeetingTypeValue(meeting) || meeting?.meeting_type || meeting?.type;
            const slug = meetingType === 'SOCIAL' ? 'social' : 'rounding';
            const meetingId = meeting?.id || meeting?.meeting_id;
            if (!meetingId) return;
            router.push(`/meetings/${slug}/${meetingId}`);
        };
}

export function createDateChangeHandler({
    activeTab,
    setRoundingDate,
    setSocialDate,
    setParticipatingDate,
    setRoundingPage,
    setSocialPage,
    setParticipatingPage,
}) {
    return (value) => {
        if (activeTab === 'rounding') {
            setRoundingDate(value);
            setRoundingPage(1);
        } else if (activeTab === 'social') {
            setSocialDate(value);
            setSocialPage(1);
        } else {
            setParticipatingDate(value);
            setParticipatingPage(1);
        }
    };
}

export function createResetDatesHandler({
    activeTab,
    setRoundingStartDate,
    setRoundingEndDate,
    setSocialStartDate,
    setSocialEndDate,
    setParticipatingStartDate,
    setParticipatingEndDate,
    setRoundingPage,
    setSocialPage,
    setParticipatingPage,
}) {
    return () => {
        if (activeTab === 'rounding') {
            setRoundingStartDate('');
            setRoundingEndDate('');
            setRoundingPage(1);
        } else if (activeTab === 'social') {
            setSocialStartDate('');
            setSocialEndDate('');
            setSocialPage(1);
        } else {
            setParticipatingStartDate('');
            setParticipatingEndDate('');
            setParticipatingPage(1);
        }
    };
}

export function createSearchInputChangeHandler({
    activeTab,
    setRoundingSearchInput,
    setSocialSearchInput,
    setParticipatingSearchInput,
}) {
    return (value) => {
        if (activeTab === 'rounding') {
            setRoundingSearchInput(value);
        } else if (activeTab === 'social') {
            setSocialSearchInput(value);
        } else {
            setParticipatingSearchInput(value);
        }
    };
}

export function createStatusFilterHandler({
    activeTab,
    setRoundingStatusFilter,
    setSocialStatusFilter,
    setParticipatingStatusFilter,
    setRoundingPage,
    setSocialPage,
    setParticipatingPage,
}) {
    return (nextStatus) =>
        () => {
            if (activeTab === 'rounding') {
                setRoundingStatusFilter(nextStatus);
                setRoundingPage(1);
            } else if (activeTab === 'social') {
                setSocialStatusFilter(nextStatus);
                setSocialPage(1);
            } else {
                setParticipatingStatusFilter(nextStatus);
                setParticipatingPage(1);
            }
        };
}

export function createPrevPageHandler({
    activeTab,
    roundingPage,
    socialPage,
    participatingPage,
    setRoundingPage,
    setSocialPage,
    setParticipatingPage,
}) {
    return () => {
        if (activeTab === 'rounding') {
            setRoundingPage(Math.max(1, roundingPage - 1));
        } else if (activeTab === 'social') {
            setSocialPage(Math.max(1, socialPage - 1));
        } else {
            setParticipatingPage(Math.max(1, participatingPage - 1));
        }
    };
}

export function createNextPageHandler({
    activeTab,
    roundingPage,
    socialPage,
    participatingPage,
    roundingTotalPages,
    socialTotalPages,
    participatingTotalPages,
    setRoundingPage,
    setSocialPage,
    setParticipatingPage,
}) {
    return () => {
        if (activeTab === 'rounding') {
            setRoundingPage(Math.min(roundingTotalPages, roundingPage + 1));
        } else if (activeTab === 'social') {
            setSocialPage(Math.min(socialTotalPages, socialPage + 1));
        } else {
            setParticipatingPage(Math.min(participatingTotalPages, participatingPage + 1));
        }
    };
}

export function createPageNumberHandler({
    activeTab,
    setRoundingPage,
    setSocialPage,
    setParticipatingPage,
}) {
    return (pageNum) =>
        () => {
            if (activeTab === 'rounding') {
                setRoundingPage(pageNum);
            } else if (activeTab === 'social') {
                setSocialPage(pageNum);
            } else {
                setParticipatingPage(pageNum);
            }
        };
}

export function createTabPressHandler({ onTabChange }) {
    return (tabId) =>
        () => {
            onTabChange(tabId);
        };
}
export function createFetchMyMeetingsHandler({ fetchMyMeetings, extractList, setMeetings, setIsLoading, setError }) {
    return async function () {
        try {
            setIsLoading(true);
            setError('');
            const response = await fetchMyMeetings({ page: 1, limit: 20 });
            const list = extractList(response);
            setMeetings(list);
        } catch (error) {
            console.error('내 모임 조회 실패:', error);
            setError(error?.message || '모임을 불러오는데 실패했습니다.');
            setMeetings([]);
        } finally {
            setIsLoading(false);
        }
    };
}

export function createOpenMeetingHandler({ router }) {
    return (meeting) =>
        () => {
            router.push(`/meetings/${meeting.type}/${meeting.id}`);
        };
}
export function createFieldChangeHandler({ setForm }) {
    return (field) =>
        (value) => {
            setForm((prev) => ({ ...prev, [field]: value }));
        };
}

export function createOptionPressHandler({ onChange, field }) {
    return (value) =>
        () => {
            onChange(field)(value);
        };
}

export function createFetchClubsHandler({
    fetchMyClubs,
    extractList,
    isEditMode,
    onlyManageableClubs,
    setClubs,
    setClubsLoading,
    setForm,
    setHasClubs,
    setManageableClubIds,
    setError,
}) {
    return async function () {
        try {
            if (setClubsLoading) {
                setClubsLoading(true);
            }
            const response = await fetchMyClubs();
            const list = extractList(response);
            const activeClubs = list.filter(
                (club) => club.status === 'ACTIVE' || club.status === 'APPROVED'
            );
            const manageableClubs = activeClubs.filter((club) => canManageClubMeetings(club));
            const targetClubs = onlyManageableClubs ? manageableClubs : activeClubs;
            
            // setClubs가 있으면 클럽 목록 설정 (기존 동작)
            if (setClubs) {
                setClubs(targetClubs);
            }
            
            // setHasClubs가 있으면 클럽 존재 여부 설정 (meetings/index.js용)
            if (setHasClubs) {
                setHasClubs(activeClubs.length > 0);
            }

            if (setManageableClubIds) {
                const nextManageableClubIds = manageableClubs
                    .map((club) => club?.id)
                    .filter((clubId) => clubId !== null && clubId !== undefined && clubId !== '');

                setManageableClubIds((prevClubIds = []) => {
                    const hasSameLength = prevClubIds.length === nextManageableClubIds.length;
                    const hasSameMembers =
                        hasSameLength &&
                        prevClubIds.every((clubId) => nextManageableClubIds.includes(clubId)) &&
                        nextManageableClubIds.every((clubId) => prevClubIds.includes(clubId));
                    return hasSameMembers ? prevClubIds : nextManageableClubIds;
                });
            }
            
            if (!isEditMode && targetClubs.length === 1 && setForm) {
                setForm((prev) => ({ ...prev, club_id: targetClubs[0].id }));
            }
        } catch (error) {
            console.error('클럽 목록 조회 실패:', error);
            if (setClubs) {
                setClubs([]);
            }
            if (setHasClubs) {
                setHasClubs(false);
            }
            if (setManageableClubIds) {
                setManageableClubIds((prevClubIds = []) =>
                    prevClubIds.length === 0 ? prevClubIds : []
                );
            }
            if (setError) {
                setError(error);
            }
        } finally {
            if (setClubsLoading) {
                setClubsLoading(false);
            }
        }
    };
}

export function createFetchMeetingDetailHandler({
    meetingIdValue,
    typeSlug,
    fetchSocial,
    fetchRound,
    extractData,
    setMeeting,
    setLoading,
    setError,
}) {
    return async function () {
        if (!meetingIdValue) return;
        try {
            setLoading(true);
            setError(null);
            const fetchApi = typeSlug === 'social' ? fetchSocial : fetchRound;
            const response = await fetchApi(meetingIdValue);
            const data = extractData(response);
            setMeeting(data);
        } catch (error) {
            console.error('모임 상세 조회 실패:', error);
            setError(error?.message || '모임 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };
}

export function createFetchMeetingHandler({
    isEditMode,
    meetingIdValue,
    typeSlug,
    fetchSocial,
    fetchRound,
    extractData,
    setMeeting,
    setForm,
    setLoading,
    setError,
    setParticipantType,
    alert,
    buildFormFromData,
    getParticipantType,
}) {
    return async function () {
        if (!meetingIdValue) return;
        const isDetailMode = typeof setMeeting === 'function';
        if (!isDetailMode && !isEditMode) return;

        try {
            if (typeof setLoading === 'function') {
                setLoading(true);
            }
            if (typeof setError === 'function') {
                setError('');
            }

            const normalizedType = String(typeSlug || '').toLowerCase();
            const fetchMeeting = normalizedType === 'social'
                ? fetchSocial
                : normalizedType === 'rounding'
                    ? fetchRound
                    : (fetchSocial || fetchRound);

            if (typeof fetchMeeting !== 'function') {
                throw new Error('모임 조회 함수가 정의되지 않았습니다.');
            }
            const response = await fetchMeeting(meetingIdValue);
            const data = extractData(response);
            if (!data) {
                if (isDetailMode) {
                    setMeeting(null);
                }
                return;
            }

            if (isDetailMode) {
                setMeeting(data);
                return;
            }

            setForm((prev) => buildFormFromData({ data, fallback: prev }));
            if (
                typeof setParticipantType === 'function' &&
                typeof getParticipantType === 'function'
            ) {
                setParticipantType(getParticipantType(data));
            }
        } catch (error) {
            console.error('모임 조회 실패:', error);
            if (typeof setError === 'function') {
                setError(error?.message || '모임 정보를 불러오는데 실패했습니다.');
            } else if (typeof alert === 'function') {
                alert('오류', '모임 정보를 불러오는데 실패했습니다.');
            }
        } finally {
            if (typeof setLoading === 'function') {
                setLoading(false);
            }
        }
    };
}

export function createParticipantTypeHandler({ setParticipantType, onChange }) {
    return (type) =>
        () => {
            setParticipantType(type);
            if (type === 'ALL') {
                onChange('max_participants')('');
            }
        };
}

export function createSubmitHandler({
    form,
    participantType,
    isEditMode,
    canCreateMeeting,
    meetingIdValue,
    createSocial,
    updateSocial,
    createRound,
    updateRound,
    meetingType,
    extractData,
    router,
    alert,
    setSaving,
    setFieldErrors,
    validateForm,
    buildPayload,
    settlementMethods,
}) {
    return async function () {
        const isCompleted = await ensureMeetingProfileCompleted(router);
        if (!isCompleted) return;

        const submitType = String(
            meetingType ||
            ((typeof createRound === 'function' || typeof updateRound === 'function') ? 'rounding' : 'social')
        ).toLowerCase();
        const meetingTypeSlug = submitType === 'rounding' ? 'rounding' : 'social';
        const createMeeting = createSocial || createRound;
        const updateMeeting = updateSocial || updateRound;

        if (isEditMode && typeof updateMeeting !== 'function') {
            alert('오류', '모임 수정 API가 준비되지 않았습니다.');
            return;
        }
        if (!isEditMode && typeof createMeeting !== 'function') {
            alert('오류', '모임 생성 API가 준비되지 않았습니다.');
            return;
        }
        if (!isEditMode && canCreateMeeting === false) {
            alert('권한 없음', '모임은 클럽 리더/매니저만 개설할 수 있습니다.');
            return;
        }

        const errors = validateForm({ form, participantType });
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            alert('확인 필요', '입력 항목을 확인해주세요.');
            return;
        }

        const payload = buildPayload({ form, participantType, settlementMethods });

        try {
            setSaving(true);
            const response = isEditMode
                ? await updateMeeting(meetingIdValue, payload)
                : await createMeeting(payload);
            const data = extractData(response);
            const createdId = data?.id || data?.meeting_id || meetingIdValue;
            alert(
                '완료',
                isEditMode
                    ? '모임 정보가 수정되었습니다.'
                    : meetingTypeSlug === 'rounding'
                        ? '라운딩 모임이 생성되었습니다.'
                        : '소셜 모임이 생성되었습니다.'
            );
            if (createdId) {
                router.replace(`/meetings/${meetingTypeSlug}/${createdId}`);
            } else {
                router.replace('/meetings');
            }
        } catch (error) {
            console.error(`${meetingTypeSlug === 'rounding' ? '라운딩' : '소셜'} 저장 실패:`, error);
            alert('오류', error?.message || '모임 저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };
}
export function createFetchMeetingStatsHandler({
    meetingId,
    fetchRound,
    fetchRoundParticipants,
    getParticipantsFromResponse,
    setMeeting,
    setParticipants,
    setIsLoading,
    setError,
}) {
    return async function () {
        if (!meetingId) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            setError('');
            const [meetingResponse, participantsResponse] = await Promise.all([
                fetchRound(meetingId),
                fetchRoundParticipants(meetingId),
            ]);
            const meetingData = meetingResponse?.data || meetingResponse || null;
            const participantList = getParticipantsFromResponse(participantsResponse);
            setMeeting(meetingData);
            setParticipants(Array.isArray(participantList) ? participantList : []);
        } catch (error) {
            console.error('모임 통계 조회 실패:', error);
            setError(error?.message || '모임 통계를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };
}

// export const meetingRenderUtils = {
//     createFetchUserInfoHandler,
//     createFetchParticipantsHandler,
//     createFetchTeamsHandler,
//     createFetchApplicationStatusHandler,
//     createUpdateUserInfoHandler,
//     createJoinHandler,
//     createLeaveHandler,
//     createAutoFormTeamsHandler,
//     createConfirmTeamsHandler,
//     createStartRoundingHandler,
//     createCompleteRoundingHandler,
//     createConfirmSettlementHandler,
//     createSaveHistoryHandler,
//     createRestoreHistoryHandler,
//     createScoreSuccessHandler,
//     createFetchExpensesHandler,
//     createFetchRoundingMeetingsHandler,
//     createFetchSocialMeetingsHandler,
//     createTabChangeHandler,
//     createSearchHandler,
//     createCreateMeetingHandler,
//     createMeetingPressHandler,
//     createDateChangeHandler,
//     createResetDatesHandler,
//     createSearchInputChangeHandler,
//     createStatusFilterHandler,
//     createPrevPageHandler,
//     createNextPageHandler,
//     createPageNumberHandler,
//     createTabPressHandler,
//     createFetchMyMeetingsHandler,
//     createOpenMeetingHandler,
//     createFieldChangeHandler,
//     createOptionPressHandler,
//     createFetchClubsHandler,
//     createFetchMeetingHandler,
//     createParticipantTypeHandler,
//     createSubmitHandler,
//     createFetchMeetingStatsHandler,
// };
