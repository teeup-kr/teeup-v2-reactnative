import { ensureProfileCompleted } from '@/lib/util/mypageUtils';
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

export function createOpenMembersHandler({ clubId, router, manage = false }) {
    return () => {
        if (!clubId) return;
        if (manage) {
            router.push({ pathname: `/clubs/${clubId}/members`, params: { manage: '1' } });
            return;
        }
        router.push(`/clubs/${clubId}/members`);
    };
}

export function createOpenJoinApplicationsHandler({ router }) {
    return () => {
        router.replace({ pathname: '/clubs', params: { tab: 'join-applications' } });
    };
}

export function createJoinRequestHandler({
    clubId,
    requestJoinClub,
    setIsSubmitting,
    onSuccess,
    alert,
    onOpenJoinApplications,
}) {
    return async () => {
        if (!clubId) return;
        if (!requestJoinClub) return;
        try {
            if (setIsSubmitting) setIsSubmitting(true);
            const response = await requestJoinClub(clubId);
            if (!response) return;
            const message = response?.message || '클럽 가입 신청이 완료되었습니다.';
            alert('가입 신청 완료', message, [
                { text: '닫기', style: 'cancel' },
                {
                    text: '가입 신청 내역 보기',
                    onPress: () => {
                        if (onOpenJoinApplications) onOpenJoinApplications();
                    },
                },
            ]);
            if (onSuccess) {
                await onSuccess();
            }
        } catch (error) {
            console.error('클럽 가입 신청 실패:', error);
            const errorMessage = error?.message || '클럽 가입 신청 중 오류가 발생했습니다.';
            alert('가입 신청 실패', errorMessage);
        } finally {
            if (setIsSubmitting) setIsSubmitting(false);
        }
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

export function createFeeCreateHandler({ router, clubId }) {
    return () => {
        if (!clubId) return;
        router.push(`/clubs/${clubId}/fees/create`);
    };
}

export function createFeePressHandler({ router, clubId }) {
    return (feeId) =>
        () => {
            if (!clubId || !feeId) return;
            router.push(`/clubs/${clubId}/fees/${feeId}/edit`);
        };
}

export function createFetchFeeDetailHandler({
    clubId,
    feeId,
    fetchClubFee,
    extractData,
    setFee,
    setIsLoading,
    setError,
}) {
    return async function () {
        setError('');
        if (!clubId || !feeId) {
            setFee(null);
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const response = await fetchClubFee(clubId, feeId);
            const data = extractData(response);
            setFee(data);
        } catch (error) {
            console.error('회비 상세 조회 실패:', error);
            setError(error?.message || '회비 정보를 불러오는데 실패했습니다.');
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
    sidoCode,
    gunguCodes,
    myClubStatusFilter,
    statusFilter,
    userId,
    fetchMyClubs,
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
                    ...(sidoCode ? { sido_code: sidoCode } : {}),
                    ...(gunguCodes && gunguCodes.length > 0 ? { gungu_codes: gunguCodes } : {}),
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

export function createCardPressHandler({ onClubPress }) {
    return (club) => () => {
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
    return async () => {
        const isCompleted = await ensureProfileCompleted({ router });
        if (!isCompleted) return;
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
            if (route === 'members') {
                router.push({ pathname: `/clubs/${clubId}/members`, params: { manage: '1' } });
                return;
            }
            router.push(`/clubs/${clubId}/${route}`);
        };
}
export function createFetchMembersHandler({
    clubId,
    includePending = false,
    fetchClubMembers,
    extractList,
    setMembers,
    setIsLoading,
    setError,
}) {
    return async function () {
        setError('');
        if (!clubId) {
            setMembers([]);
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const response = await fetchClubMembers(clubId, {
                page: 1,
                limit: 50,
                ...(includePending ? { all_members: true } : {}),
            });
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

export function createToggleRegularFeeHandler({ setFormData, defaultCycleId = '' }) {
    return () => {
        setFormData((prev) => ({
            ...prev,
            hasRegularFee: !prev.hasRegularFee,
            regularFeeAmount: !prev.hasRegularFee ? prev.regularFeeAmount : '',
            regularFeeCycle: !prev.hasRegularFee ? (prev.regularFeeCycle || defaultCycleId) : '',
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

export function createSidoSelectHandler({ setSelectedSidoCode, setSelectedGunguCodes, setErrors }) {
    return (value) => {
        const normalized = value ? String(value) : '';
        setSelectedSidoCode(normalized);
        setSelectedGunguCodes([]);
        if (setErrors) {
            setErrors((prev) => ({ ...prev, gungu_codes: '' }));
        }
    };
}

export function createToggleGunguHandler({
    setSelectedGunguCodes,
    setErrors,
    maxSelections = 4,
}) {
    return (code) => {
        const normalized = String(code);
        setSelectedGunguCodes((prev) => {
            if (prev.includes(normalized)) {
                const next = prev.filter((item) => item !== normalized);
                if (setErrors && next.length >= 1 && next.length <= maxSelections) {
                    setErrors((errorState) => ({ ...errorState, gungu_codes: '' }));
                }
                return next;
            }

            if (prev.length >= maxSelections) {
                if (setErrors) {
                    setErrors((errorState) => ({
                        ...errorState,
                        gungu_codes: `최대 ${maxSelections}개까지 선택할 수 있어요.`,
                    }));
                }
                return prev;
            }

            const next = [...prev, normalized];
            if (setErrors && next.length >= 1 && next.length <= maxSelections) {
                setErrors((errorState) => ({ ...errorState, gungu_codes: '' }));
            }
            return next;
        });
    };
}

export function createRegisterPressHandler({
    selectedGunguCodes,
    setErrors,
    handleRegister,
    minSelections = 1,
    maxSelections = 4,
}) {
    return () => {
        if (selectedGunguCodes.length < minSelections || selectedGunguCodes.length > maxSelections) {
            if (setErrors) {
                setErrors((prev) => ({
                    ...prev,
                    gungu_codes: '시/군/구는 1~4개 선택해주세요.',
                }));
            }
            return;
        }

        handleRegister();
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
    successPath = '/',
    successParams,
}) {
    return async function () {
        setErrors(defaultErrors);

        try {
            setIsSubmitting(true);
            const payload = buildPayload(formData);
            await registerClubApplication(payload);
            if (successParams) {
                router.replace({ pathname: successPath, params: successParams });
            } else {
                router.replace(successPath);
            }
        } catch (error) {
            const message = error?.message || error?.detail || '클럽 생성에 실패했습니다.';

            // 클럽 이름 중복 에러 체크
            if (error?.status === 400 && (message.includes('이미 사용 중인 클럽 이름') || message.includes('클럽 이름'))) {
                setErrors((prev) => ({ ...prev, name: message, general: '' }));
            } else {
                setErrors((prev) => ({ ...prev, general: message }));
            }
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

export function createNoticeCreateHandler({ router, clubId }) {
    return () => {
        router.push(`/clubs/${clubId}/notices/create`);
    };
}

export function createNoticePressHandler({ router, clubId }) {
    return (noticeId) =>
        () => {
            if (!clubId || !noticeId) return;
            router.push(`/clubs/${clubId}/notices/${noticeId}`);
        };
}

export function createNoticeEditHandler({ router, clubId }) {
    return (noticeId) =>
        () => {
            if (!clubId || !noticeId) return;
            router.push(`/clubs/${clubId}/notices/${noticeId}/edit`);
        };
}

export function createFetchNoticeDetailHandler({
    clubId,
    noticeId,
    fetchClubNotice,
    extractData,
    setNotice,
    setIsLoading,
    setError,
}) {
    return async function () {
        setError('');
        if (!clubId || !noticeId) {
            setNotice(null);
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const response = await fetchClubNotice(clubId, noticeId);
            const data = extractData(response);
            setNotice(data);
        } catch (error) {
            console.error('클럽 공지 상세 조회 실패:', error);
            setError(error?.message || '공지사항을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };
}
export function createFetchStatsHandler({
    clubId,
    fetchClubStats,
    extractData,
    setStatsData,
    setIsLoading,
    setError,
    params = {},
}) {
    return async function () {
        setError('');
        if (!clubId) {
            setStatsData(null);
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const response = await fetchClubStats(clubId, params);
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
