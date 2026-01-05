import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clubsApi } from '../../lib';
import { FaArrowLeft } from 'react-icons/fa';

const ClubStatsPage = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();

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

  if (clubLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">클럽 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (clubError || !club) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">클럽 정보를 불러올 수 없습니다.</p>
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
              <p className="text-neutral-600">클럽 통계</p>
            </div>
          </div>
        </div>

        {/* 기능 준비중 메시지 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-neutral-900 text-4xl font-medium">기능 준비중입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubStatsPage;

