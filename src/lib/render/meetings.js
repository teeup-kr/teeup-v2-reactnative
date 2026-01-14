function createFetchUserInfoHandler({
        fetchMyProfile,
        fetchUserHandicap,
        extractData,
        setUser,
        setUserInfo,
        setUserInfoLoading,
        setHandicapInfo,
        setHandicapLoading,
        buildUserInfoFromProfile,
    }) { return async () => {
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
        }; }

function createFetchParticipantsHandler({
        meetingIdValue,
        typeSlug,
        meeting,
        fetchRoundParticipants,
        extractList,
        setParticipants,
        setConfirmedParticipants,
    }) { return async () => {
            if (!meetingIdValue) return;

            try {
                if (typeSlug === 'social') {
                    const list = extractList(meeting?.participants);
                    setParticipants(list);
                    return;
                }

                const response = await fetchRoundParticipants(meetingIdValue);
                const list = extractList(response);
                setParticipants(list);
                setConfirmedParticipants(
                    list.filter((participant) => participant.status === 'CONFIRMED')
                );
            } catch (error) {
                console.error('참가자 조회 실패:', error);
            }
        }; }

function createFetchTeamsHandler({ meetingIdValue, isRoundingMeeting, fetchRoundTeams, extractList, setTeams }) { return async () => {
            if (!meetingIdValue || !isRoundingMeeting) return;

            try {
                const response = await fetchRoundTeams(meetingIdValue);
                setTeams(extractList(response));
            } catch (error) {
                console.error('팀 조회 실패:', error);
            }
        }; }

function createFetchApplicationStatusHandler({ meetingIdValue, isRoundingMeeting, fetchApplicationStatus, extractData, setApplicationStatus }) { return async () => {
            if (!meetingIdValue || !isRoundingMeeting) return;
            try {
                const response = await fetchApplicationStatus(meetingIdValue);
                setApplicationStatus(extractData(response));
            } catch (error) {
                console.error('신청 상태 조회 실패:', error);
            }
        }; }

function createUpdateUserInfoHandler({ userInfo, updateMyProfile, setProcessingAction, setIsEditingUserInfo, fetchUserInfo, alert }) { return async () => {
            try {
                setProcessingAction(true);
                await updateMyProfile({
                    realname: userInfo.realname,
                    average_score: userInfo.average_score ? Number(userInfo.average_score) : null,
                    phone_number: userInfo.phone_number || null,
                    birthdate: userInfo.birthdate || null,
                    gender: userInfo.gender || null,
                });
                setIsEditingUserInfo(false);
                fetchUserInfo();
            } catch (error) {
                alert('오류', error?.message || '회원정보 수정에 실패했습니다.');
            } finally {
                setProcessingAction(false);
            }
        }; }

function createJoinHandler({
        typeSlug,
        meetingIdValue,
        joinSocial,
        joinRound,
        setJoinModalOpen,
        setProcessingAction,
        fetchParticipants,
        fetchMeeting,
        alert,
    }) { return async () => {
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
        }; }

function createLeaveHandler({
        typeSlug,
        meetingIdValue,
        leaveSocial,
        leaveRound,
        setProcessingAction,
        fetchParticipants,
        fetchMeeting,
        alert,
    }) { return () => {
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
        }; }

function createAutoFormTeamsHandler({
        meetingIdValue,
        autoFormTeams,
        extractList,
        setProcessingAction,
        setPreviewTeams,
        setTeamPreviewOpen,
        setTeams,
        alert,
    }) { return async (payload = {}) => {
            if (!meetingIdValue) return null;
            try {
                setProcessingAction(true);
                const response = await autoFormTeams(meetingIdValue, payload);
                const teamsData = extractList(response?.teams || response?.data?.teams || response);
                if (payload.preview || payload.batchMode) {
                    setPreviewTeams(teamsData);
                    setTeamPreviewOpen(true);
                } else {
                    setTeams(teamsData);
                }
                return response;
            } catch (error) {
                alert('오류', error?.message || '팀 편성에 실패했습니다.');
                return null;
            } finally {
                setProcessingAction(false);
            }
        }; }

function createConfirmTeamsHandler({
        meetingIdValue,
        confirmTeamFormation,
        setProcessingAction,
        setTeamPreviewOpen,
        fetchTeams,
        fetchMeeting,
        alert,
    }) { return async () => {
            if (!meetingIdValue) return;
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
        }; }

function createStartRoundingHandler({ meetingIdValue, startRounding, setProcessingAction, fetchMeeting, alert }) { return async () => {
            if (!meetingIdValue) return;
            try {
                setProcessingAction(true);
                await startRounding(meetingIdValue);
                fetchMeeting();
            } catch (error) {
                alert('오류', error?.message || '모임 진행 시작에 실패했습니다.');
            } finally {
                setProcessingAction(false);
            }
        }; }

function createCompleteRoundingHandler({
        meetingIdValue,
        completeRounding,
        setProcessingAction,
        setRoundingCompleteOpen,
        fetchMeeting,
        alert,
    }) { return async () => {
            if (!meetingIdValue) return;
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
        }; }

function createConfirmSettlementHandler({ meetingIdValue, confirmSettlement, setProcessingAction, fetchMeeting, alert }) { return async () => {
            if (!meetingIdValue) return;
            try {
                setProcessingAction(true);
                await confirmSettlement(meetingIdValue);
                fetchMeeting();
            } catch (error) {
                alert('오류', error?.message || '정산 확정에 실패했습니다.');
            } finally {
                setProcessingAction(false);
            }
        }; }

function createSaveHistoryHandler({ previewTeams, setFormationHistory }) { return () => {
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
        }; }

function createRestoreHistoryHandler({ setTeams }) { return (item) => {
            if (item?.teams) {
                setTeams(item.teams);
            }
        }; }

function createScoreSuccessHandler({ setScoreModalOpen, fetchMeeting, fetchParticipants }) { return () => {
            setScoreModalOpen(false);
            fetchMeeting();
            fetchParticipants();
        }; }

function createFetchExpensesHandler({ meetingId, fetchRoundExpenses, extractList, setExpenses, setIsLoading, setError }) { return async () => {
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
        }; }
function createFetchRoundingMeetingsHandler({
        fetchRounds,
        extractList,
        filterByDate,
        filterByStatus,
        getDateRange,
        roundingPage,
        roundingSearchQuery,
        roundingStartDate,
        roundingEndDate,
        roundingStatusFilter,
        setRoundingMeetings,
        setRoundingTotalPages,
    }) { return async (page = roundingPage, search = roundingSearchQuery) => {
            try {
                const allPagesMeetings = [];
                let currentPage = 1;
                let hasMore = true;

                while (hasMore && currentPage <= 10) {
                    const requestParams = {
                        page: currentPage,
                        limit: 100,
                        ...(search ? { search } : {}),
                    };

                    const pageResponse = await fetchRounds(requestParams);
                    const pageMeetings = extractList(pageResponse);

                    if (pageMeetings.length === 0) {
                        hasMore = false;
                    } else {
                        allPagesMeetings.push(...pageMeetings);
                        const totalPages = pageResponse?.total_pages || 1;
                        if (currentPage >= totalPages) {
                            hasMore = false;
                        } else {
                            currentPage += 1;
                        }
                    }
                }

                const dateRange = getDateRange(roundingStartDate, roundingEndDate);
                let filteredMeetings = filterByDate(allPagesMeetings, dateRange);
                filteredMeetings = filterByStatus(filteredMeetings, roundingStatusFilter);

                const itemsPerPage = 6;
                const calculatedTotalPages = Math.max(
                    1,
                    Math.ceil(filteredMeetings.length / itemsPerPage)
                );
                const startIndex = (page - 1) * itemsPerPage;
                const paginatedMeetings = filteredMeetings.slice(
                    startIndex,
                    startIndex + itemsPerPage
                );

                setRoundingMeetings(paginatedMeetings);
                setRoundingTotalPages(calculatedTotalPages);
            } catch (error) {
                console.error('라운딩 조회 실패:', error);
                setRoundingMeetings([]);
                setRoundingTotalPages(1);
            }
        }; }

function createFetchSocialMeetingsHandler({
        fetchSocials,
        extractList,
        filterByDate,
        filterByStatus,
        getDateRange,
        socialPage,
        socialSearchQuery,
        socialStartDate,
        socialEndDate,
        socialStatusFilter,
        setSocialMeetings,
        setSocialTotalPages,
    }) { return async (page = socialPage, search = socialSearchQuery) => {
            try {
                const requestParams = { page, limit: 6, ...(search ? { search } : {}) };
                const response = await fetchSocials(requestParams);
                const socialData = extractList(response);

                const socials = socialData.map((social) => ({
                    ...social,
                    meeting_type: 'SOCIAL',
                    meeting_time: social.meeting_time,
                    participant_count: social.participant_count || 0,
                }));

                const dateRange = getDateRange(socialStartDate, socialEndDate);
                let filteredSocials = filterByDate(socials, dateRange);
                filteredSocials = filterByStatus(filteredSocials, socialStatusFilter);

                const itemsPerPage = 6;
                const calculatedTotalPages = Math.max(
                    1,
                    Math.ceil(filteredSocials.length / itemsPerPage)
                );
                const startIndex = (page - 1) * itemsPerPage;
                const paginatedSocials = filteredSocials.slice(
                    startIndex,
                    startIndex + itemsPerPage
                );

                setSocialMeetings(paginatedSocials);
                setSocialTotalPages(calculatedTotalPages);
            } catch (error) {
                console.error('소셜 모임 조회 실패:', error);
                setSocialMeetings([]);
                setSocialTotalPages(1);
            }
        }; }

function createTabChangeHandler({ setActiveTab, setRoundingPage, setSocialPage, router }) { return (tab) => {
            const nextTab = tab === 'social' ? 'social' : 'rounding';
            setActiveTab(nextTab);
            router.setParams({ tab: nextTab });

            if (nextTab === 'rounding') {
                setRoundingPage(1);
            } else {
                setSocialPage(1);
            }
        }; }

function createSearchHandler({
        activeTab,
        roundingSearchInput,
        socialSearchInput,
        setRoundingSearchQuery,
        setSocialSearchQuery,
        setRoundingPage,
        setSocialPage,
    }) { return () => {
            if (activeTab === 'rounding') {
                setRoundingSearchQuery(roundingSearchInput);
                setRoundingPage(1);
            } else {
                setSocialSearchQuery(socialSearchInput);
                setSocialPage(1);
            }
        }; }

function createCreateMeetingHandler({ router }) { return (type) =>
            () => {
                if (type === 'rounding') {
                    router.push('/meetings/rounding/create');
                } else {
                    router.push('/meetings/social/create');
                }
            }; }

function createMeetingPressHandler({ router }) { return (meeting) =>
            () => {
                const meetingType = meeting?.meeting_type || meeting?.type;
                const slug = meetingType === 'SOCIAL' ? 'social' : 'rounding';
                const meetingId = meeting?.id || meeting?.meeting_id;
                if (!meetingId) return;
                router.push(`/meetings/${slug}/${meetingId}`);
            }; }

function createDateChangeHandler({ activeTab, setRoundingDate, setSocialDate, setRoundingPage, setSocialPage }) { return (value) => {
            if (activeTab === 'rounding') {
                setRoundingDate(value);
                setRoundingPage(1);
            } else {
                setSocialDate(value);
                setSocialPage(1);
            }
        }; }

function createResetDatesHandler({ activeTab, setRoundingStartDate, setRoundingEndDate, setSocialStartDate, setSocialEndDate, setRoundingPage, setSocialPage }) { return () => {
            if (activeTab === 'rounding') {
                setRoundingStartDate('');
                setRoundingEndDate('');
                setRoundingPage(1);
            } else {
                setSocialStartDate('');
                setSocialEndDate('');
                setSocialPage(1);
            }
        }; }

function createSearchInputChangeHandler({ activeTab, setRoundingSearchInput, setSocialSearchInput }) { return (value) => {
            if (activeTab === 'rounding') {
                setRoundingSearchInput(value);
            } else {
                setSocialSearchInput(value);
            }
        }; }

function createStatusFilterHandler({ activeTab, setRoundingStatusFilter, setSocialStatusFilter, setRoundingPage, setSocialPage }) { return (nextStatus) =>
            () => {
                if (activeTab === 'rounding') {
                    setRoundingStatusFilter(nextStatus);
                    setRoundingPage(1);
                } else {
                    setSocialStatusFilter(nextStatus);
                    setSocialPage(1);
                }
            }; }

function createPrevPageHandler({ activeTab, roundingPage, socialPage, setRoundingPage, setSocialPage }) { return () => {
            if (activeTab === 'rounding') {
                setRoundingPage(Math.max(1, roundingPage - 1));
            } else {
                setSocialPage(Math.max(1, socialPage - 1));
            }
        }; }

function createNextPageHandler({
        activeTab,
        roundingPage,
        socialPage,
        roundingTotalPages,
        socialTotalPages,
        setRoundingPage,
        setSocialPage,
    }) { return () => {
            if (activeTab === 'rounding') {
                setRoundingPage(Math.min(roundingTotalPages, roundingPage + 1));
            } else {
                setSocialPage(Math.min(socialTotalPages, socialPage + 1));
            }
        }; }

function createPageNumberHandler({ activeTab, setRoundingPage, setSocialPage }) { return (pageNum) =>
            () => {
                if (activeTab === 'rounding') {
                    setRoundingPage(pageNum);
                } else {
                    setSocialPage(pageNum);
                }
            }; }

function createTabPressHandler({ onTabChange }) { return (tabId) =>
            () => {
                onTabChange(tabId);
            }; }
function createFetchMyMeetingsHandler({ fetchMyMeetings, extractList, setMeetings, setIsLoading, setError }) { return async () => {
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
        }; }

function createOpenMeetingHandler({ router }) { return (meeting) =>
            () => {
                router.push(`/meetings/${meeting.type}/${meeting.id}`);
            }; }
function createFieldChangeHandler({ setForm }) { return (field) =>
            (value) => {
                setForm((prev) => ({ ...prev, [field]: value }));
            }; }

function createOptionPressHandler({ onChange, field }) { return (value) =>
            () => {
                onChange(field)(value);
            }; }

function createFetchClubsHandler({ fetchMyClubs, extractList, isEditMode, setClubs, setClubsLoading, setForm }) { return async () => {
            try {
                setClubsLoading(true);
                const response = await fetchMyClubs();
                const list = extractList(response);
                const activeClubs = list.filter(
                    (club) => club.status === 'ACTIVE' || club.status === 'APPROVED'
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
        }; }

function createFetchMeetingHandler({
        isEditMode,
        meetingIdValue,
        fetchSocial,
        extractData,
        setForm,
        setLoading,
        setParticipantType,
        alert,
        buildFormFromData,
        getParticipantType,
    }) { return async () => {
            if (!isEditMode || !meetingIdValue) return;
            try {
                setLoading(true);
                const response = await fetchSocial(meetingIdValue);
                const data = extractData(response);
                if (!data) return;
                setForm((prev) => buildFormFromData({ data, fallback: prev }));
                setParticipantType(getParticipantType(data));
            } catch (error) {
                console.error('모임 조회 실패:', error);
                alert('오류', '모임 정보를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        }; }

function createParticipantTypeHandler({ setParticipantType, onChange }) { return (type) =>
            () => {
                setParticipantType(type);
                if (type === 'ALL') {
                    onChange('max_participants')('');
                }
            }; }

function createSubmitHandler({
        form,
        participantType,
        isEditMode,
        meetingIdValue,
        createSocial,
        updateSocial,
        extractData,
        router,
        alert,
        setSaving,
        setFieldErrors,
        validateForm,
        buildPayload,
        settlementMethods,
    }) { return async () => {
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
                    ? await updateSocial(meetingIdValue, payload)
                    : await createSocial(payload);
                const data = extractData(response);
                const createdId = data?.id || data?.meeting_id || meetingIdValue;
                alert('완료', isEditMode ? '모임 정보가 수정되었습니다.' : '소셜 모임이 생성되었습니다.');
                if (createdId) {
                    router.replace(`/meetings/social/${createdId}`);
                } else {
                    router.replace('/meetings');
                }
            } catch (error) {
                console.error('소셜 저장 실패:', error);
                alert('오류', error?.message || '모임 저장에 실패했습니다.');
            } finally {
                setSaving(false);
            }
        }; }
function createFetchMeetingStatsHandler({
        meetingId,
        fetchRound,
        fetchRoundParticipants,
        getParticipantsFromResponse,
        setMeeting,
        setParticipants,
        setIsLoading,
        setError,
    }) { return async () => {
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
        }; }

export const meetingRenderUtils = {
    createFetchUserInfoHandler,
    createFetchParticipantsHandler,
    createFetchTeamsHandler,
    createFetchApplicationStatusHandler,
    createUpdateUserInfoHandler,
    createJoinHandler,
    createLeaveHandler,
    createAutoFormTeamsHandler,
    createConfirmTeamsHandler,
    createStartRoundingHandler,
    createCompleteRoundingHandler,
    createConfirmSettlementHandler,
    createSaveHistoryHandler,
    createRestoreHistoryHandler,
    createScoreSuccessHandler,
    createFetchExpensesHandler,
    createFetchRoundingMeetingsHandler,
    createFetchSocialMeetingsHandler,
    createTabChangeHandler,
    createSearchHandler,
    createCreateMeetingHandler,
    createMeetingPressHandler,
    createDateChangeHandler,
    createResetDatesHandler,
    createSearchInputChangeHandler,
    createStatusFilterHandler,
    createPrevPageHandler,
    createNextPageHandler,
    createPageNumberHandler,
    createTabPressHandler,
    createFetchMyMeetingsHandler,
    createOpenMeetingHandler,
    createFieldChangeHandler,
    createOptionPressHandler,
    createFetchClubsHandler,
    createFetchMeetingHandler,
    createParticipantTypeHandler,
    createSubmitHandler,
    createFetchMeetingStatsHandler,
};