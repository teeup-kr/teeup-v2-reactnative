import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clubsApi } from '../../lib/clubsApi';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowLeft, FaSave, FaTimes, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ClubRegulationCreatePage = () => {
  const { clubId, regulationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const isEditMode = !!regulationId;
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    version: 'v1.0'
  });

  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', tone: 'success' });

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

  // 수정 모드일 때 기존 규정 데이터 조회
  const {
    data: existingRegulation,
    isLoading: regulationLoading
  } = useQuery({
    queryKey: ['club-regulation', clubId, regulationId],
    queryFn: () => clubsApi.getRegulationVersion(clubId, regulationId),
    enabled: !!clubId && !!regulationId && isEditMode,
  });

  // 토스트 자동 닫기
  useEffect(() => {
    if (!toast.open) return undefined;
    const timeout = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 3000);
    return () => clearTimeout(timeout);
  }, [toast.open]);

  // 기존 규정 데이터가 로드되면 폼 데이터 초기화
  useEffect(() => {
    if (existingRegulation && isEditMode) {
      setFormData({
        title: existingRegulation.title || '',
        content: existingRegulation.content || '',
        version: existingRegulation.version || 'v1.0'
      });
    }
  }, [existingRegulation, isEditMode]);

  // 규정 생성/수정 mutation
  const saveRegulationMutation = useMutation({
    mutationFn: async (data) => {
      if (isEditMode) {
        return clubsApi.updateRegulationVersion(clubId, regulationId, data);
      } else {
        return clubsApi.createRegulationVersion(clubId, data);
      }
    },
    onSuccess: (data) => {
      console.log('✅ 규정 생성/수정 성공:', data);
      
      // 규정 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['club-regulations-versions', clubId] });
      
      // 수정 모드일 때는 개별 규정 상세 캐시도 무효화
      if (isEditMode && regulationId) {
        queryClient.invalidateQueries({ queryKey: ['club-regulation', clubId, regulationId] });
      }
      
      setShowSuccessModal(true);
    },
    onError: (error) => {
      console.error('❌ 규정 생성/수정 실패:', error);
      const errorMessage = error.response?.data?.detail || '규정 저장에 실패했습니다.';
      setToast({ open: true, message: errorMessage, tone: 'error' });
    }
  });

  // 권한 확인
  const isLeader = membersData?.members?.some(member => 
    member.user_id === user?.id && member.role === 'LEADER'
  ) || false;
  
  const isManager = membersData?.members?.some(member => 
    member.user_id === user?.id && member.role === 'MANAGER'
  ) || false;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = '내용을 입력해주세요.';
    }
    
    if (!formData.version.trim()) {
      newErrors.version = '버전을 입력해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmSave = () => {
    setShowConfirmModal(false);
    saveRegulationMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (isEditMode) {
      navigate(`/clubs/${clubId}/regulations`);
    } else {
      navigate(`/clubs/${clubId}/manage`);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    if (isEditMode) {
      navigate(`/clubs/${clubId}/regulations`);
    } else {
      navigate(`/clubs/${clubId}/regulations`);
    }
  };

  if (clubLoading || regulationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (clubError || !club || !membersData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">정보를 불러올 수 없습니다</h3>
          <p className="text-gray-600 mb-6">잠시 후 다시 시도해주세요.</p>
          <button
            onClick={() => navigate('/clubs')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            클럽 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!isLeader && !isManager) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">권한이 없습니다</h3>
          <p className="text-gray-600 mb-6">클럽 규정을 생성/수정할 권한이 없습니다.</p>
          <button
            onClick={() => navigate(`/clubs/${clubId}`)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            클럽 상세로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleCancel}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isEditMode ? '클럽 규정 수정' : '클럽 규정 생성'}
                </h1>
                <p className="text-sm text-gray-600">
                  {club.name}의 규정을 {isEditMode ? '수정' : '생성'}하세요
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saveRegulationMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {saveRegulationMutation.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              규정 정보
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-6">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="규정 제목을 입력하세요"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* 버전 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  버전 *
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.version ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="예: v1.0, v1.1"
                />
                {errors.version && (
                  <p className="mt-1 text-sm text-red-600">{errors.version}</p>
                )}
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용 *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={20}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.content ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="규정 내용을 입력하세요..."
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 저장 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <FaExclamationTriangle className="h-6 w-6 text-yellow-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditMode ? '규정 수정 확인' : '규정 생성 확인'}
                </h3>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                {isEditMode 
                  ? '이 규정을 수정하시겠습니까?' 
                  : '새로운 규정을 생성하시겠습니까?'
                }
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors"
              >
                {isEditMode ? '수정' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <FaCheckCircle className="h-6 w-6 text-green-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditMode ? '규정 수정 완료' : '규정 생성 완료'}
                </h3>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                {isEditMode 
                  ? '규정이 성공적으로 수정되었습니다.' 
                  : '새로운 규정이 성공적으로 생성되었습니다.'
                }
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
              <button
                onClick={handleSuccessModalClose}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      {toast.open && (
        <div
          className={`fixed top-6 right-6 z-50 flex max-w-xs items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.tone === 'error'
              ? 'bg-red-600 text-white'
              : toast.tone === 'info'
              ? 'bg-blue-600 text-white'
              : 'bg-green-600 text-white'
          }`}
        >
          {toast.tone === 'error' ? <FaTimesCircle /> : <FaCheckCircle />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default ClubRegulationCreatePage;
