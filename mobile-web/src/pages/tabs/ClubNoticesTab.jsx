import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clubsApi } from '../../lib';
import { FaBell, FaChevronDown, FaChevronUp, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ClubNoticesTab = ({ club, canManage = false }) => {
  const navigate = useNavigate();
  const [expandedNoticeId, setExpandedNoticeId] = useState(null); // 확장된 공지사항 ID
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;

  // 클럽 ID 확인 (display_id 또는 id 사용)
  const clubId = club?.display_id || club?.id;

  // 공지사항 목록 조회 (페이지네이션 적용)
  const {
    data: noticesData,
    isLoading: noticesLoading,
    error: noticesError
  } = useQuery({
    queryKey: ['club-notices', clubId, currentPage],
    queryFn: () => clubsApi.getClubNotices(clubId, { page: currentPage, limit }),
    enabled: !!clubId,
  });

  const notices = noticesData?.data || [];
  const totalPages = noticesData?.total_pages || 1;

  // 공지사항 확장/축소 토글
  const handleToggleExpand = (noticeId) => {
    setExpandedNoticeId(prevId => (prevId === noticeId ? null : noticeId));
  };

  // 공지사항 관리 페이지로 이동
  const handleManageNotices = () => {
    navigate(`/clubs/${clubId}/notices`);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (noticesLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (noticesError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-error-600 mb-4">
            <FaBell className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">공지사항을 불러올 수 없습니다</h3>
          <p className="text-neutral-600">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">공지사항</h3>
        {canManage && (
          <button
            onClick={handleManageNotices}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <span>공지사항 관리</span>
          </button>
        )}
      </div>

      {notices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-neutral-400 mb-4">
            <FaBell className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">공지사항이 없습니다</h3>
          <p className="text-neutral-600 mb-4">아직 등록된 공지사항이 없습니다.</p>
          {canManage && (
            <button
              onClick={handleManageNotices}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              공지사항 관리
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {notices.map((notice) => (
              <div key={notice.id} className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {notice.is_important && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          중요
                        </span>
                      )}
                      {notice.is_private && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          비공개
                        </span>
                      )}
                      <h4 className="text-lg font-semibold text-neutral-900">{notice.title}</h4>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-500 mb-2">
                      <span>작성자: {notice.author_name || notice.author_nickname || '알 수 없음'}</span>
                      <span>조회수: {notice.view_count || notice.views || 0}</span>
                      <span>{new Date(notice.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>

                    {/* 확장된 내용 */}
                    {expandedNoticeId === notice.id && (
                      <div className="mt-3 pt-3 border-t border-neutral-200">
                        <p className="text-neutral-700 whitespace-pre-wrap">{notice.content}</p>
                      </div>
                    )}
                  </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleToggleExpand(notice.id)}
                        className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                        title={expandedNoticeId === notice.id ? '접기' : '펼치기'}
                      >
                        {expandedNoticeId === notice.id ? (
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

export default ClubNoticesTab;
