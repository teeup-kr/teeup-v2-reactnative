import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { noticesApi } from '../../lib/api';
import { FaArrowLeft, FaFileAlt, FaDownload, FaExclamationCircle, FaChevronUp, FaChevronDown } from 'react-icons/fa';

const NoticeDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [prevNextNotices, setPrevNextNotices] = useState({ prev: null, next: null });

  // 공지사항 상세 조회
  const {
    data: notice,
    isLoading,
    error
  } = useQuery({
    queryKey: ['notice', id],
    queryFn: () => noticesApi.getNotice(parseInt(id))
  });

  // 이전글/다음글 조회를 위한 목록 조회
  useEffect(() => {
    if (notice) {
      // 현재 공지사항의 이전/다음 항목을 찾기 위해 목록 조회
      noticesApi.getNotices({
        page: 1,
        size: 100, // 충분히 큰 수로 설정하여 모든 공지사항 조회
        is_published: true
      }).then((data) => {
        const allNotices = data.notices || [];
        const currentIndex = allNotices.findIndex(n => n.id === parseInt(id));
        
        if (currentIndex !== -1) {
          setPrevNextNotices({
            prev: currentIndex > 0 ? allNotices[currentIndex - 1] : null,
            next: currentIndex < allNotices.length - 1 ? allNotices[currentIndex + 1] : null
          });
        }
      }).catch((err) => {
        console.error('이전글/다음글 조회 실패:', err);
      });
    }
  }, [notice, id]);

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
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (error || !notice) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="bg-error-50 border border-error-200 rounded-lg p-4">
            <div className="flex items-center">
              <FaExclamationCircle className="text-error-500 mr-2" />
              <p className="text-error-700 text-xs sm:text-sm">공지사항을 불러오는 중 오류가 발생했습니다.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/notices')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs sm:text-sm font-medium"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => navigate('/notices')}
          className="flex items-center text-neutral-600 hover:text-neutral-800 mb-4 transition-colors"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          <span className="text-xs sm:text-sm font-medium">목록으로</span>
        </button>

        {/* 공지사항 상세 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6 md:p-8">
          {/* 헤더 */}
          <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-neutral-200">
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
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-3 sm:mb-4">
              {notice.title}
            </h1>
            <div className="flex items-center flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-neutral-600">
              <span>작성자: 관리자</span>
              <span>등록일: {formatDate(notice.published_at || notice.created_at)}</span>
              <span>조회수: {notice.view_count || 0}</span>
            </div>
          </div>

          {/* 내용 */}
          <div className="mb-4 sm:mb-6">
            <div 
              className="prose prose-sm sm:prose-base max-w-none prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-p:leading-relaxed prose-ul:text-neutral-700 prose-ol:text-neutral-700 prose-li:text-neutral-700 prose-strong:text-neutral-900 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-img:max-w-full prose-img:rounded-lg prose-img:mx-auto prose-table:w-full prose-table:text-sm sm:prose-table:text-base"
              dangerouslySetInnerHTML={{ __html: notice.content || '' }}
            />
          </div>

          {/* 첨부파일 영역 */}
          {notice.attachment_file && (
            <div className="mb-4 sm:mb-6 pt-4 sm:pt-6 border-t border-neutral-200">
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 mb-2 sm:mb-3">첨부파일</h3>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <FaFileAlt className="h-6 w-6 sm:h-8 sm:w-8 text-neutral-400" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-neutral-900">{notice.attachment_file}</p>
                    <p className="text-xs text-neutral-500">첨부 파일</p>
                  </div>
                </div>
                {notice.web_view_link && (
                  <a
                    href={notice.web_view_link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
                  >
                    <FaDownload className="inline mr-1" />
                    다운로드
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 이전글/다음글 네비게이션 */}
          <div className="pt-4 sm:pt-6 border-t border-neutral-200">
            <div className="space-y-2">
              {prevNextNotices.prev && (
                <button
                  onClick={() => navigate(`/notices/${prevNextNotices.prev.id}`)}
                  className="w-full flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors text-left"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <FaChevronUp className="text-neutral-400 mr-2 flex-shrink-0 h-3 w-3 sm:h-4 sm:w-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-500 mb-1">이전글</p>
                      <p className="text-xs sm:text-sm font-medium text-neutral-900 truncate">
                        {prevNextNotices.prev.title}
                      </p>
                    </div>
                  </div>
                </button>
              )}
              {prevNextNotices.next && (
                <button
                  onClick={() => navigate(`/notices/${prevNextNotices.next.id}`)}
                  className="w-full flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors text-left"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <FaChevronDown className="text-neutral-400 mr-2 flex-shrink-0 h-3 w-3 sm:h-4 sm:w-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-500 mb-1">다음글</p>
                      <p className="text-xs sm:text-sm font-medium text-neutral-900 truncate">
                        {prevNextNotices.next.title}
                      </p>
                    </div>
                  </div>
                </button>
              )}
              {!prevNextNotices.prev && !prevNextNotices.next && (
                <p className="text-xs sm:text-sm text-neutral-500 text-center py-2">
                  이전글/다음글이 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeDetailPage;

