import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { noticesApi } from '../../lib/api';
import { FaFileAlt, FaChevronLeft, FaChevronRight, FaExclamationCircle } from 'react-icons/fa';

const NoticeListPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // 공지사항 목록 조회 (발행된 것만)
  const {
    data: noticesData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['notices', currentPage, pageSize],
    queryFn: () => noticesApi.getNotices({
      page: currentPage,
      size: pageSize,
      is_published: true
    })
  });

  const notices = noticesData?.notices || [];
  const total = noticesData?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // 카테고리 한글 변환
  const getCategoryName = (type) => {
    const categoryMap = {
      'GENERAL': '일반',
      'SYSTEM': '시스템',
      'EVENT': '이벤트',
      'MAINTENANCE': '점검'
    };
    return categoryMap[type] || type;
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleNoticeClick = (noticeId) => {
    navigate(`/notices/${noticeId}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="flex items-center justify-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="bg-error-50 border border-error-200 rounded-lg p-4">
            <div className="flex items-center">
              <FaExclamationCircle className="text-error-500 mr-2" />
              <p className="text-error-700 text-xs sm:text-sm">공지사항을 불러오는 중 오류가 발생했습니다.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">공지사항</h1>
          <p className="text-neutral-600 text-xs sm:text-sm">티업링크의 새로운 소식과 공지사항을 확인하세요.</p>
        </div>

        {/* 공지사항 목록 */}
        {notices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 sm:p-12 text-center">
            <FaFileAlt className="mx-auto text-neutral-400 text-4xl mb-4" />
            <p className="text-neutral-600 text-sm sm:text-base">등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => handleNoticeClick(notice.id)}
                  className="bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow cursor-pointer p-4 sm:p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {getCategoryName(notice.type)}
                        </span>
                        {notice.is_important && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            중요
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2 sm:mb-3 line-clamp-2">
                        {notice.title}
                      </h3>
                      <div className="flex items-center flex-wrap gap-3 text-xs sm:text-sm text-neutral-500">
                        <span>작성자: 관리자</span>
                        <span>등록일: {formatDate(notice.published_at || notice.created_at)}</span>
                      </div>
                    </div>
                    <FaChevronRight className="text-neutral-400 ml-4 flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages >= 1 && (
              <div className="mt-6 sm:mt-8 flex items-center justify-center">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {/* << 첫 페이지 */}
                  {currentPage > 1 ? (
                    <Link
                      to={`/notices?page=1`}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(1);
                      }}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
                    >
                      &laquo;&laquo;
                    </Link>
                  ) : (
                    <span className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-400 bg-neutral-100 border border-neutral-200 rounded-lg cursor-not-allowed">
                      &laquo;&laquo;
                    </span>
                  )}

                  {/* < 이전 페이지 */}
                  {currentPage > 1 ? (
                    <Link
                      to={`/notices?page=${currentPage - 1}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                      }}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
                    >
                      &laquo;
                    </Link>
                  ) : (
                    <span className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-400 bg-neutral-100 border border-neutral-200 rounded-lg cursor-not-allowed">
                      &laquo;
                    </span>
                  )}

                  {/* 페이지 번호들 */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    pageNum === currentPage ? (
                      <span
                        key={pageNum}
                        className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-neutral-600 rounded-lg"
                      >
                        {pageNum}
                      </span>
                    ) : (
                      <Link
                        key={pageNum}
                        to={`/notices?page=${pageNum}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                        }}
                        className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
                      >
                        {pageNum}
                      </Link>
                    )
                  ))}

                  {/* > 다음 페이지 */}
                  {currentPage < totalPages ? (
                    <Link
                      to={`/notices?page=${currentPage + 1}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage + 1);
                      }}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
                    >
                      &raquo;
                    </Link>
                  ) : (
                    <span className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-400 bg-neutral-100 border border-neutral-200 rounded-lg cursor-not-allowed">
                      &raquo;
                    </span>
                  )}

                  {/* >> 마지막 페이지 */}
                  {currentPage < totalPages ? (
                    <Link
                      to={`/notices?page=${totalPages}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(totalPages);
                      }}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
                    >
                      &raquo;&raquo;
                    </Link>
                  ) : (
                    <span className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-400 bg-neutral-100 border border-neutral-200 rounded-lg cursor-not-allowed">
                      &raquo;&raquo;
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NoticeListPage;

