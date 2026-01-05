import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clubsApi } from '../../lib/clubsApi';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowLeft, FaEdit, FaCalendarAlt, FaUser, FaFileAlt, FaCheckCircle, FaTimes } from 'react-icons/fa';

const ClubRegulationDetailPage = () => {
  const { clubId, regulationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // 규정 상세 조회
  const {
    data: regulation,
    isLoading: regulationLoading
  } = useQuery({
    queryKey: ['club-regulation', clubId, regulationId],
    queryFn: () => clubsApi.getRegulationVersion(clubId, regulationId),
    enabled: !!clubId && !!regulationId,
  });

  if (clubLoading || regulationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">규정 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (clubError || !club || !membersData || !regulation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">규정 정보를 불러올 수 없습니다.</p>
          <button
            onClick={() => navigate(`/clubs/${clubId}/regulations`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            규정 관리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 권한 확인
  const isLeader = membersData.members?.some(member => 
    member.user_id === user?.id && member.role === 'LEADER'
  ) || false;
  
  const isManager = membersData.members?.some(member => 
    member.user_id === user?.id && member.role === 'MANAGER'
  ) || false;

  const handleEdit = () => {
    navigate(`/clubs/${clubId}/regulations/${regulationId}/edit`);
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="mr-1" />
          활성
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <FaTimes className="mr-1" />
          비활성
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/clubs/${clubId}/regulations`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <FaArrowLeft className="w-5 h-5 mr-2" />
            규정 관리로 돌아가기
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {regulation.title}
                </h1>
                {getStatusBadge(regulation.is_active)}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <FaFileAlt className="mr-2" />
                  버전 {regulation.version}
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  생성일: {new Date(regulation.created_at).toLocaleDateString('ko-KR')}
                </div>
                {regulation.updated_at && (
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2" />
                    수정일: {new Date(regulation.updated_at).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </div>
            </div>
            
            {(isLeader || isManager) && (
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              >
                <FaEdit className="mr-2" />
                수정
              </button>
            )}
          </div>
        </div>

        {/* 규정 내용 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              규정 내용
            </h2>
          </div>
          <div className="px-6 py-6">
            <div className="prose max-w-none">
              <div 
                className="text-gray-900 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: regulation.content }}
              />
            </div>
          </div>
        </div>

        {/* 규정 정보 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              규정 정보
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목
                </label>
                <p className="text-sm text-gray-900">{regulation.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  버전
                </label>
                <p className="text-sm text-gray-900">{regulation.version}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <div className="mt-1">
                  {getStatusBadge(regulation.is_active)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  생성일
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(regulation.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {regulation.updated_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    수정일
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(regulation.updated_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => navigate(`/clubs/${clubId}/regulations`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            목록으로
          </button>
          {(isLeader || isManager) && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 transition-colors"
            >
              수정하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubRegulationDetailPage;
