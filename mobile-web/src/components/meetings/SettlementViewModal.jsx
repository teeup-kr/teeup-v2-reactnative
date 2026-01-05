import React, { useEffect, useState, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';
import { roundsApi } from '../../lib/api';

const SettlementViewModal = ({ meetingId, meetingType, participants: rawParticipants = [], isOpen, onClose }) => {
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOtherExpenseDetailModal, setShowOtherExpenseDetailModal] = useState(false);

  // 참가자 목록 변환
  const participants = React.useMemo(() => {
    return (rawParticipants || []).map((p) => ({
      id: p.user_id || p.id,
      name: p.user_name || p.name || p.nickname,
      email: p.user_email || p.email,
      role: p.role,
    }));
  }, [rawParticipants]);

  // 역할 한글 변환 함수
  const getRoleLabel = (role) => {
    const roleMap = {
      ORGANIZER: '개설자',
      PARTICIPANT: '참가자',
      CO_ORGANIZER: '공동 주최자',
    };
    return roleMap[role] || role;
  };

  // 정산 정보 조회
  const fetchSettlement = useCallback(async () => {
    if (!meetingId || !isOpen) return;
    try {
      setLoading(true);
      setError(null);
      const response = await roundsApi.getMeetingSettlement(meetingId);
      const settlementData = response.data?.settlement || response.settlement || response.data || response;
      setSettlement(settlementData);
    } catch (err) {
      if (err?.response?.status !== 404) {
        console.error('정산 조회 실패:', err);
        setError('정산 정보를 불러오는데 실패했습니다.');
      }
      setSettlement(null);
    } finally {
      setLoading(false);
    }
  }, [meetingId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchSettlement();
    } else {
      setSettlement(null);
      setError(null);
    }
  }, [isOpen, fetchSettlement]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900">정산 상세보기</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 transition-colors hover:text-neutral-600 p-1 sm:p-2"
          >
            <FaTimes className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
              <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-neutral-500">정산 정보를 불러오는 중...</span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4 text-xs sm:text-sm text-red-700">
              <p>{error}</p>
            </div>
          ) : !settlement ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-xs sm:text-sm text-neutral-500">정산 정보가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* 정산 정보 요약 */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
                <h4 className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium text-blue-900">정산 정보</h4>
                <div className="space-y-1 text-xs sm:text-sm text-blue-700">
                  <p>
                    총 비용: {settlement.total_cost ? Number(settlement.total_cost).toLocaleString() : 0}원
                  </p>
                  {settlement.total_participants > 0 && (
                    <>
                      <p>정산 대상자: {settlement.total_participants}명</p>
                      <p>
                        인당 비용:{' '}
                        {settlement.amount_per_person
                          ? Number(settlement.amount_per_person).toLocaleString()
                          : 0}
                        원
                      </p>
                    </>
                  )}
                  {settlement.notes && (
                    <p className="mt-2 text-xs text-blue-600">비고: {settlement.notes}</p>
                  )}
                </div>
              </div>

              {meetingType === 'ROUND' ? (
                /* 라운딩 정산 상세 */
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h4 className="mb-3 sm:mb-4 text-sm sm:text-base font-medium text-neutral-900">비용 정보</h4>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-neutral-700">
                          전체 비용 (원)
                        </label>
                        <div className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-neutral-900">
                          {settlement.total_cost ? Number(settlement.total_cost).toLocaleString() : 0}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-neutral-700">
                          그린피 (원)
                        </label>
                        <div className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-neutral-900">
                          {settlement.green_fee ? Number(settlement.green_fee).toLocaleString() : 0}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-neutral-700">
                          캐디피 (원)
                        </label>
                        <div className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-neutral-900">
                          {settlement.caddy_fee ? Number(settlement.caddy_fee).toLocaleString() : 0}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-neutral-700">
                          카트비 (원)
                        </label>
                        <div className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-neutral-900">
                          {settlement.cart_fee ? Number(settlement.cart_fee).toLocaleString() : 0}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
                          <label className="block text-xs sm:text-sm font-medium text-neutral-700">
                            기타 비용 (원)
                          </label>
                          {settlement.other_fee > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowOtherExpenseDetailModal(true)}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                              상세보기
                            </button>
                          )}
                        </div>
                        <div className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-neutral-900">
                          {settlement.other_fee ? Number(settlement.other_fee).toLocaleString() : 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 sm:mb-4 text-sm sm:text-base font-medium text-neutral-900">정산 대상자</h4>
                    <div className="space-y-2">
                      {settlement.participants?.filter((p) => p.is_settlement_target !== false).length > 0 ? (
                        settlement.participants
                          .filter((p) => p.is_settlement_target !== false)
                          .map((participant) => (
                            <div
                              key={participant.user_id || participant.id}
                              className="flex items-center space-x-2 sm:space-x-3 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 sm:p-3"
                            >
                              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary-100 text-xs sm:text-sm font-semibold text-primary-700">
                                {(participant.user_name || participant.name)?.charAt(0) || '?'}
                              </div>
                              <div>
                                <span className="text-xs sm:text-sm font-medium text-neutral-900">
                                  {participant.user_name || participant.name}
                                </span>
                                {participant.role && (
                                  <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs text-neutral-500">
                                    ({getRoleLabel(participant.role)})
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-xs sm:text-sm text-neutral-500">정산 대상자가 없습니다.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-neutral-700">기타 사항</label>
                    <div className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-neutral-900 whitespace-pre-line min-h-[60px] sm:min-h-[80px]">
                      {settlement.notes || ''}
                    </div>
                  </div>

                  {settlement.total_participants > 0 && settlement.total_cost > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
                      <h5 className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium text-blue-900">정산 요약</h5>
                      <p className="text-xs sm:text-sm text-blue-700">
                        총 비용: {Number(settlement.total_cost).toLocaleString()}원
                        <br />
                        정산 대상자: {settlement.total_participants}명
                        <br />
                        인당 비용: {settlement.amount_per_person ? Number(settlement.amount_per_person).toLocaleString() : 0}원
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* 소셜 정산 상세 */
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-neutral-700">총 비용 (원)</label>
                    <div className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-neutral-900">
                      {settlement.total_cost ? Number(settlement.total_cost).toLocaleString() : 0}
                    </div>
                  </div>

                  {(settlement.expense_items || []).length > 0 && (
                    <div>
                      <h4 className="mb-3 sm:mb-4 text-sm sm:text-base font-medium text-neutral-900">비용 항목</h4>
                      <div className="space-y-3 sm:space-y-4">
                        {settlement.expense_items.map((item, index) => (
                          <div key={index} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
                            <div className="mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                              <div className="flex-1">
                                <p className="text-xs sm:text-sm font-medium text-neutral-900">{item.title || '제목 없음'}</p>
                              </div>
                              <div className="w-24 sm:w-32">
                                <p className="text-xs sm:text-sm font-semibold text-neutral-900">
                                  {item.amount ? Number(item.amount).toLocaleString() : 0}원
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:mt-3">
                              <p className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-medium text-neutral-600">정산 대상자 선택</p>
                              <div className="space-y-1.5 sm:space-y-2 min-h-[60px] rounded-lg border border-neutral-200 bg-white p-2.5 sm:p-3">
                                {participants.length === 0 ? (
                                  <p className="text-[10px] sm:text-xs text-neutral-500">참가자 목록을 불러오는 중...</p>
                                ) : (
                                  participants.map((participant) => (
                                    <div key={participant.id} className="flex items-center space-x-1.5 sm:space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={(item.participants || []).includes(participant.id)}
                                        disabled
                                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-neutral-300 text-primary-600 cursor-not-allowed"
                                      />
                                      <span className="text-xs sm:text-sm text-neutral-700">
                                        {participant.name || participant.email || '알 수 없음'}
                                        {participant.role && (
                                          <span className="ml-1 text-[10px] sm:text-xs text-neutral-500">
                                            ({getRoleLabel(participant.role)})
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-neutral-700">기타 사항</label>
                    <div className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-neutral-900 whitespace-pre-line min-h-[60px] sm:min-h-[80px]">
                      {settlement.notes || ''}
                    </div>
                  </div>

                  {settlement.exclude_remaining_amount !== undefined && (
                    <div>
                      <label className="flex items-center space-x-1.5 sm:space-x-2 mb-2 cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={settlement.exclude_remaining_amount}
                          disabled
                          className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-neutral-300 text-primary-600 cursor-not-allowed"
                        />
                        <span className="text-xs sm:text-sm font-medium text-neutral-700">나머지 금액 정산 제외</span>
                      </label>
                    </div>
                  )}

                  {settlement.total_participants > 0 && settlement.total_cost > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
                      <h5 className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium text-blue-900">정산 요약</h5>
                      <p className="text-xs sm:text-sm text-blue-700">
                        총 비용: {Number(settlement.total_cost).toLocaleString()}원
                        <br />
                        정산 대상자: {settlement.total_participants}명
                        <br />
                        인당 비용: {settlement.amount_per_person ? Number(settlement.amount_per_person).toLocaleString() : 0}원
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 sm:gap-3 border-t border-neutral-200 px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            닫기
          </button>
        </div>
      </div>

      {/* 기타 비용 상세보기 모달 */}
      {showOtherExpenseDetailModal && settlement && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 sm:px-6 sm:py-4 rounded-t-2xl">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900">기타 비용 상세</h2>
              <button
                type="button"
                onClick={() => setShowOtherExpenseDetailModal(false)}
                className="rounded-lg p-1.5 sm:p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              >
                <FaTimes className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* 본문 */}
            <div className="px-4 py-4 sm:px-6 sm:py-6">
              {(() => {
                // 정산 데이터에서 기타 비용 항목 추출
                let otherExpenseItems = [];
                if (settlement.other_expense_items && Array.isArray(settlement.other_expense_items)) {
                  otherExpenseItems = settlement.other_expense_items.map((item) => ({
                    title: item.title || '',
                    amount: item.amount || 0,
                    participants: item.participants || [],
                  }));
                } else if (settlement.other_fee && settlement.other_fee > 0) {
                  // 기존 구조에서 기타 비용이 있으면 항목으로 변환
                  const allTargets =
                    settlement.settlement_targets ||
                    settlement.participants?.filter((p) => p.is_settlement_target !== false).map((p) => p.user_id) ||
                    [];
                  otherExpenseItems = [
                    {
                      title: '기타 비용',
                      amount: settlement.other_fee,
                      participants: allTargets,
                    },
                  ];
                }

                if (otherExpenseItems.length === 0) {
                  return (
                    <p className="text-sm text-neutral-500 text-center py-8">기타 비용 항목이 없습니다.</p>
                  );
                }

                return (
                  <div className="space-y-4">
                    {otherExpenseItems.map((item, index) => {
                      const itemParticipants = item.participants || [];
                      const participantNames = participants
                        .filter((p) => itemParticipants.includes(p.id))
                        .map((p) => p.name || p.email || '알 수 없음');
                      
                      return (
                        <div key={index} className="rounded-lg border border-neutral-200 p-4">
                          <div className="mb-3">
                            <h5 className="text-sm font-semibold text-neutral-900 mb-1">
                              {item.title || `항목 ${index + 1}`}
                            </h5>
                            <p className="text-base font-bold text-primary-600">
                              {item.amount.toLocaleString()}원
                            </p>
                          </div>
                          <div className="mt-3 pt-3 border-t border-neutral-200">
                            <p className="text-xs font-medium text-neutral-600 mb-2">
                              정산 대상자 ({participantNames.length}명)
                            </p>
                            <div className="space-y-1">
                              {participantNames.length === 0 ? (
                                <p className="text-xs text-neutral-400">정산 대상자가 없습니다.</p>
                              ) : (
                                participantNames.map((name, idx) => (
                                  <p key={idx} className="text-xs text-neutral-700">
                                    • {name}
                                  </p>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-4 pt-4 border-t-2 border-neutral-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-neutral-900">총 합계</span>
                        <span className="text-lg font-bold text-primary-600">
                          {otherExpenseItems.reduce(
                            (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
                            0
                          ).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementViewModal;

