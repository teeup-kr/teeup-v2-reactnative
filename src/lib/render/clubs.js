export function createFetchActivitiesHandler({ clubId, fetchClubActivities, extractList, setActivities, setIsLoading, setError }) {
    return async function () {
        setError('');
        if (!clubId) {
            setActivities([]);
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const response = await fetchClubActivities(clubId, { page: 1, limit: 50 });
            const list = extractList(response);
            setActivities(list);
        } catch (error) {
            console.error('클럽 활동 내역 조회 실패:', error);
            setError(error?.message || '활동 내역을 불러오는데 실패했습니다.');
            setActivities([]);
        } finally {
            setIsLoading(false);
        }
    };
}
export function createFetchClubApplicationHandler({ applicationId, fetchClubApplication, extractData, setApplication, setIsLoading, setError }) {
    return async function () {
        if (!applicationId) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            setError('');
            const response = await fetchClubApplication(applicationId);
            const data = extractData(response);
            setApplication(data);
        } catch (error) {
            console.error('클럽 신청 조회 실패:', error);
            setError(error?.message || '신청 정보를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };
}
export function createFetchClubDetailHandler({ clubId, fetchClubDetail, extractData, setClub, setIsLoading, setError }) {
    return async function () {
        setError('');
        if (!clubId) {
            setClub(null);
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const response = await fetchClubDetail(clubId);
            const data = extractData(response);
            setClub(data);
        } catch (error) {
            console.error('클럽 상세 조회 실패:', error);
            setError(error?.message || '클럽 정보를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };
}

export function createOpenManageHandler({ clubId, router }) {
    return () => {
        if (!clubId) return;
        router.push(`/clubs/${clubId}/manage`);
    };
}

export function createJoinRequestHandler({ clubId, router }) {
    return () => {
        if (!clubId) return;
        router.push(`/clubs/${clubId}/members`);
    };
}
export function createFetchFeesHandler({ clubId, fetchClubFees, extractList, setFees, setIsLoading, setError }) {
    return async function () {
        if (!clubId) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            setError('');
            const response = await fetchClubFees(clubId, { page: 1, limit: 50 });
            const list = extractList(response);
            setFees(list);
        } catch (error) {
            console.error('회비 목록 조회 실패:', error);
            setError(error?.message || '회비 정보를 불러오는데 실패했습니다.');
            setFees([]);
        } finally {
            setIsLoading(false);
        }
    };
}
export function createDebouncedSearchHandler({ searchTerm, setDebouncedSearchTerm, setCurrentPage }) {
    return () => {
        setDebouncedSearchTerm(searchTerm);
        setCurrentPage(1);
    };
}

export function createFetchClubsHandler({
    activeTab,
    currentPage,
    debouncedSearchTerm,
    myClubStatusFilter,
    statusFilter,
    userId,
    fetchMyClubs,
    fetchMyClubApplications,
    fetchClubs,
    normalizePaginatedResponse,
    setClubs,
    setTotalPages,
    setError,
    setIsLoading,
}) {
    return async function () {
        try {
            setIsLoading(true);
            setError('');
            let response;

            if (activeTab === 'my') {
                response = await fetchMyClubs({ page: currentPage, limit: 6 });
            } else if (activeTab === 'applications') {
                response = await fetchMyClubApplications({ page: currentPage, limit: 6 });
            } else if (activeTab === 'join-applications') {
                response = await fetchMyClubs({
                    page: currentPage,
                    limit: 6,
                    status_filter: 'PENDING',
                });
            } else {
                response = await fetchClubs({
                    page: currentPage,
                    limit: 6,
                    ...(debouncedSearchTerm ? { search: debouncedSearchTerm } : {}),
                });
            }

            const payload = normalizePaginatedResponse(response);
            let list = Array.isArray(payload?.data) ? payload.data : [];

            if (activeTab === 'my') {
                list = list.filter((club) => {
                    const membershipStatus = club?.membership_status;
                    const hasValidMembership =
                        membershipStatus &&
                        membershipStatus !== 'null' &&
                        membershipStatus !== '' &&
                        ['APPROVED', 'ACTIVE', 'PENDING'].includes(
                            String(membershipStatus).toUpperCase().trim()
                        );
                    return hasValidMembership;
                });

                if (myClubStatusFilter && myClubStatusFilter !== 'ALL') {
                    if (myClubStatusFilter === 'ACTIVE') {
                        list = list.filter(
                            (club) => club.status === 'ACTIVE' || club.status === 'APPROVED'
                        );
                    } else {
                        list = list.filter((club) => club.status === myClubStatusFilter);
                    }
                }

                list = [...list].sort((a, b) => {
                    const dateA = new Date(a.created_at || a.joined_at || 0);
                    const dateB = new Date(b.created_at || b.joined_at || 0);
                    return dateB - dateA;
                });
            }

            if (activeTab === 'join-applications') {
                list = list.filter((club) => club?.created_by !== userId);
            }

            if (activeTab === 'all') {
                list = list.filter((club) => club?.status !== 'INACTIVE');
                if (statusFilter && statusFilter !== 'ALL') {
                    list = list.filter((club) => club?.status === statusFilter);
                }
            }

            setClubs(list);
            setTotalPages(payload?.total_pages || 1);
        } catch (error) {
            console.error('클럽 목록 조회 실패:', error);
            setError(error?.message || '클럽 목록을 불러올 수 없습니다');
            setClubs([]);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    };
}

export function createTabChangeHandler({ router, setActiveTab, setIsStatusFilterOpen, setCurrentPage }) {
    return (tabId) =>
        () => {
            setActiveTab(tabId);
            setIsStatusFilterOpen(false);
            setCurrentPage(1);
            router.setParams({ tab: tabId });
        };
}

export function createClubPressHandler({ router, alert }) {
    return (club) => {
        if (club?.status === 'INACTIVE') {
            alert('비공개 클럽', '해당 클럽은 비공개 상태입니다.');
            return;
        }
        router.push(`/clubs/${club?.display_id || club?.id}`);
    };
}

export function createCardPressHandler({ activeTab, router, onClubPress }) {
    return (club) =>
        () => {
            if (activeTab === 'applications') {
                router.push(`/clubs/applications/${club.id}`);
                return;
            }
            onClubPress(club);
        };
}

export function createSearchTermChangeHandler({ setSearchTerm }) {
    return (value) => {
        setSearchTerm(value);
    };
}

export function createToggleStatusFilterHandler({ setIsStatusFilterOpen }) {
    return () => {
        setIsStatusFilterOpen((prev) => !prev);
    };
}

export function createStatusFilterSelectHandler({ setStatusFilter, setIsStatusFilterOpen, setCurrentPage }) {
    return (value) =>
        () => {
            setStatusFilter(value);
            setIsStatusFilterOpen(false);
            setCurrentPage(1);
        };
}

export function createMyStatusFilterHandler({ setMyClubStatusFilter, setCurrentPage }) {
    return (value) =>
        () => {
            setMyClubStatusFilter(value);
            setCurrentPage(1);
        };
}

export function createCreateClubHandler({ router }) {
    return () => {
        router.push('/clubs/register');
    };
}

export function createBrowseClubsHandler({ onTabChange }) {
    return () => {
        onTabChange('all')();
    };
}

export function createPageChangeHandler({ setCurrentPage }) {
    return (pageNum) =>
        () => {
            setCurrentPage(pageNum);
        };
}

export function createPrevPageHandler({ setCurrentPage }) {
    return () => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
    };
}

export function createNextPageHandler({ setCurrentPage, totalPages }) {
    return () => {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    };
}
export function createManageSectionHandler({ clubId, router }) {
    return (route) =>
        () => {
            if (!clubId) return;
            router.push(`/clubs/${clubId}/${route}`);
        };
}
export function createFetchMembersHandler({ clubId, fetchClubMembers, extractList, setMembers, setIsLoading, setError }) {
    return async function () {
        setError('');
        if (!clubId) {
            setMembers([]);
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const response = await fetchClubMembers(clubId, { page: 1, limit: 50 });
            const list = extractList(response);
            setMembers(list);
        } catch (error) {
            console.error('클럽 멤버 조회 실패:', error);
            setError(error?.message || '멤버 정보를 불러오는데 실패했습니다.');
            setMembers([]);
        } finally {
            setIsLoading(false);
        }
    };
}
export function createFetchNoticesHandler({ clubId, fetchClubNotices, extractList, setNotices, setIsLoading, setError }) {
    return async function () {
        if (!clubId) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            setError('');
            const response = await fetchClubNotices(clubId, { page: 1, limit: 20 });
            const list = extractList(response);
            setNotices(list);
        } catch (error) {
            console.error('클럽 공지 조회 실패:', error);
            setError(error?.message || '공지사항을 불러오는데 실패했습니다.');
            setNotices([]);
        } finally {
            setIsLoading(false);
        }
    };
}
export function createFieldChangeHandler({ setFormData }) {
    return (field) =>
        (value) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
        };
}

export function createToggleRegularFeeHandler({ setFormData }) {
    return () => {
        setFormData((prev) => ({
            ...prev,
            hasRegularFee: !prev.hasRegularFee,
            regularFeeAmount: !prev.hasRegularFee ? prev.regularFeeAmount : '',
            regularFeeCycle: !prev.hasRegularFee ? prev.regularFeeCycle : '',
            regularFeeDescription: !prev.hasRegularFee ? prev.regularFeeDescription : '',
        }));
    };
}

export function createSelectRegularFeeCycleHandler({ setFormData }) {
    return (cycleId) =>
        () => {
            setFormData((prev) => ({
                ...prev,
                regularFeeCycle: cycleId,
            }));
        };
}

export function createSubmitClubRegisterHandler({
    formData,
    buildPayload,
    registerClubApplication,
    setErrors,
    setIsSubmitting,
    defaultErrors,
    router,
}) {
    return async function () {
        setErrors(defaultErrors);

        try {
            setIsSubmitting(true);
            const payload = buildPayload(formData);
            await registerClubApplication(payload);
            router.replace('/');
        } catch (error) {
            const message = error?.message || '클럽 생성에 실패했습니다.';
            setErrors((prev) => ({ ...prev, general: message }));
        } finally {
            setIsSubmitting(false);
        }
    };
}
export function createFetchRegulationsHandler({
    clubId,
    fetchClubRegulations,
    extractList,
    setRegulations,
    setIsLoading,
    setError,
}) {
    return async function () {
        if (!clubId) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            setError('');
            const response = await fetchClubRegulations(clubId, { page: 1, limit: 50 });
            const list = extractList(response);
            setRegulations(list);
        } catch (error) {
            console.error('클럽 규정 조회 실패:', error);
            setError(error?.message || '규정을 불러오는데 실패했습니다.');
            setRegulations([]);
        } finally {
            setIsLoading(false);
        }
    };
}

export function createFetchRegulationDetailHandler({
    clubId,
    regulationId,
    fetchClubRegulation,
    extractData,
    setRegulation,
    setIsLoading,
    setError,
}) {
    return async function () {
        if (!clubId || !regulationId) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            setError('');
            const response = await fetchClubRegulation(clubId, regulationId);
            const data = extractData(response);
            setRegulation(data);
        } catch (error) {
            console.error('클럽 규정 상세 조회 실패:', error);
            setError(error?.message || '규정을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };
}

export function createRegulationPressHandler({ router, clubId }) {
    return (regulationId) => {
        router.push(`/clubs/${clubId}/regulations/${regulationId}`);
    };
}

export function createRegulationEditHandler({ router, clubId }) {
    return () => {
        router.push(`/clubs/${clubId}/regulations/create`);
    };
}
export function createFetchStatsHandler({ clubId, fetchClubStats, extractData, setStatsData, setIsLoading, setError }) {
    return async function () {
        setError('');
        if (!clubId) {
            setStatsData(null);
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const response = await fetchClubStats(clubId);
            const data = extractData(response);
            setStatsData(data);
        } catch (error) {
            console.error('클럽 통계 조회 실패:', error);
            setError(error?.message || '통계를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };
}

// export const clubRenderUtils = {
//     createBrowseClubsHandler, createCardPressHandler, createClubPressHandler, createCreateClubHandler, createDebouncedSearchHandler, createFetchActivitiesHandler,
//     createFetchClubApplicationHandler,
//     createFetchClubDetailHandler, createFetchClubsHandler, createFetchFeesHandler, createFetchMembersHandler,
//     createFetchNoticesHandler, createFetchRegulationDetailHandler, createFetchRegulationsHandler, createFetchStatsHandler, createFieldChangeHandler, createJoinRequestHandler, createManageSectionHandler, createMyStatusFilterHandler, createNextPageHandler, createOpenManageHandler, createPageChangeHandler,
//     createPrevPageHandler, createRegulationEditHandler, createRegulationPressHandler, createSearchTermChangeHandler, createSelectRegularFeeCycleHandler, createStatusFilterSelectHandler, createSubmitClubRegisterHandler, createTabChangeHandler, createToggleRegularFeeHandler, createToggleStatusFilterHandler
// };
