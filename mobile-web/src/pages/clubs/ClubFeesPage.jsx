import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clubsApi } from '../../lib';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowLeft, FaMoneyBillWave, FaCalendarAlt, FaCheckCircle, FaTimes, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const ClubFeesPage = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('regular'); // 'regular' 또는 'fee'
  const [editingFeeItem, setEditingFeeItem] = useState(null); // 회비 항목 수정 시
  const [editingAmount, setEditingAmount] = useState('');
  const [editingCycle, setEditingCycle] = useState('MONTHLY');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingName, setEditingName] = useState('');
  const [editingIsActive, setEditingIsActive] = useState(true);
  const [hasRegularFee, setHasRegularFee] = useState(false);
  
  // 확인 모달 상태
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  // 토스트 알림 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // 토스트 메시지 자동 숨김
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // 토스트 알림 표시 함수
  const showToastNotification = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 클럽 정보 조회
  const {
    data: club,
    isLoading: clubLoading,
    error: clubError
  } = useQuery({
    queryKey: ['club', clubId],
    queryFn: () => clubsApi.getClub(clubId),
    enabled: !!clubId,
  });

  // 클럽 멤버 목록 조회 (권한 확인용)
  const {
    data: membersData
  } = useQuery({
    queryKey: ['club-members', clubId],
    queryFn: () => clubsApi.getClubMembers(clubId),
    enabled: !!clubId,
  });

  // 회비 정보 조회
  const {
    data: feeData,
    isLoading: feesLoading,
    error: feesError
  } = useQuery({
    queryKey: ['club-regular-fee', clubId],
    queryFn: () => clubsApi.getRegularFee(clubId),
    enabled: !!clubId,
  });

  // 회비 항목 목록 조회
  const {
    data: feeItemsRaw,
    isLoading: feeItemsLoading,
    error: feeItemsError
  } = useQuery({
    queryKey: ['club-fees', clubId],
    queryFn: async () => {
      console.log('🔍 회비 항목 조회 시작 - clubId:', clubId);
      try {
        const data = await clubsApi.getClubFees(clubId);
        console.log('✅ 회비 항목 조회 응답:', data);
        console.log('✅ 회비 항목 타입:', typeof data, Array.isArray(data));
        console.log('✅ 회비 항목 개수:', data?.length);
        // 배열이 아닌 경우 빈 배열로 변환
        const result = Array.isArray(data) ? data : (data ? [data] : []);
        console.log('✅ 회비 항목 최종 결과:', result);
        return result;
      } catch (error) {
        console.error('❌ 회비 항목 조회 에러:', error);
        throw error;
      }
    },
    enabled: !!clubId,
    refetchOnMount: true,  // 마운트 시 항상 리패치
    refetchOnWindowFocus: true,  // 윈도우 포커스 시 리패치
  });

  // feeItems를 항상 배열로 보장
  const feeItems = Array.isArray(feeItemsRaw) ? feeItemsRaw : (feeItemsRaw ? [feeItemsRaw] : []);

  // 디버깅: clubId 확인
  useEffect(() => {
    console.log('🔍 ClubFeesPage 디버깅:');
    console.log('  - clubId:', clubId);
    console.log('  - clubId 타입:', typeof clubId);
    console.log('  - clubId 존재 여부:', !!clubId);
  }, [clubId]);
  
  // 디버깅: 회비 항목 조회 쿼리 상태 확인
  useEffect(() => {
    console.log('🔍 회비 항목 조회 쿼리 상태:');
    console.log('  - feeItemsLoading:', feeItemsLoading);
    console.log('  - feeItemsError:', feeItemsError);
    console.log('  - feeItemsRaw:', feeItemsRaw);
    console.log('  - feeItems:', feeItems);
  }, [feeItemsLoading, feeItemsError, feeItemsRaw, feeItems]);

  // 권한 확인
  const userMembership = membersData?.members?.find(m => m.user_id === user?.id);
  const isLeader = userMembership?.role === 'LEADER';
  const isManager = userMembership?.role === 'MANAGER';
  
  // 클럽 API 응답의 membership_role도 체크 (fallback)
  const isLeaderFromClub = club?.membership_role === 'LEADER';
  const isManagerFromClub = club?.membership_role === 'MANAGER';
  
  // 최종 권한: membersData 우선, 없으면 club.membership_role 사용
  const hasLeaderRole = isLeader || isLeaderFromClub;
  const hasManagerRole = isManager || isManagerFromClub;
  const canManage = hasLeaderRole || hasManagerRole;

  // 정기 회비 수정 mutation
  const updateFeeMutation = useMutation({
    mutationFn: (feeData) => 
      clubsApi.updateRegularFee(clubId, feeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-regular-fee', clubId] });
      setDialogOpen(false);
      showToastNotification('회비 설정이 성공적으로 저장되었습니다.', 'success');
    },
    onError: (error) => {
      showToastNotification('회비 설정 저장에 실패했습니다.', 'error');
    },
  });

  // 회비 항목 생성 mutation
  const createFeeItemMutation = useMutation({
    mutationFn: (feeData) => {
      console.log('회비 항목 생성 요청 데이터:', feeData);
      return clubsApi.createClubFee(clubId, feeData);
    },
    onSuccess: (data) => {
      console.log('회비 항목 생성 성공 응답:', data);
      // 캐시 무효화 및 리패치
      queryClient.invalidateQueries({ queryKey: ['club-fees', clubId] });
      queryClient.refetchQueries({ queryKey: ['club-fees', clubId] });
      setDialogOpen(false);
      // 폼 초기화
      setEditingName('');
      setEditingAmount('');
      setEditingCycle('');
      setEditingDescription('');
      setEditingIsActive(true);
      showToastNotification('회비 항목이 성공적으로 추가되었습니다.', 'success');
    },
    onError: (error) => {
      console.error('회비 항목 추가 에러:', error);
      showToastNotification('회비 항목 추가에 실패했습니다.', 'error');
    },
  });

  // 회비 항목 수정 mutation
  const updateFeeItemMutation = useMutation({
    mutationFn: ({ feeId, feeData }) => 
      clubsApi.updateClubFee(clubId, feeId, feeData),
    onSuccess: (data) => {
      console.log('회비 항목 수정 성공 응답:', data);
      // 캐시 무효화 및 리패치
      queryClient.invalidateQueries({ queryKey: ['club-fees', clubId] });
      queryClient.refetchQueries({ queryKey: ['club-fees', clubId] });
      setDialogOpen(false);
      showToastNotification('회비 항목이 성공적으로 수정되었습니다.', 'success');
    },
    onError: (error) => {
      console.error('회비 항목 수정 에러:', error);
      showToastNotification('회비 항목 수정에 실패했습니다.', 'error');
    },
  });

  // 회비 항목 삭제 mutation
  const deleteFeeItemMutation = useMutation({
    mutationFn: (feeId) => 
      clubsApi.deleteClubFee(clubId, feeId),
    onSuccess: (data) => {
      console.log('회비 항목 삭제 성공 응답:', data);
      // 캐시 무효화 및 리패치
      queryClient.invalidateQueries({ queryKey: ['club-fees', clubId] });
      queryClient.refetchQueries({ queryKey: ['club-fees', clubId] });
      setConfirmModal({ ...confirmModal, isOpen: false });
      showToastNotification('회비 항목이 성공적으로 삭제되었습니다.', 'success');
    },
    onError: (error) => {
      console.error('회비 항목 삭제 에러:', error);
      showToastNotification('회비 항목 삭제에 실패했습니다.', 'error');
    },
  });

  // 정기 회비 수정 모달 열기
  const handleEditRegularFee = () => {
    setDialogMode('regular');
    if (feeData) {
      setHasRegularFee(feeData.has_regular_fee || false);
      setEditingAmount(feeData.regular_fee_amount?.toString() || '');
      setEditingCycle(feeData.regular_fee_cycle || 'MONTHLY');
      setEditingDescription(feeData.regular_fee_description || '');
    }
    setDialogOpen(true);
  };

  // 회비 항목 추가 모달 열기
  const handleAddFeeItem = () => {
    setDialogMode('fee');
    setEditingFeeItem(null);
    setEditingName('');
    setEditingAmount('');
    setEditingCycle('');  // 빈 문자열로 시작 (선택 안 함)
    setEditingDescription('');
    setEditingIsActive(true);
    setDialogOpen(true);
  };

  // 회비 항목 수정 모달 열기
  const handleEditFeeItem = (feeItem) => {
    setDialogMode('fee');
    setEditingFeeItem(feeItem);
    setEditingName(feeItem.name || '');
    setEditingAmount(feeItem.amount?.toString() || '');
    setEditingCycle(feeItem.cycle || '');  // 수정 시에는 빈 문자열로 시작 (기존 값이 없으면)
    setEditingDescription(feeItem.description || '');
    setEditingIsActive(feeItem.is_active !== false);
    setDialogOpen(true);
  };

  // 회비 항목 삭제 확인
  const handleDeleteFeeItem = (feeItem) => {
    setConfirmModal({
      isOpen: true,
      title: '회비 항목 삭제',
      message: `"${feeItem.name}" 회비 항목을 삭제하시겠습니까?`,
      onConfirm: () => {
        deleteFeeItemMutation.mutate(feeItem.id);
      }
    });
  };

  // 회비 설정 저장
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (dialogMode === 'regular') {
      // 정기 회비 저장
      if (hasRegularFee) {
        const amount = parseFloat(editingAmount);
        if (!amount || amount <= 0) {
          showToastNotification('회비 금액을 올바르게 입력해주세요.', 'error');
          return;
        }
        if (!editingCycle) {
          showToastNotification('납부 주기를 선택해주세요.', 'error');
          return;
        }
      }

      const feeUpdateData = {
        has_regular_fee: hasRegularFee,
        regular_fee_amount: hasRegularFee ? parseFloat(editingAmount) : null,
        regular_fee_cycle: hasRegularFee ? editingCycle : null,
        regular_fee_description: hasRegularFee ? editingDescription : null
      };

      updateFeeMutation.mutate(feeUpdateData);
    } else {
      // 회비 항목 저장
      if (!editingName.trim()) {
        showToastNotification('회비 항목명을 입력해주세요.', 'error');
        return;
      }
      const amount = parseFloat(editingAmount);
      if (isNaN(amount) || amount <= 0) {
        showToastNotification('회비 금액을 올바르게 입력해주세요.', 'error');
        return;
      }

      // 요청 데이터 준비 (타입 명시적 변환)
      const feeItemData = {
        name: editingName.trim(),
        amount: Number(amount),  // 숫자로 명시적 변환
        is_active: Boolean(editingIsActive)  // boolean으로 명시적 변환
      };
      
      console.log('회비 항목 데이터 타입 확인:', {
        name: typeof feeItemData.name,
        amount: typeof feeItemData.amount,
        is_active: typeof feeItemData.is_active,
        amount_value: feeItemData.amount,
        is_active_value: feeItemData.is_active
      });
      
      if (editingFeeItem) {
        // 수정 시: 모든 필드를 명시적으로 보내야 함 (Optional 필드도)
        if (editingCycle && editingCycle.trim() && editingCycle !== '') {
          feeItemData.cycle = editingCycle;
        } else {
          // 빈 문자열이면 null로 보내서 기존 값을 제거
          feeItemData.cycle = null;
        }
        
        if (editingDescription && editingDescription.trim() && editingDescription !== '') {
          feeItemData.description = editingDescription.trim();
        } else {
          // 빈 문자열이면 null로 보내서 기존 값을 제거
          feeItemData.description = null;
        }
        
        console.log('회비 항목 수정 요청 데이터:', feeItemData);
        updateFeeItemMutation.mutate({ feeId: editingFeeItem.id, feeData: feeItemData });
      } else {
        // 생성 시: 빈 문자열이면 필드 자체를 제외 (undefined로 설정하지 않음)
        if (editingCycle && editingCycle.trim() && editingCycle !== '') {
          feeItemData.cycle = editingCycle;
        }
        // cycle이 없으면 필드를 포함하지 않음 (Optional 필드이므로)
        
        if (editingDescription && editingDescription.trim() && editingDescription !== '') {
          feeItemData.description = editingDescription.trim();
        }
        // description이 없으면 필드를 포함하지 않음 (Optional 필드이므로)
        
        console.log('회비 항목 생성 요청 데이터:', feeItemData);
        createFeeItemMutation.mutate(feeItemData);
      }
    }
  };

  // 모달 닫기
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogMode('regular');
    setEditingFeeItem(null);
    setEditingAmount('');
    setEditingCycle('MONTHLY');
    setEditingDescription('');
    setEditingName('');
    setEditingIsActive(true);
    setHasRegularFee(false);
  };

  // 주기 텍스트 변환
  const getCycleText = (cycle) => {
    if (!cycle) return '-';
    switch (cycle) {
      case 'MONTHLY': return '매월';
      case 'QUARTERLY': return '분기별';
      case 'YEARLY': return '연간';
      case 'ONE_TIME': return '일회성';
      default: return cycle;
    }
  };

  if (clubLoading || feesLoading || feeItemsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (clubError || feesError || feeItemsError) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">회비 정보를 불러올 수 없습니다</h3>
            <p className="text-neutral-600">잠시 후 다시 시도해주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">권한이 없습니다</h3>
            <p className="text-neutral-600">회비 설정은 리더나 매니저만 가능합니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/clubs/${clubId}`)}
            className="flex items-center text-neutral-600 hover:text-neutral-900 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            <span className="text-sm font-medium">클럽 관리</span>
          </button>
        </div>
        
        {/* 클럽 정보 카드 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white">
              <img 
                src="/logo.png" 
                alt={club.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{club.name}</h1>
              <p className="text-neutral-600">회비 설정</p>
            </div>
          </div>
        </div>

        {/* 정기 회비 설정 카드 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">정기 회비 설정</h3>
            <button
              onClick={handleEditRegularFee}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <span>{feeData?.has_regular_fee ? '수정' : '설정'}</span>
            </button>
          </div>

          {feeData?.has_regular_fee ? (
            <div className="space-y-4">
              <div className="bg-neutral-50 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-neutral-900 mb-2">정기 회비</h4>
                    {feeData.regular_fee_description && (
                      <p className="text-neutral-600 text-sm mb-3">{feeData.regular_fee_description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      활성
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div className="flex items-center space-x-3">
                    <FaMoneyBillWave className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-sm font-medium text-neutral-500">회비 금액</p>
                      <p className="text-xl font-semibold text-neutral-900">
                        {feeData.regular_fee_amount?.toLocaleString() || 0}원
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCalendarAlt className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-sm font-medium text-neutral-500">납부 주기</p>
                      <p className="text-lg font-semibold text-neutral-900">
                        {feeData.regular_fee_cycle === 'MONTHLY' ? '매월' :
                         feeData.regular_fee_cycle === 'QUARTERLY' ? '분기별' :
                         feeData.regular_fee_cycle === 'YEARLY' ? '연간' : feeData.regular_fee_cycle || '-'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {feeData.updated_at && (
                  <div className="pt-4 border-t border-neutral-200">
                    <p className="text-sm text-neutral-500">
                      설정일: {new Date(feeData.updated_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-neutral-400 mb-4">
                <FaMoneyBillWave className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">정기 회비가 설정되지 않았습니다</h3>
              <p className="text-neutral-600 mb-4">클럽의 정기 회비를 설정하세요.</p>
            </div>
          )}
        </div>

        {/* 회비 항목 목록 카드 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">회비 항목</h3>
            <button
              onClick={handleAddFeeItem}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <FaPlus className="h-4 w-4" />
              <span>회비 항목 추가</span>
            </button>
          </div>

          {(() => {
            console.log('🔍 회비 항목 렌더링 체크:', {
              feeItems,
              feeItemsRaw,
              isArray: Array.isArray(feeItems),
              length: feeItems?.length,
              type: typeof feeItems,
              loading: feeItemsLoading,
              error: feeItemsError
            });
            return null;
          })()}
          {feeItemsLoading ? (
            <div className="text-center py-12">
              <div className="text-neutral-400 mb-4">
                <FaMoneyBillWave className="mx-auto h-12 w-12 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">회비 항목을 불러오는 중...</h3>
            </div>
          ) : feeItemsError ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">
                <FaTimes className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-red-900 mb-2">회비 항목을 불러오는 중 오류가 발생했습니다</h3>
              <p className="text-neutral-600 mb-4">{feeItemsError?.message || '알 수 없는 오류'}</p>
            </div>
          ) : !feeItems || !Array.isArray(feeItems) || feeItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-neutral-400 mb-4">
                <FaMoneyBillWave className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">회비 항목이 없습니다</h3>
              <p className="text-neutral-600 mb-4">회비 항목을 추가하세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feeItems.map((feeItem) => (
                <div key={feeItem.id} className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-neutral-900">{feeItem.name}</h4>
                        {feeItem.is_active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            활성
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            비활성
                          </span>
                        )}
                      </div>
                      
                      {feeItem.description && (
                        <p className="text-neutral-600 text-sm mb-3">{feeItem.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div className="flex items-center space-x-3">
                          <FaMoneyBillWave className="h-4 w-4 text-neutral-400" />
                          <div>
                            <p className="text-xs font-medium text-neutral-500">금액</p>
                            <p className="text-lg font-semibold text-neutral-900">
                              {feeItem.amount?.toLocaleString() || 0}원
                            </p>
                          </div>
                        </div>
                        {feeItem.cycle && (
                          <div className="flex items-center space-x-3">
                            <FaCalendarAlt className="h-4 w-4 text-neutral-400" />
                            <div>
                              <p className="text-xs font-medium text-neutral-500">주기</p>
                              <p className="text-sm font-semibold text-neutral-900">
                                {getCycleText(feeItem.cycle)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {feeItem.updated_at && (
                        <p className="text-xs text-neutral-500">
                          설정일: {new Date(feeItem.updated_at).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditFeeItem(feeItem)}
                        className="p-2 text-neutral-400 hover:text-primary-600 transition-colors"
                        title="수정"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFeeItem(feeItem)}
                        className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                        title="삭제"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 회비 설정/항목 모달 */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {dialogMode === 'regular' 
                  ? `정기 회비 ${feeData?.has_regular_fee ? '수정' : '설정'}`
                  : editingFeeItem ? '회비 항목 수정' : '회비 항목 추가'}
              </h3>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {dialogMode === 'regular' ? (
                <>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="has_regular_fee"
                      checked={hasRegularFee}
                      onChange={(e) => setHasRegularFee(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="has_regular_fee" className="ml-2 block text-sm text-gray-900">
                      정기 회비 사용
                    </label>
                  </div>

                  {hasRegularFee && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          회비 금액 (원) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={editingAmount}
                          onChange={(e) => setEditingAmount(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="예: 30000"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          납부 주기 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={editingCycle}
                          onChange={(e) => setEditingCycle(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        >
                          <option value="MONTHLY">매월</option>
                          <option value="QUARTERLY">분기별</option>
                          <option value="YEARLY">연간</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          설명 (선택사항)
                        </label>
                        <textarea
                          rows={3}
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="회비에 대한 설명을 입력하세요"
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      회비 항목명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="예: 입회비, 연회비 등"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      회비 금액 (원) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={editingAmount}
                      onChange={(e) => setEditingAmount(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="예: 30000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      납부 주기 
                    </label>
                    <select
                      value={editingCycle}
                      onChange={(e) => setEditingCycle(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">선택 안 함</option>
                      <option value="MONTHLY">매월</option>
                      <option value="QUARTERLY">분기별</option>
                      <option value="YEARLY">연간</option>
                      <option value="ONE_TIME">일회성</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      설명 (선택사항)
                    </label>
                    <textarea
                      rows={3}
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="회비 항목에 대한 설명을 입력하세요"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={editingIsActive}
                      onChange={(e) => setEditingIsActive(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      활성 상태
                    </label>
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={
                    (dialogMode === 'regular' && updateFeeMutation.isPending) ||
                    (dialogMode === 'fee' && (createFeeItemMutation.isPending || updateFeeItemMutation.isPending))
                  }
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {(dialogMode === 'regular' && updateFeeMutation.isPending) ||
                   (dialogMode === 'fee' && (createFeeItemMutation.isPending || updateFeeItemMutation.isPending))
                    ? '저장 중...' 
                    : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-slide-up ${
          toastType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toastType === 'success' ? (
            <FaCheckCircle className="w-5 h-5" />
          ) : (
            <FaTimes className="w-5 h-5" />
          )}
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 확인 모달 */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <FaTimes className="h-8 w-8 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {confirmModal.title}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {confirmModal.message}
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubFeesPage;

