import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { faqApi } from '../../lib/api';
import { FaQuestionCircle, FaChevronDown, FaSearch, FaTimes } from 'react-icons/fa';

export default function FAQPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 5;
  
  // 검색 및 필터 상태
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || '');

  // 아코디언 상태 (열린 FAQ ID 목록)
  const [openFaqIds, setOpenFaqIds] = useState(new Set());

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = 'FAQ | 티업링크';
    return () => {
      document.title = '티업링크';
    };
  }, []);

  // FAQ 목록 및 카테고리 조회
  useEffect(() => {
    fetchData();
    fetchCategories();
    window.scrollTo(0, 0);
  }, [currentPage, search, selectedCategory]);

  // URL 파라미터 동기화
  useEffect(() => {
    const page = parseInt(searchParams.get('page')) || 1;
    const searchParam = searchParams.get('search') || '';
    const categoryParam = searchParams.get('category_id') || '';
    
    if (page !== currentPage) setCurrentPage(page);
    if (searchParam !== search) setSearch(searchParam);
    if (categoryParam !== selectedCategory) setSelectedCategory(categoryParam);
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: limit,
      };
      if (search) params.search = search;
      if (selectedCategory) params.category_id = selectedCategory;

      const faqsRes = await faqApi.getFaqs(params);
      setFaqs(faqsRes.items || []);
      setCurrentPage(faqsRes.page || 1);
      setTotalPages(faqsRes.total_pages || 1);
      setTotal(faqsRes.total || 0);
    } catch (err) {
      console.error('FAQ 조회 에러:', err);
      setError('FAQ를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await faqApi.getCategories();
      setCategories(res || []);
    } catch (err) {
      console.error('FAQ 카테고리 조회 에러:', err);
    }
  };

  // 검색 적용
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateURL({ search, category_id: selectedCategory, page: 1 });
  };

  // 카테고리 변경
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    updateURL({ search, category_id: categoryId, page: 1 });
  };

  // 검색 초기화
  const handleClearSearch = () => {
    setSearch('');
    setCurrentPage(1);
    updateURL({ search: '', category_id: selectedCategory, page: 1 });
  };

  const updateURL = (params) => {
    const newParams = new URLSearchParams();
    if (params.search) newParams.set('search', params.search);
    if (params.category_id) newParams.set('category_id', params.category_id);
    if (params.page && params.page > 1) newParams.set('page', params.page);
    setSearchParams(newParams);
  };

  // 아코디언 토글
  const toggleAccordion = (faqId) => {
    setOpenFaqIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(faqId)) {
        newSet.delete(faqId);
      } else {
        newSet.add(faqId);
      }
      return newSet;
    });
  };

  // 페이지 정보 표시
  const getPageInfo = () => {
    if (faqs.length === 0) {
      return `총 ${total}개 중 0개 표시`;
    }
    const start = ((currentPage - 1) * limit) + 1;
    const end = Math.min(currentPage * limit, total);
    return `총 ${total}개 중 ${start}~${end}개 표시`;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        {/* 페이지 헤더 */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">자주 묻는 질문</h1>
          <p className="text-neutral-600 text-xs sm:text-sm">티업링크 이용에 관한 자주 묻는 질문과 답변을 모았습니다.</p>
        </div>

        {/* 검색바 */}
        <div className="mb-4 sm:mb-6">
          <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색어를 입력해주세요"
                className="w-full pl-12 pr-10 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 카테고리 탭 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => handleCategoryClick('')}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                !selectedCategory
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              전체
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(String(category.id))}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  selectedCategory === String(category.id)
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 페이지 정보 */}
        {!loading && !error && (
          <div className="mb-4 text-xs sm:text-sm text-neutral-600 text-left">
            {getPageInfo()}
          </div>
        )}

        {/* FAQ 아코디언 리스트 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="text-neutral-500 text-sm sm:text-base">로딩 중...</div>
            </div>
          ) : error ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="text-error-500 text-sm sm:text-base">{error}</div>
            </div>
          ) : faqs.length > 0 ? (
            faqs.map((faq) => {
              const isOpen = openFaqIds.has(faq.id);
              return (
                <div key={faq.id} className="border-b border-neutral-200 last:border-b-0">
                  {/* 질문 (클릭 가능) */}
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full px-4 sm:px-6 py-4 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors duration-200"
                  >
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-1 leading-tight">
                        {faq.question}
                      </h3>
                      {faq.category_name && (
                        <span className="inline-block text-xs sm:text-sm text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full mt-1">
                          {faq.category_name}
                        </span>
                      )}
                    </div>
                    <FaChevronDown
                      className={`text-neutral-500 text-lg sm:text-xl transition-transform duration-200 flex-shrink-0 ml-2 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* 답변 (접힘/펼침) */}
                  {isOpen && (
                    <div className="px-4 sm:px-6 py-4 bg-neutral-50 border-t border-neutral-200">
                      <div className="text-sm sm:text-base text-neutral-700 leading-relaxed whitespace-pre-wrap">
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <div className="text-neutral-500">
                {search ? (
                  <>
                    <FaQuestionCircle className="text-4xl mx-auto mb-4 opacity-50" />
                    <p className="text-base sm:text-lg mb-2">검색 결과가 없습니다</p>
                    <p className="text-xs sm:text-sm">다른 검색어로 다시 시도해보세요.</p>
                  </>
                ) : (
                  <>
                    <FaQuestionCircle className="text-4xl mx-auto mb-4 opacity-50" />
                    <p className="text-base sm:text-lg mb-2">해당 카테고리에 등록된 FAQ가 없습니다</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {!loading && !error && totalPages >= 1 && (
          <div className="mt-6 sm:mt-8 flex items-center justify-center">
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* << 첫 페이지 */}
              {currentPage > 1 ? (
                <Link
                  to={`/faq?page=1${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(1);
                    updateURL({ search, category_id: selectedCategory, page: 1 });
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
                  to={`/faq?page=${currentPage - 1}${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    updateURL({ search, category_id: selectedCategory, page: newPage });
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
                    to={`/faq?page=${pageNum}${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(pageNum);
                      updateURL({ search, category_id: selectedCategory, page: pageNum });
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
                  to={`/faq?page=${currentPage + 1}${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    updateURL({ search, category_id: selectedCategory, page: newPage });
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
                  to={`/faq?page=${totalPages}${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(totalPages);
                    updateURL({ search, category_id: selectedCategory, page: totalPages });
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
      </div>
    </div>
  );
}

