import { getChangePasswordScreenError, validateChangePasswordForm } from '@/lib/value/mypage';
import { Platform } from 'react-native';

function createPasswordFieldChangeHandler({
    setForm,
    setError,
    setSuccess,
    field,
}) { return (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
}; }

function createSubmitChangePasswordHandler({
    form,
    isSubmitting,
    setError,
    setSuccess,
    setIsSubmitting,
    changePassword,
}) { return async () => {
    if (isSubmitting) return;

    setError('');
    setSuccess('');

    const errorMessage = getChangePasswordScreenError(form);
    if (errorMessage) {
        setError(errorMessage);
        return;
    }

    try {
        setIsSubmitting(true);
        const payload = {
            current_password: form.currentPassword,
            new_password: form.newPassword,
            confirm_password: form.confirmPassword,
        };
        await changePassword(payload);
        setSuccess('비밀번호가 변경되었습니다.');
    } catch (error) {
        setError(error?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
        setIsSubmitting(false);
    }
}; }

function createResetPasswordModalHandler({
    setFormData,
    setValidationErrors,
    setError,
    setSuccess,
}) { return () => {
    setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    setValidationErrors({});
    setError(null);
    setSuccess(false);
}; }

function createValidatePasswordModalHandler({
    formData,
    setValidationErrors,
}) { return () => {
    const errors = validateChangePasswordForm(formData);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
}; }

function createSubmitPasswordModalHandler({
    formData,
    validateForm,
    changePassword,
    setLoading,
    setError,
    setSuccess,
    onClose,
    onLogout,
}) { return async () => {
    if (!validateForm()) return;

    try {
        setLoading(true);
        setError(null);

        await changePassword({
            current_password: formData.currentPassword,
            new_password: formData.newPassword,
            confirm_password: formData.confirmPassword,
        });

        setSuccess(true);

        setTimeout(() => {
            onClose();
            onLogout?.();
        }, 3000);
    } catch (error) {
        setError(error?.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
        setLoading(false);
    }
}; }

import { buildProfilePayload, formatDateYYYYMMDD, validateProfileForm } from '@/lib/value/mypage';

function createInputChangeHandler({
    setFormData,
    setErrors,
    setNicknameChecked,
    setNicknameMessage,
    calcHandicapFromAvg,
}) { return (field, value) => {
    setFormData((prev) => {
        const next = { ...prev, [field]: value };
        if (field === 'average_score') {
            next.calculatedHandicap = calcHandicapFromAvg(value);
        }
        return next;
    });
    setErrors((prev) => ({ ...prev, [field]: '' }));
    if (field === 'nickname') {
        setNicknameChecked(false);
        setNicknameMessage('');
    }
}; }

function createCheckNicknameDuplicateHandler({
    nickname,
    isNicknameSame,
    setErrors,
    setIsCheckingNickname,
    setNicknameChecked,
    setNicknameMessage,
    checkNicknameAvailability,
}) { return async () => {
    if (!nickname) {
        setErrors((prev) => ({ ...prev, nickname: '닉네임을 입력해주세요.' }));
        return;
    }

    if (nickname.length < 2 || nickname.length > 20) {
        setErrors((prev) => ({ ...prev, nickname: '닉네임은 2-20자여야 합니다.' }));
        setNicknameChecked(false);
        setNicknameMessage('');
        return;
    }

    if (!/^[a-zA-Z가-힣0-9]+$/.test(nickname)) {
        setErrors((prev) => ({ ...prev, nickname: '닉네임은 영문, 한글, 숫자만 사용 가능합니다.' }));
        setNicknameChecked(false);
        setNicknameMessage('');
        return;
    }

    if (isNicknameSame) {
        setNicknameChecked(true);
        setNicknameMessage('사용 가능한 닉네임입니다.');
        return;
    }

    try {
        setIsCheckingNickname(true);
        setErrors((prev) => ({ ...prev, nickname: '' }));
        const result = await checkNicknameAvailability(nickname.trim());
        if (result?.is_available && result?.is_valid) {
            setNicknameChecked(true);
            setNicknameMessage('사용 가능한 닉네임입니다.');
        } else {
            setNicknameChecked(false);
            setNicknameMessage('');
            setErrors((prev) => ({
                ...prev,
                nickname: result?.message || '이미 사용 중인 닉네임입니다.',
            }));
        }
    } catch (checkError) {
        setNicknameChecked(false);
        setNicknameMessage('');
        setErrors((prev) => ({
            ...prev,
            nickname: checkError?.message || '닉네임 확인에 실패했습니다.',
        }));
    } finally {
        setIsCheckingNickname(false);
    }
}; }

function createBirthPickerChangeHandler({ setShowBirthPicker, handleInputChange }) { return (event, selected) => {
    if (Platform.OS !== 'ios') {
        setShowBirthPicker(false);
    }
    if (event.type === 'dismissed') return;
    if (selected) {
        handleInputChange('birthdate', formatDateYYYYMMDD(selected));
    }
}; }

function createValidateProfileFormHandler({
    formData,
    isSocialLogin,
    isNicknameSame,
    nicknameChecked,
    setErrors,
}) { return () => {
    const nextErrors = validateProfileForm({
        formData,
        isSocialLogin,
        isNicknameSameValue: isNicknameSame,
        nicknameChecked,
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
}; }

function createSaveProfileHandler({
    formData,
    profile,
    isSocialLogin,
    validateForm,
    updateMyProfile,
    showToast,
    setNicknameChecked,
    fetchProfile,
    setUpdateProfilePending,
}) { return async () => {
    if (!validateForm()) return;

    const payload = buildProfilePayload(formData, profile, isSocialLogin);

    try {
        setUpdateProfilePending(true);
        await updateMyProfile(payload);
        showToast('success', '저장되었습니다.');
        setNicknameChecked(true);
        fetchProfile();
    } catch (updateError) {
        console.error('회원정보 수정 실패:', updateError);
        showToast('error', updateError?.message || '회원정보 수정에 실패했습니다.');
    } finally {
        setUpdateProfilePending(false);
    }
}; }

function createPasswordModalOpenHandler(setShowPasswordModal) { return () => {
    setShowPasswordModal(true);
}; }

function createPasswordModalCloseHandler(setShowPasswordModal) { return () => {
    setShowPasswordModal(false);
}; }

function createBirthPickerOpenHandler(setShowBirthPicker) { return () => {
    setShowBirthPicker(true);
}; }

function createCompositionStartHandler(setIsNameComposing) { return () => {
    setIsNameComposing(true);
}; }

function createCompositionEndHandler({ setIsNameComposing, handleInputChange, fallbackValue }) { return (event) => {
    setIsNameComposing(false);
    handleInputChange('realname', event?.nativeEvent?.text ?? fallbackValue);
}; }

function createShowToastHandler(setToast) { return (tone, message) => {
    setToast({ open: true, tone, message });
}; }

function createFieldChangeHandler(handleInputChange, field) { return (value) => {
    handleInputChange(field, value);
}; }

function createConditionalFieldChangeHandler({
    handleInputChange,
    field,
    shouldBlock,
}) { return (value) => {
    if (shouldBlock()) return;
    handleInputChange(field, value);
}; }
function createTabPressHandler({ setActiveTab }) { return (tabId) =>
            () => {
                setActiveTab(tabId);
            }; }

function getMyPageTabContent({ activeTab, tabs })  {
    switch (activeTab) {
        case 'overview':
            return tabs.overview;
        case 'meetings':
            return tabs.meetings;
        case 'records':
            return tabs.records;
        case 'notifications':
            return tabs.notifications;
        case 'edit':
            return tabs.edit;
        case 'withdraw':
            return tabs.withdraw;
        default:
            return tabs.overview;
    }
};
function openWebDateInput({ value, onChange })  {
    const doc = globalThis?.document;
    if (!doc || typeof doc.createElement !== 'function') return false;

    const input = doc.createElement('input');
    input.type = 'date';
    input.value = value;
    input.onchange = (event) => {
        onChange(event?.target?.value || '');
    };
    input.click();
    return true;
};

function createDatePickerChangeHandler({ setValue, setPage, toYmd }) { return (event, date) => {
            if (event?.type === 'dismissed') return;
            if (!date) return;
            setValue(toYmd(date));
            setPage(1);
        }; }

function createOpenDatePickerHandler({
        platform,
        value,
        setValue,
        setPage,
        setShowPicker,
        DateTimePickerAndroid,
        fromYmd,
        toYmd,
    }) { return () => {
            if (platform === 'web') {
                const didOpen = openWebDateInput({
                    value,
                    onChange: (nextValue) => {
                        setValue(nextValue);
                        setPage(1);
                    },
                });
                if (didOpen) return;
                return;
            }

            if (platform === 'android') {
                DateTimePickerAndroid.open({
                    value: fromYmd(value),
                    mode: 'date',
                    onChange: createDatePickerChangeHandler({ setValue, setPage, toYmd }),
                });
                return;
            }

            setShowPicker(true);
        }; }

function createTypeFilterHandler({ setTypeFilter, setPage }) { return (nextType) => {
            setTypeFilter(nextType);
            setPage(1);
        }; }

function createTypeTabPressHandler({ onSelect }) { return (tabId) =>
            () => {
                onSelect(tabId);
            }; }

function createResetFiltersHandler({ setTypeFilter, setStatusFilter, setStartDate, setEndDate, setPage }) { return () => {
            setTypeFilter('all');
            setStatusFilter('all');
            setStartDate('');
            setEndDate('');
            setPage(1);
        }; }

function createMeetingDetailHandler({ router }) { return (meetingId, slug) =>
            () => {
                router.push(`/meetings/${slug}/${meetingId}`);
            }; }

function createNextPageHandler({ setPage, totalPages }) { return () => {
            setPage((prev) => Math.min(totalPages, prev + 1));
        }; }

function createLoadNotificationsHandler({
        notificationsApi,
        filter,
        typeFilter,
        pickData,
        setNotifications,
        setLoading,
        setError,
    }) { return async () => {
            try {
                setLoading(true);
                setError(null);

                const params = { filter };
                if (typeFilter !== 'all') params.type_filter = typeFilter;

                const response = await notificationsApi.getNotifications(params);
                setNotifications(pickData(response) || []);
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        }; }

function createMarkAsReadHandler({ notificationsApi, setNotifications, alert }) { return async (id) => {
            try {
                await notificationsApi.markAsRead(id);
                const now = new Date().toISOString();
                setNotifications((prev) =>
                    prev.map((item) =>
                        item.id === id
                            ? { ...item, status: 'READ', read_at: item.read_at || now }
                            : item
                    )
                );
            } catch {
                alert('오류', '읽음 처리에 실패했습니다.');
            }
        }; }

function createMarkAllAsReadHandler({ notificationsApi, setNotifications, setToast, alert }) { return async () => {
            try {
                await notificationsApi.markAllAsRead();
                const now = new Date().toISOString();
                setNotifications((prev) =>
                    prev.map((item) => ({ ...item, status: 'READ', read_at: item.read_at || now }))
                );
                setToast({ tone: 'success', msg: '모든 알림이 읽음 처리되었습니다.' });
            } catch {
                alert('오류', '처리에 실패했습니다.');
            }
        }; }

function createDeleteNotificationHandler({ notificationsApi, setNotifications, setToast, alert }) { return async (id) => {
            try {
                await notificationsApi.deleteNotification(id);
                setNotifications((prev) => prev.filter((item) => item.id !== id));
                setToast({ tone: 'success', msg: '알림이 삭제되었습니다.' });
            } catch {
                alert('오류', '삭제에 실패했습니다.');
            }
        }; }

function createToggleSelectHandler({ setSelected }) { return (id) => {
            setSelected((prev) =>
                prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
            );
        }; }

function createToggleSelectPressHandler({ onToggle }) { return (id) =>
            () => {
                onToggle(id);
            }; }

function createSelectAllHandler({ notifications, selected, setSelected }) { return () => {
            if (selected.length === notifications.length) setSelected([]);
            else setSelected(notifications.map((item) => item.id));
        }; }

function createBulkReadHandler({ selected, markAsRead, setSelected }) { return async () => {
            for (const id of selected) await markAsRead(id);
            setSelected([]);
        }; }

function createBulkDeleteHandler({ selected, deleteOne, setSelected }) { return async () => {
            for (const id of selected) await deleteOne(id);
            setSelected([]);
        }; }

function createOpenNotificationHandler({ isUnreadNotification, markAsRead, router }) { return async (notification) => {
            if (isUnreadNotification(notification)) await markAsRead(notification.id);

            if (!notification.related_entity_type || !notification.related_entity_id) return;

            if (
                notification.related_entity_type === 'CLUB' ||
                notification.related_entity_type === 'CLUB_MEMBERSHIP'
            ) {
                router.push(`/clubs/${notification.related_entity_id}`);
            }
            if (notification.related_entity_type === 'CLUB_NOTICE' && notification.extra_data?.club_id) {
                router.push(`/clubs/${notification.extra_data.club_id}/notices`);
            }
        }; }

function createOpenNotificationPressHandler({ onOpen }) { return (notification) =>
            () => {
                onOpen(notification);
            }; }

function createFilterPressHandler({ setFilter }) { return (nextFilter) =>
            () => {
                setFilter(nextFilter);
            }; }

function createDeleteTargetHandler({ setDeleteTarget }) { return (id) =>
            () => {
                setDeleteTarget(id);
            }; }

function createClearDeleteTargetHandler({ setDeleteTarget }) { return () => {
            setDeleteTarget(null);
        }; }

function createConfirmDeleteHandler({ deleteTarget, deleteOne, setDeleteTarget }) { return () => {
            if (!deleteTarget) return;
            deleteOne(deleteTarget);
            setDeleteTarget(null);
        }; }
function createFetchProfileHandler({
    fetchMyProfile,
    fetchUserHandicap,
    extractData,
    setProfile,
    setHandicapInfo,
    setLoading,
    setError,
}) { return async () => {
    try {
        setLoading(true);
        setError(null);
        const response = await fetchMyProfile();
        const user = extractData(response);
        setProfile(user);
        if (user?.id) {
            const handicapResponse = await fetchUserHandicap(user.id);
            setHandicapInfo(extractData(handicapResponse));
        }
    } catch (fetchError) {
        console.error('프로필 조회 실패:', fetchError);
        setError('사용자 정보를 불러오는데 실패했습니다.');
    } finally {
        setLoading(false);
    }
}; }

function createFetchClubsHandler({
    fetchMyClubs,
    extractList,
    setClubs,
}) { return async () => {
    try {
        const response = await fetchMyClubs({ page: 1, limit: 3 });
        const items = extractList(response);
        setClubs(items);
    } catch (fetchError) {
        console.error('클럽 목록 조회 실패:', fetchError);
        setClubs([]);
    }
}; }

function createOpenClubsHandler(router) { return () => {
    router.push('/clubs');
}; }

function createOpenClubDetailHandler(router, clubId) { return () => {
    router.push(`/clubs/${clubId}`);
}; }
function createScoreStatusHandler({ setScoreStatus, setPage }) { return (nextStatus) => {
            setScoreStatus(nextStatus);
            setPage(1);
        }; }

function createScoreStatusPressHandler({ onSelect }) { return (status) =>
            () => {
                onSelect(status);
            }; }

function createPrevPageHandler({ setPage }) { return () => {
            setPage((prev) => Math.max(1, prev - 1));
        }; }

function createGoToDetailHandler({ router }) { return (meetingId) =>
            () => {
                router.push(`/meetings/rounding/${meetingId}`);
            }; }

function createCloseScoreModalHandler({ setShowScoreModal, setSelectedMeeting, setSelectedParticipantId }) { return () => {
            setShowScoreModal(false);
            setSelectedMeeting(null);
            setSelectedParticipantId(null);
        }; }

function createOpenComingSoonHandler({ setShowComingSoonModal }) { return () => {
            setShowComingSoonModal(true);
        }; }

function createCloseComingSoonHandler({ setShowComingSoonModal }) { return () => {
            setShowComingSoonModal(false);
        }; }

function createFetchStatsHandler({ fetchRoundingStats, pickData, setStatsLoading, setStatsError, setStats }) { return async () => {
            try {
                setStatsLoading(true);
                setStatsError(null);

                const response = await fetchRoundingStats();
                setStats(pickData(response));
            } catch (error) {
                console.error(error);
                setStatsError(error);
            } finally {
                setStatsLoading(false);
            }
        }; }

function createFetchMeetingsHandler({
        fetchMyRoundingMeetings,
        scoreStatus,
        page,
        limit,
        pickData,
        setMeetings,
        setTotalPages,
        setLoading,
        setError,
    }) { return async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetchMyRoundingMeetings({
                    score_status: scoreStatus,
                    page,
                    limit,
                });

                const data = pickData(response) || response || {};
                const list = data?.data ?? data?.list ?? [];
                setMeetings(Array.isArray(list) ? list : []);
                setTotalPages(Number(data?.total_pages) || 1);
            } catch (error) {
                console.error(error);
                setError(error);
            } finally {
                setLoading(false);
            }
        }; }

function createFetchHandicapHandler({ fetchMyProfile, fetchUserHandicap, pickData, setCurrentHandicap }) { return async () => {
            try {
                const profileResp = await fetchMyProfile?.();
                const profile = pickData(profileResp);
                const userId = profile?.id || profile?.data?.id;

                if (!userId || !fetchUserHandicap) return;

                const handicapResp = await fetchUserHandicap(userId);
                const handicapData = pickData(handicapResp) || {};
                const info = handicapData?.data || handicapData;

                const calculated = info?.calculated_handicap;
                const initial = info?.initial_handicap;
                const value = calculated ?? initial ?? null;

                setCurrentHandicap(value);
            } catch (error) {
                console.warn('handicap fetch failed:', error?.message || error);
            }
        }; }

function createOpenScoreModalHandler({
        fetchRoundParticipants,
        fetchMyProfile,
        pickData,
        setSelectedParticipantId,
        setSelectedMeeting,
        setShowScoreModal,
        alert,
    }) { return async (meeting) => {
            try {
                const participantsResp = await fetchRoundParticipants(meeting.meeting_id);
                const participants = pickData(participantsResp);
                const list = Array.isArray(participants)
                    ? participants
                    : participants?.data || [];

                const profileResp = await fetchMyProfile?.();
                const profile = pickData(profileResp);
                const myUserId = profile?.id || profile?.data?.id;

                const mine = list.find((participant) => participant.user_id === myUserId);

                if (!mine) {
                    alert('오류', '참가자 정보를 찾을 수 없습니다.');
                    return;
                }

                setSelectedParticipantId(mine.id);
                setSelectedMeeting(meeting);
                setShowScoreModal(true);
            } catch (error) {
                console.error('참가자 조회 실패:', error);
                alert('오류', '참가자 정보를 불러오는데 실패했습니다.');
            }
        }; }

function createScoreSuccessHandler({
        setShowScoreModal,
        setSelectedMeeting,
        setSelectedParticipantId,
        fetchMeetings,
        fetchStats,
        fetchHandicap,
    }) { return async () => {
            setShowScoreModal(false);
            setSelectedMeeting(null);
            setSelectedParticipantId(null);
            await fetchMeetings();
            await fetchStats();
            await fetchHandicap();
        }; }

function createGrossScoreChangeHandler({ setGrossScore }) { return (value) => {
            if (value === '') {
                setGrossScore('');
                return;
            }
            if (!/^\d+$/.test(value)) return;

            if (value.length > 1 && value[0] === '0') {
                const stripped = value.replace(/^0+/, '') || '0';
                if (stripped === '0') {
                    setGrossScore('');
                    return;
                }
                setGrossScore(stripped);
                return;
            }

            setGrossScore(value);
        }; }

function createScoreValidationHandler({ grossScore, setErrors }) { return () => {
            const nextErrors = {};
            if (!grossScore || grossScore.trim() === '') {
                nextErrors.grossScore = '라운딩 스코어를 입력해주세요.';
            } else {
                const score = parseInt(grossScore, 10);
                if (Number.isNaN(score)) nextErrors.grossScore = '숫자만 입력 가능합니다.';
                else if (score < 55 || score > 144) {
                    nextErrors.grossScore = '스코어는 55~144 사이의 값이어야 합니다.';
                }
            }
            setErrors(nextErrors);
            return Object.keys(nextErrors).length === 0;
        }; }

function createScoreSubmitHandler({
        validate,
        shouldCompleteRounding,
        meetingId,
        participantId,
        grossScore,
        submitSimpleScore,
        completeRounding,
        onSuccess,
        onClose,
        resetLocal,
        setIsSubmitting,
        setErrors,
    }) { return async () => {
            if (!validate()) return;

            try {
                setIsSubmitting(true);

                if (shouldCompleteRounding) {
                    await completeRounding(meetingId);
                }

                await submitSimpleScore(meetingId, participantId, {
                    gross_score: parseInt(grossScore, 10),
                });

                onSuccess?.(shouldCompleteRounding);
                onClose?.();
                resetLocal();
            } catch (error) {
                console.error('점수 입력 실패:', error);
                const detail =
                    error?.response?.data?.detail || error?.message || '점수 입력에 실패했습니다.';
                setErrors({ submit: detail });
            } finally {
                setIsSubmitting(false);
            }
        }; }

function createResetScoreEntryHandler({ setGrossScore, setIsSubmitting, setErrors }) { return () => {
            setGrossScore('');
            setIsSubmitting(false);
            setErrors({});
        }; }

function createCloseScoreEntryHandler({ isSubmitting, onClose, resetLocal }) { return () => {
            if (isSubmitting) return;
            onClose?.();
            resetLocal();
        }; }
function createToggleAgreedHandler({ setAgreed }) { return () => {
            setAgreed((prev) => !prev);
        }; }

function createConfirmTextChangeHandler({ setConfirmText }) { return (value) => {
            setConfirmText(value);
        }; }

function createSubmitWithdrawHandler({ agreed, confirmText, setError, setModalOpen, getWithdrawValidationError }) { return () => {
            const message = getWithdrawValidationError({ agreed, confirmText });
            if (message) {
                setError(message);
                return;
            }
            setError('');
            setModalOpen(true);
        }; }

function createCloseWithdrawModalHandler({ setModalOpen }) { return () => {
            setModalOpen(false);
        }; }

function createConfirmWithdrawHandler({
        deleteAccount,
        setIsSubmitting,
        setResultMessage,
        setModalOpen,
        setError,
        router,
    }) { return async () => {
            try {
                setIsSubmitting(true);
                await deleteAccount();
                setResultMessage('회원 탈퇴가 완료되었습니다.');
                setModalOpen(false);
                router.replace('/login');
            } catch (error) {
                setError(error?.message || '회원 탈퇴에 실패했습니다.');
            } finally {
                setIsSubmitting(false);
            }
        }; }

export const mypageRenderUtils = {
    createPasswordFieldChangeHandler,
    createSubmitChangePasswordHandler,
    createResetPasswordModalHandler,
    createValidatePasswordModalHandler,
    createSubmitPasswordModalHandler,
    createInputChangeHandler,
    createCheckNicknameDuplicateHandler,
    createBirthPickerChangeHandler,
    createValidateProfileFormHandler,
    createSaveProfileHandler,
    createPasswordModalOpenHandler,
    createPasswordModalCloseHandler,
    createBirthPickerOpenHandler,
    createCompositionStartHandler,
    createCompositionEndHandler,
    createShowToastHandler,
    createFieldChangeHandler,
    createConditionalFieldChangeHandler,
    createTabPressHandler,
    getMyPageTabContent,
    createOpenDatePickerHandler,
    createTypeFilterHandler,
    createTypeTabPressHandler,
    createResetFiltersHandler,
    createMeetingDetailHandler,
    createNextPageHandler,
    createLoadNotificationsHandler,
    createMarkAsReadHandler,
    createMarkAllAsReadHandler,
    createDeleteNotificationHandler,
    createToggleSelectHandler,
    createToggleSelectPressHandler,
    createSelectAllHandler,
    createBulkReadHandler,
    createBulkDeleteHandler,
    createOpenNotificationHandler,
    createOpenNotificationPressHandler,
    createFilterPressHandler,
    createDeleteTargetHandler,
    createClearDeleteTargetHandler,
    createConfirmDeleteHandler,
    createFetchProfileHandler,
    createFetchClubsHandler,
    createOpenClubsHandler,
    createOpenClubDetailHandler,
    createScoreStatusHandler,
    createScoreStatusPressHandler,
    createPrevPageHandler,
    createGoToDetailHandler,
    createCloseScoreModalHandler,
    createOpenComingSoonHandler,
    createCloseComingSoonHandler,
    createFetchStatsHandler,
    createFetchMeetingsHandler,
    createFetchHandicapHandler,
    createOpenScoreModalHandler,
    createScoreSuccessHandler,
    createGrossScoreChangeHandler,
    createScoreValidationHandler,
    createScoreSubmitHandler,
    createResetScoreEntryHandler,
    createCloseScoreEntryHandler,
    createToggleAgreedHandler,
    createConfirmTextChangeHandler,
    createSubmitWithdrawHandler,
    createCloseWithdrawModalHandler,
    createConfirmWithdrawHandler,
}