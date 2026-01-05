import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clubsApi } from '../../lib';
import { FaFileAlt, FaChevronDown, FaChevronUp, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ClubRegulationsTab = ({ club, canManage = false }) => {
  const navigate = useNavigate();
  const [expandedRegulationId, setExpandedRegulationId] = useState(null); // 확장된 규정 ID
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;

  // 클럽 ID 확인 (display_id 또는 id 사용)
  const clubId = club?.display_id || club?.id;

  // 규정 목록 조회 (페이지네이션 적용)
  const {
    data: regulationsData,
    isLoading: regulationsLoading,
    error: regulationsError
  } = useQuery({
    queryKey: ['club-regulations-list', clubId, currentPage],
    queryFn: () => clubsApi.getClubRegulationsList(clubId, { page: currentPage, limit }),
    enabled: !!clubId,
  });

  // 응답 데이터에서 규정 목록 추출
  const regulations = regulationsData?.data || [];
  const totalPages = regulationsData?.total_pages || 1;

  // 규정 확장/축소 토글
  const handleToggleExpand = (regulationId) => {
    setExpandedRegulationId(prevId => (prevId === regulationId ? null : regulationId));
  };

  // 규정 관리 페이지로 이동
  const handleManageRegulations = () => {
    navigate(`/clubs/${clubId}/regulations`);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getCategoryBadge = (category) => {
    // category가 문자열인 경우 그대로 사용, 객체인 경우 name 속성 사용
    const categoryName = typeof category === 'string' ? category : (category?.name || category?.category || '일반');
    
    const categoryConfig = {
      '일반': { text: '일반', className: 'bg-blue-100 text-blue-800' },
      '회원': { text: '회원', className: 'bg-green-100 text-green-800' },
      '모임': { text: '모임', className: 'bg-purple-100 text-purple-800' },
      '회비': { text: '회비', className: 'bg-yellow-100 text-yellow-800' },
      GENERAL: { text: '일반', className: 'bg-blue-100 text-blue-800' },
      MEMBERSHIP: { text: '회원', className: 'bg-green-100 text-green-800' },
      MEETING: { text: '모임', className: 'bg-purple-100 text-purple-800' },
      FEE: { text: '회비', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = categoryConfig[categoryName] || categoryConfig['일반'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  if (regulationsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (regulationsError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-error-600 mb-4">
            <FaFileAlt className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">규정을 불러올 수 없습니다</h3>
          <p className="text-neutral-600">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">클럽 규정</h3>
        {canManage && (
          <button
            onClick={handleManageRegulations}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <span>규정 관리</span>
          </button>
        )}
      </div>

      {regulations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-neutral-400 mb-4">
            <FaFileAlt className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">규정이 없습니다</h3>
          <p className="text-neutral-600 mb-4">아직 등록된 규정이 없습니다.</p>
          {canManage && (
            <button
              onClick={handleManageRegulations}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              규정 관리
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {regulations.map((regulation) => (
              <div key={regulation.id} className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryBadge(regulation.category || regulation.category_name)}
                      <h4 className="text-lg font-semibold text-neutral-900">{regulation.title}</h4>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-500 mb-2">
                      <span>작성자: {regulation.author_name || '시스템'}</span>
                      <span>생성일: {new Date(regulation.created_at).toLocaleDateString('ko-KR')}</span>
                      {regulation.updated_at && regulation.updated_at !== regulation.created_at && (
                        <span>수정일: {new Date(regulation.updated_at).toLocaleDateString('ko-KR')}</span>
                      )}
                    </div>

                    {/* 확장된 내용 */}
                    {expandedRegulationId === regulation.id && (
                      <div className="mt-3 pt-3 border-t border-neutral-200">
                        <p className="text-neutral-700 whitespace-pre-wrap">{regulation.content}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleExpand(regulation.id)}
                      className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      title={expandedRegulationId === regulation.id ? '접기' : '펼치기'}
                    >
                      {expandedRegulationId === regulation.id ? (
                        <FaChevronUp className="h-4 w-4" />
                      ) : (
                        <FaChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 (항상 표시) */}
          <div className="flex items-center justify-center mt-6 space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg border ${
                currentPage === 1
                  ? 'border-neutral-300 text-neutral-400 cursor-not-allowed'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center space-x-1">
              {(() => {
                // 표시할 페이지 번호 계산 (5개씩 정렬)
                const pageNumbers = [];
                
                if (totalPages <= 5) {
                  // 5개 이하면 모두 표시
                  for (let i = 1; i <= totalPages; i++) {
                    pageNumbers.push(i);
                  }
                } else {
                  // 6개 이상: 항상 5개씩 표시 (5의 배수 단위로 그룹화)
                  // 현재 페이지가 속한 5의 배수 그룹 계산
                  // 예: 4페이지면 1-5 그룹, 6페이지면 6-10 그룹
                  const groupStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
                  const groupEnd = Math.min(groupStart + 4, totalPages);
                  
                  for (let i = groupStart; i <= groupEnd; i++) {
                    pageNumbers.push(i);
                  }
                }
                
                return pageNumbers.map((pageNum) => {
                  const isValidPage = pageNum >= 1 && pageNum <= totalPages;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        // 존재하지 않는 페이지 클릭 방지
                        if (!isValidPage) return;
                        handlePageChange(pageNum);
                      }}
                      disabled={!isValidPage}
                      className={`px-3 py-2 rounded-lg border ${
                        !isValidPage
                          ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                          : currentPage === pageNum
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                });
              })()}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg border ${
                currentPage === totalPages
                  ? 'border-neutral-300 text-neutral-400 cursor-not-allowed'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ClubRegulationsTab;






