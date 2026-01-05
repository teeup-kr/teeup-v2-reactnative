import React, { useEffect, useState } from 'react';
import { roundsApi } from '../../lib/api';

const MySettlementView = ({ meetingId }) => {
  const [mySettlement, setMySettlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMySettlement = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await roundsApi.getMySettlement(meetingId);
        console.log('내 정산 조회 응답:', response);
        // API 응답 구조 확인: response.data 또는 response 자체
        const data = response?.data || response;
        console.log('내 정산 데이터:', data);
        setMySettlement(data);
      } catch (err) {
        console.error('내 정산 조회 실패:', err);
        console.error('에러 상세:', err?.response);
        // 404 에러는 정산이 없는 것으로 처리
        if (err?.response?.status === 404) {
          setMySettlement(null);
          setError(null);
        } else {
          setError(err?.response?.data?.detail || '내 정산 정보를 불러오는데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (meetingId) {
      fetchMySettlement();
    }
  }, [meetingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 sm:p-8">
        <div className="text-xs sm:text-sm text-neutral-500">정산 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6 text-xs sm:text-sm text-red-700">
        <h3 className="text-sm sm:text-base font-semibold text-red-800">오류</h3>
        <p className="mt-1.5 sm:mt-2">{error}</p>
      </div>
    );
  }

  if (!mySettlement) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:p-6 text-xs sm:text-sm text-neutral-700">
        <p>정산 정보가 없습니다.</p>
      </div>
    );
  }

  const { total_amount_due = 0, items = [] } = mySettlement;
  
  // 정산 금액이 0이고 항목도 없으면 정산 대상자가 아님
  if (total_amount_due === 0 && items.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:p-6 text-xs sm:text-sm text-neutral-700">
        <p>정산 대상자가 아닙니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-neutral-900">내 정산 정보</h3>
        
        {/* 항목별 상세 */}
        {items && items.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h4 className="mb-3 sm:mb-4 text-sm sm:text-base font-medium text-neutral-900">항목별 상세</h4>
            <div className="space-y-3 sm:space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-neutral-200 bg-white p-4 sm:p-5"
                >
                  <div className="mb-3">
                    <div className="text-sm sm:text-base font-semibold text-neutral-900 mb-1">{item.name}</div>
                    <div className="text-xs sm:text-sm text-neutral-500">
                      총: {item.amount.toLocaleString()}원 / 정산 대상자: {item.participants_count}명
                    </div>
                  </div>
                  <div className="pt-3 border-t border-neutral-200">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-xs sm:text-sm text-neutral-600 mb-1">내가 부담하는 금액</div>
                        <div className="text-[10px] sm:text-xs text-neutral-400">
                          인당 {Math.round(item.amount / item.participants_count).toLocaleString()}원
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-primary-600">
                        {item.my_amount.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 총 납부 금액 요약 */}
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm sm:text-base font-medium text-primary-700">총 납부 금액</div>
            <div className="text-lg sm:text-xl font-bold text-primary-900">
              {total_amount_due.toLocaleString()}원
            </div>
          </div>
        </div>

        {items && items.length === 0 && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 sm:p-4 text-xs sm:text-sm text-neutral-600">
            납부해야 할 항목이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default MySettlementView;

