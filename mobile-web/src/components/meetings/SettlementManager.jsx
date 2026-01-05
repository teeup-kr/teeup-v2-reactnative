import React, { useCallback, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { roundsApi } from '../../lib/api';

// 라운딩 정산 폼 컴포넌트
const RoundingSettlementForm = ({
  roundingData,
  setRoundingData,
  participants,
  getRoleLabel,
  onSave,
  onCancel,
  loading,
  canManageSettlement,
  showOtherExpenseDetailModal,
  setShowOtherExpenseDetailModal,
}) => {

  // 필수 필드별 전체 선택 상태 관리
  const getSelectAll = (fieldName) => {
    const fieldParticipants = roundingData[`${fieldName}_participants`] || [];
    const currentExempted = roundingData[`${fieldName}_exempted`] || [];
    // 면제자를 제외한 참가자 ID 목록
    const availableParticipantIds = participants
      .filter((p) => !currentExempted.includes(p.id))
      .map((p) => p.id);
    // 면제자를 제외한 모든 참가자가 정산 대상자에 포함되어 있고, 정산 대상자가 면제자를 포함하지 않으면 전체 선택 상태
    return availableParticipantIds.length > 0 && 
      availableParticipantIds.every((id) => fieldParticipants.includes(id)) &&
      fieldParticipants.every((id) => !currentExempted.includes(id));
  };

  const toggleSelectAll = (fieldName) => {
    const allParticipantIds = participants.map((p) => p.id);
    const currentParticipants = roundingData[`${fieldName}_participants`] || [];
    const currentExempted = roundingData[`${fieldName}_exempted`] || [];
    // 면제자를 제외한 참가자 목록
    const availableParticipants = allParticipantIds.filter((id) => !currentExempted.includes(id));
    const isAllSelected = availableParticipants.length > 0 && 
      availableParticipants.every((id) => currentParticipants.includes(id));

    if (isAllSelected) {
      // 전체 선택 해제 - 드롭다운이 나타나도록 현재 상태 유지
      // 면제자를 제외한 모든 참가자를 정산 대상자로 유지 (드롭다운에서 선택 가능하도록)
      // 상태는 그대로 유지하되, 전체 선택 체크박스는 해제됨
      // 실제로는 상태 변경이 없지만, UI에서 !selectAll이 true가 되어 드롭다운이 나타남
      // 하지만 실제로는 availableParticipants를 유지하므로 상태가 변하지 않음
      // 따라서 일부 참가자를 제거해서 전체 선택 상태를 false로 만들어야 함
      // 예: 마지막 참가자 하나를 제거
      if (availableParticipants.length > 1) {
    setRoundingData((prev) => ({
      ...prev,
          [`${fieldName}_participants`]: availableParticipants.slice(0, -1),
        }));
      } else {
        // 참가자가 1명만 있으면 그대로 유지
        setRoundingData((prev) => ({
          ...prev,
          [`${fieldName}_participants`]: availableParticipants,
        }));
      }
    } else {
      // 전체 선택 - 면제자를 제외한 모든 참가자를 정산 대상자로 설정
      setRoundingData((prev) => ({
        ...prev,
        [`${fieldName}_participants`]: availableParticipants,
      }));
    }
  };

  const toggleFieldParticipant = (fieldName, participantId) => {
    setRoundingData((prev) => {
      const currentParticipants = prev[`${fieldName}_participants`] || [];
      const currentExempted = prev[`${fieldName}_exempted`] || [];
      
      // 면제자에서 제거하고 정산 대상자에 추가
      if (currentExempted.includes(participantId)) {
        return {
          ...prev,
          [`${fieldName}_exempted`]: currentExempted.filter((id) => id !== participantId),
          [`${fieldName}_participants`]: [...currentParticipants, participantId],
        };
      }
      
      // 정산 대상자에서 제거
      if (currentParticipants.includes(participantId)) {
        return {
          ...prev,
          [`${fieldName}_participants`]: currentParticipants.filter((id) => id !== participantId),
        };
      }
      
      // 새로 추가
      return {
        ...prev,
        [`${fieldName}_participants`]: [...currentParticipants, participantId],
      };
    });
  };

  const toggleFieldExempted = (fieldName, participantId) => {
    setRoundingData((prev) => {
      const currentParticipants = prev[`${fieldName}_participants`] || [];
      const currentExempted = prev[`${fieldName}_exempted`] || [];
      const allParticipantIds = participants.map((p) => p.id);
      
      // 면제자 토글
      if (currentExempted.includes(participantId)) {
        // 면제 해제 - 정산 대상자에 추가
        const newParticipants = [...currentParticipants, participantId];
        return {
          ...prev,
          [`${fieldName}_exempted`]: currentExempted.filter((id) => id !== participantId),
          [`${fieldName}_participants`]: newParticipants,
        };
      } else {
        // 면제 설정 - 정산 대상자에서 제거하고 면제자에 추가
        const newParticipants = currentParticipants.filter((id) => id !== participantId);
        
        // 정산 대상자가 비어있지 않도록 보장
        // 만약 정산 대상자가 비어있게 되면, 면제자가 아닌 다른 참가자를 자동으로 추가
        if (newParticipants.length === 0) {
          const remainingParticipants = allParticipantIds.filter(
            (id) => id !== participantId && !currentExempted.includes(id)
          );
          if (remainingParticipants.length > 0) {
            // 면제자가 아닌 첫 번째 참가자를 정산 대상자로 추가
            return {
              ...prev,
              [`${fieldName}_participants`]: [remainingParticipants[0]],
              [`${fieldName}_exempted`]: [...currentExempted, participantId],
            };
          }
        }
        
        return {
          ...prev,
          [`${fieldName}_participants`]: newParticipants,
          [`${fieldName}_exempted`]: [...currentExempted, participantId],
        };
      }
    });
  };

  // 기타 비용 항목 추가/삭제
  const addOtherExpenseItem = () => {
    setRoundingData((prev) => ({
      ...prev,
      other_expense_items: [...(prev.other_expense_items || []), { title: '', amount: 0, participants: [] }],
    }));
  };

  const removeOtherExpenseItem = (index) => {
    setRoundingData((prev) => ({
      ...prev,
      other_expense_items: (prev.other_expense_items || []).filter((_, idx) => idx !== index),
    }));
  };

  const updateOtherExpenseItem = (index, field, value) => {
    setRoundingData((prev) => ({
      ...prev,
      other_expense_items: (prev.other_expense_items || []).map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const toggleOtherExpenseItemParticipant = (itemIndex, participantId) => {
    setRoundingData((prev) => {
      const items = prev.other_expense_items || [];
      return {
        ...prev,
        other_expense_items: items.map((item, idx) => {
          if (idx !== itemIndex) return item;
          const participants = item.participants || [];
          const updatedParticipants = participants.includes(participantId)
            ? participants.filter((id) => id !== participantId)
            : [...participants, participantId];
          return { ...item, participants: updatedParticipants };
        }),
      };
    });
  };

  // 전체 비용 검증: 전체 비용 >= (그린피 + 캐디피 + 카트비 + 기타 비용 합계)
  const otherExpenseTotal = (roundingData.other_expense_items || []).reduce(
    (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
    0
  );
  const totalOtherCosts =
    (roundingData.green_fee || 0) +
    (roundingData.caddy_fee || 0) +
    (roundingData.cart_fee || 0) +
    otherExpenseTotal;
  
  // 총 비용 자동 계산 (그린피 + 카트비 + 캐디피 + 기타비용)
  useEffect(() => {
    setRoundingData((prev) => ({
      ...prev,
      total_cost: totalOtherCosts,
    }));
  }, [totalOtherCosts, setRoundingData]);
  
  // 총 비용은 자동 계산되므로 검증 불필요
  const isTotalCostValid = true;
  const costValidationError = null;
  // 총 비용이 자동 계산되므로 체크박스 불필요
  const shouldShowExcludeCheckbox = false;

  // 필수 필드 검증 (총비용, 그린피, 카트비, 캐디피)
  const hasAllRequiredFields = 
    roundingData.total_cost !== null && roundingData.total_cost !== undefined &&
    roundingData.green_fee !== null && roundingData.green_fee !== undefined &&
    roundingData.cart_fee !== null && roundingData.cart_fee !== undefined &&
    roundingData.caddy_fee !== null && roundingData.caddy_fee !== undefined;

  // 필수 필드별 정산 대상자 확인 (회비 처리되지 않은 경우만)
  const needsGreenFeeParticipants = !roundingData.all_covered_by_fee && !roundingData.green_fee_covered_by_fee;
  const needsCartFeeParticipants = !roundingData.all_covered_by_fee && !roundingData.cart_fee_covered_by_fee;
  const needsCaddyFeeParticipants = !roundingData.all_covered_by_fee && !roundingData.caddy_fee_covered_by_fee;
  
  const hasAllRequiredParticipants =
    (!needsGreenFeeParticipants || (roundingData.green_fee_participants || []).length > 0) &&
    (!needsCartFeeParticipants || (roundingData.cart_fee_participants || []).length > 0) &&
    (!needsCaddyFeeParticipants || (roundingData.caddy_fee_participants || []).length > 0);

  // 기타 비용 항목 검증 (모두 회비에서 처리되지 않은 경우만)
  const hasEmptyOtherExpenseParticipants = !roundingData.all_covered_by_fee && (roundingData.other_expense_items || []).some(
    (item) => !item.participants || item.participants.length === 0
  );

  // 필수 필드 렌더링 헬퍼 함수
  const renderRequiredField = (fieldName, label, placeholder, showParticipantSelection = true) => {
    const value = roundingData[fieldName] ?? '';
    const fieldParticipants = roundingData[`${fieldName}_participants`] || [];
    const selectAll = getSelectAll(fieldName);
    
    // 그린피, 캐디피, 카트비는 meeting 데이터에서 가져온 값이므로 비활성화
    // 모두 회비에서 처리 선택 시 모든 필드 비활성화
    const isDisabled = ['green_fee', 'caddy_fee', 'cart_fee'].includes(fieldName) || roundingData.all_covered_by_fee;

  return (
      <div className="space-y-3">
      <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">{label} (원)</label>
            <input
            type="text"
            inputMode="numeric"
            value={value ?? ''}
            disabled={isDisabled}
            onKeyPress={(e) => {
              if (isDisabled) {
                e.preventDefault();
                return;
              }
              const char = String.fromCharCode(e.which);
              if (
                !/[0-9]/.test(char) &&
                !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
                  e.key
                )
              ) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              if (isDisabled) return;
              let inputValue = e.target.value;
              inputValue = inputValue.replace(/[^0-9]/g, '');
              // 맨 첫 자리에 0이 오는 것 방지 (010000 같은 경우)
              if (inputValue.length > 1 && inputValue.startsWith('0')) {
                inputValue = inputValue.replace(/^0+/, '') || '0';
              }
              // 빈 문자열이면 null로 설정 (필수 필드 검증을 위해)
              const numValue = inputValue === '' ? null : parseInt(inputValue, 10) || 0;
                setRoundingData((prev) => ({
                  ...prev,
                [fieldName]: numValue,
              }));
            }}
            placeholder={placeholder}
              className={`block w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 ${
                isDisabled ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : ''
              }`}
            />
          </div>
        {showParticipantSelection && (
          <div>
            {/* 라디오 버튼 영역 (그린피, 캐디피, 카트비만) - 컨테이너 외부 */}
            {['green_fee', 'caddy_fee', 'cart_fee'].includes(fieldName) && (
              <div className="mb-3 flex items-center gap-4">
                <label className={`flex items-center space-x-2 ${roundingData.all_covered_by_fee ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name={`${fieldName}_fee_option`}
                    checked={!roundingData[`${fieldName}_covered_by_fee`]}
                    onChange={() => {
                      const allParticipantIds = participants.map((p) => p.id);
                      setRoundingData((prev) => ({
                        ...prev,
                        [`${fieldName}_covered_by_fee`]: false,
                        // 정산 필요 선택 시 기본적으로 전체 참가자를 정산 대상자로 설정
                        [`${fieldName}_participants`]: prev[`${fieldName}_participants`]?.length > 0 
                          ? prev[`${fieldName}_participants`] 
                          : allParticipantIds,
                      }));
                    }}
                    disabled={roundingData.all_covered_by_fee}
                    className="h-4 w-4 border-neutral-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-neutral-700">정산 필요</span>
                </label>
                <label className={`flex items-center space-x-2 ${roundingData.all_covered_by_fee ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name={`${fieldName}_fee_option`}
                    checked={roundingData[`${fieldName}_covered_by_fee`] || false}
                    onChange={() => {
                      setRoundingData((prev) => ({
                        ...prev,
                        [`${fieldName}_covered_by_fee`]: true,
                        // 항목 회비에서 처리 선택 시 participants와 exempted 초기화
                        [`${fieldName}_participants`]: [],
                        [`${fieldName}_exempted`]: [],
                      }));
                    }}
                    disabled={roundingData.all_covered_by_fee}
                    className="h-4 w-4 border-neutral-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-neutral-700">항목 회비에서 처리</span>
                </label>
              </div>
            )}
            
            {/* 정산 대상자 선택 컨테이너 - 항목 회비에서 처리 선택 시 숨김 */}
            {!roundingData[`${fieldName}_covered_by_fee`] && (
              <>
                <label className="mb-2 block text-sm font-medium text-neutral-700">정산 대상자 선택</label>
                <div className={`space-y-2 min-h-[60px] rounded-lg border border-neutral-200 bg-neutral-50 p-3 ${roundingData.all_covered_by_fee ? 'opacity-50 pointer-events-none' : ''}`}>
                  <label className={`flex items-center space-x-2 ${roundingData.all_covered_by_fee ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white p-1 rounded'}`}>
            <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={() => toggleSelectAll(fieldName)}
                      disabled={roundingData.all_covered_by_fee}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-medium text-neutral-700">전체 선택</span>
                  </label>
              {!selectAll && (
                <div className="mt-2">
                  <select
                    multiple
                    value={fieldParticipants.map(String)}
                    onChange={(e) => {
                      if (roundingData.all_covered_by_fee) return;
                      const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
                      const selectedIds = selectedOptions.map((val) => parseInt(val, 10));
                      
                      setRoundingData((prev) => {
                        const currentExempted = prev[`${fieldName}_exempted`] || [];
                        const allParticipantIds = participants.map((p) => p.id);
                        
                        // 드롭다운에서 선택된 항목은 정산 대상자에 포함되므로 면제자에서 제거
                        const newExempted = currentExempted.filter((id) => !selectedIds.includes(id));
                        
                        // 정산 대상자가 비어있지 않도록 보장
                        let finalParticipants = selectedIds;
                        if (selectedIds.length === 0) {
                          // 선택된 항목이 없으면, 면제자가 아닌 모든 참가자를 정산 대상자로 설정
                          finalParticipants = allParticipantIds.filter((id) => !newExempted.includes(id));
                        }
                        
                        return {
                          ...prev,
                          [`${fieldName}_participants`]: finalParticipants,
                          [`${fieldName}_exempted`]: newExempted,
                        };
                      });
                    }}
                    disabled={roundingData.all_covered_by_fee}
                    className={`block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 min-h-[120px] ${roundingData.all_covered_by_fee ? 'opacity-50 cursor-not-allowed' : ''}`}
                    size={Math.min(participants.length, 6)}
                  >
                    {participants.map((participant) => {
                      const isExempted = (roundingData[`${fieldName}_exempted`] || []).includes(participant.id);
                      const isSelected = fieldParticipants.includes(participant.id);
                      return (
                        <option
                          key={participant.id}
                          value={String(participant.id)}
                          disabled={isExempted}
                          className={isExempted ? 'text-orange-600 bg-orange-50' : ''}
                        >
                          {participant.name || participant.email || '알 수 없음'}
                          {participant.role && ` (${getRoleLabel(participant.role)})`}
                          {isExempted && ' [면제]'}
                        </option>
                      );
                    })}
                  </select>
                  <div className="mt-2">
                    <p className="mb-2 text-xs font-medium text-neutral-600">면제자 선택</p>
                    <div className="space-y-1 max-h-[100px] overflow-y-auto">
                      {participants.map((participant) => {
                        const isExempted = (roundingData[`${fieldName}_exempted`] || []).includes(participant.id);
                        return (
                          <label
                            key={participant.id}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={isExempted}
                              onChange={() => {
                                if (roundingData.all_covered_by_fee) return;
                                toggleFieldExempted(fieldName, participant.id);
                              }}
                              disabled={roundingData.all_covered_by_fee}
                              className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="text-sm text-neutral-700">
                              {participant.name || participant.email || '알 수 없음'}
                              {participant.role && (
                                <span className="ml-1 text-xs text-neutral-500">({getRoleLabel(participant.role)})</span>
                              )}
                            </span>
                          </label>
                        );
                      })}
          </div>
                  </div>
                  <div className="mt-2 text-xs text-neutral-600">
                    정산 대상자: {fieldParticipants.length}명
                    {(roundingData[`${fieldName}_exempted`] || []).length > 0 && (
                      <span className="ml-2 text-orange-600">
                        면제자: {(roundingData[`${fieldName}_exempted`] || []).length}명
                      </span>
                    )}
                  </div>
                </div>
              )}
                </div>
                </>
              )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
          <div>
        <h4 className="mb-4 text-md font-medium text-neutral-900">비용 정보</h4>
        <div className="space-y-6">
          {renderRequiredField('green_fee', '그린피', '그린피를 입력하세요')}
          {renderRequiredField('cart_fee', '카트비', '카트비를 입력하세요')}
          {renderRequiredField('caddy_fee', '캐디피', '캐디피를 입력하세요')}
          </div>
        {costValidationError && <p className="mt-2 text-xs text-red-500">{costValidationError}</p>}
      </div>

          <div>
        <div className="mb-4 flex items-center gap-3">
          <h4 className="text-md font-medium text-neutral-900">기타 비용</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">
              {otherExpenseTotal > 0 ? `${otherExpenseTotal.toLocaleString()}원` : '0원'}
            </span>
            <button
              type="button"
              onClick={addOtherExpenseItem}
              disabled={roundingData.all_covered_by_fee}
              className="rounded bg-green-600 px-2.5 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              항목 추가
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {(roundingData.other_expense_items || []).map((item, index) => (
            <div key={index} className="rounded-lg border border-neutral-200 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex-1">
            <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      if (roundingData.all_covered_by_fee) return;
                      updateOtherExpenseItem(index, 'title', e.target.value);
                    }}
                    disabled={roundingData.all_covered_by_fee}
                    placeholder="비용 항목명"
                    className={`block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 ${roundingData.all_covered_by_fee ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : ''}`}
            />
          </div>
                <div className="w-32">
            <input
                    type="text"
                    inputMode="numeric"
                    value={item.amount === 0 ? '' : item.amount}
                    onKeyPress={(e) => {
                      if (roundingData.all_covered_by_fee) {
                        e.preventDefault();
                        return;
                      }
                      const char = String.fromCharCode(e.which);
                      if (
                        !/[0-9]/.test(char) &&
                        !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
                          e.key
                        )
                      ) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      if (roundingData.all_covered_by_fee) return;
                      let value = e.target.value;
                      value = value.replace(/[^0-9]/g, '');
                      if (value.length > 1 && value.startsWith('0')) {
                        value = value.replace(/^0+/, '') || '0';
                      }
                      const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
                      updateOtherExpenseItem(index, 'amount', numValue);
                    }}
                    disabled={roundingData.all_covered_by_fee}
                    placeholder="금액"
                    className={`block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 ${roundingData.all_covered_by_fee ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : ''}`}
            />
          </div>
                <button
                  type="button"
                  onClick={() => {
                    if (roundingData.all_covered_by_fee) return;
                    removeOtherExpenseItem(index);
                  }}
                  disabled={roundingData.all_covered_by_fee}
                  className="text-red-500 transition-colors hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✕
                </button>
        </div>
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium text-neutral-600">정산 대상자 선택</p>
                <div className="space-y-2 min-h-[60px] rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  {participants.length === 0 ? (
                    <p className="text-xs text-neutral-500">참가자 목록을 불러오는 중...</p>
                  ) : (
                    <>
                      {(() => {
                        const itemParticipants = item.participants || [];
                        const allParticipantIds = participants.map((p) => p.id);
                        const isAllSelected = allParticipantIds.length > 0 && 
                          allParticipantIds.every((id) => itemParticipants.includes(id));
                        
                        return (
                          <label className={`flex items-center space-x-2 ${roundingData.all_covered_by_fee ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white p-1 rounded'}`}>
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={() => {
                                if (roundingData.all_covered_by_fee) return;
                                if (isAllSelected) {
                                  // 전체 선택 해제 - 빈 배열로 설정
                                  updateOtherExpenseItem(index, 'participants', []);
                                } else {
                                  // 전체 선택 - 모든 참가자 ID 추가
                                  updateOtherExpenseItem(index, 'participants', allParticipantIds);
                                }
                              }}
                              disabled={roundingData.all_covered_by_fee}
                              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="text-sm font-medium text-neutral-700">전체 선택</span>
                          </label>
                        );
                      })()}
                      {(() => {
                        const itemParticipants = item.participants || [];
                        const allParticipantIds = participants.map((p) => p.id);
                        const isAllSelected = allParticipantIds.length > 0 && 
                          allParticipantIds.every((id) => itemParticipants.includes(id));
                        
                        return !isAllSelected ? (
                          <div className="mt-2">
                            {participants.map((participant) => (
                              <label
                                key={participant.id}
                                className={`flex items-center space-x-2 ${roundingData.all_covered_by_fee ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white p-1 rounded'}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={(itemParticipants || []).includes(participant.id)}
                                  onChange={() => {
                                    if (roundingData.all_covered_by_fee) return;
                                    toggleOtherExpenseItemParticipant(index, participant.id);
                                  }}
                                  disabled={roundingData.all_covered_by_fee}
                                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <span className="text-sm text-neutral-700">
                                  {participant.name || participant.email || '알 수 없음'}
                                  {participant.role && (
                                    <span className="ml-1 text-xs text-neutral-500">({getRoleLabel(participant.role)})</span>
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {shouldShowExcludeCheckbox && (
        <div>
          <label className={`flex items-center space-x-2 mb-2 ${roundingData.all_covered_by_fee ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={roundingData.exclude_remaining_amount}
              onChange={(e) => {
                if (roundingData.all_covered_by_fee) return;
                setRoundingData((prev) => ({
                  ...prev,
                  exclude_remaining_amount: e.target.checked,
                }));
              }}
              disabled={roundingData.all_covered_by_fee}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm font-medium text-neutral-700">나머지 회비에서 처리</span>
          </label>
          <p className="text-xs text-neutral-500 ml-6 mb-2">
            총 비용이 그린피, 카트비, 캐디피, 기타비용 합계보다 작은 경우, 나머지 금액은 회비 등으로 처리됩니다.
          </p>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">기타 사항</label>
        <textarea
          value={roundingData.notes || ''}
          onChange={(e) => {
            if (roundingData.all_covered_by_fee) return;
            setRoundingData((prev) => ({
              ...prev,
              notes: e.target.value,
            }));
          }}
          disabled={roundingData.all_covered_by_fee}
          rows={3}
          placeholder="특이사항이나 기록할 것들을 입력하세요"
          className={`block w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 ${roundingData.all_covered_by_fee ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : ''}`}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">총 비용</label>
        <div className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2">
          <p className="text-sm font-semibold text-neutral-900">
            {totalOtherCosts.toLocaleString()}원
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            (그린피 + 카트비 + 캐디피 + 기타비용 자동 계산)
          </p>
        </div>
      </div>

      {(() => {
        // 전체 정산 대상자 수집 (면제자 제외, 총 비용 제외)
        const allParticipants = new Set();
        [
          ...(roundingData.green_fee_participants || []),
          ...(roundingData.cart_fee_participants || []),
          ...(roundingData.caddy_fee_participants || []),
        ].forEach((id) => allParticipants.add(id));
        (roundingData.other_expense_items || []).forEach((item) => {
          (item.participants || []).forEach((id) => {
            if (id !== 'UNSETTLED') allParticipants.add(id);
          });
        });
        
        // 전체 면제자 수집 (총 비용 제외, 중복 제거)
        const allExempted = new Set();
        [
          ...(roundingData.green_fee_exempted || []),
          ...(roundingData.cart_fee_exempted || []),
          ...(roundingData.caddy_fee_exempted || []),
        ].forEach((id) => allExempted.add(id));
        
        const participantCount = allParticipants.size;
        const exemptedCount = allExempted.size;
        const totalCost = totalOtherCosts;

        if (participantCount > 0 && totalCost > 0) {
          // 회비 처리된 항목 확인
          const coveredItems = [];
          if (roundingData.green_fee_covered_by_fee && roundingData.green_fee > 0) {
            coveredItems.push('그린피');
          }
          if (roundingData.caddy_fee_covered_by_fee && roundingData.caddy_fee > 0) {
            coveredItems.push('캐디피');
          }
          if (roundingData.cart_fee_covered_by_fee && roundingData.cart_fee > 0) {
            coveredItems.push('카트비');
          }
          const allCoveredByFee = roundingData.all_covered_by_fee || false;
          
          return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h5 className="mb-2 text-sm font-medium text-blue-900">정산 요약</h5>
          <p className="text-sm text-blue-700">
                총 비용: {totalCost.toLocaleString()}원
            <br />
                정산 대상자: {participantCount}명
                {exemptedCount > 0 && (
                  <>
            <br />
                    면제자: {exemptedCount}명
                  </>
                )}
                {!allCoveredByFee && (
                  <>
                    <br />
                    인당 비용: {Math.round(totalCost / participantCount).toLocaleString()}원
                  </>
                )}
                {allCoveredByFee && (
                  <>
                    <br />
                    <span className="text-blue-800 font-semibold">모든 비용이 회비에서 처리됩니다.</span>
                  </>
                )}
                {coveredItems.length > 0 && !allCoveredByFee && (
                  <>
                    <br />
                    <span className="text-blue-800">회비 처리 항목: {coveredItems.join(', ')}</span>
                  </>
                )}
          </p>
          <p className="mt-2 text-xs text-blue-600">
            * 요약 정보이며, 개별 정산비용은 참가자마다 상이할 수 있음을 알려드립니다.
          </p>
        </div>
          );
        }
        return null;
      })()}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={
            loading ||
            !canManageSettlement ||
            !hasAllRequiredFields ||
            !hasAllRequiredParticipants ||
            hasEmptyOtherExpenseParticipants ||
            !isTotalCostValid
          }
          className="rounded-lg bg-primary-600 px-4 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '생성 중...' : '정산 생성'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-neutral-100 px-4 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
        >
          취소
        </button>
      </div>
    </div>
  );
};

// 소셜 정산 폼 컴포넌트
const SocialSettlementForm = ({
  socialData,
  setSocialData,
  expenseItemErrors,
  setExpenseItemErrors,
  participants,
  getRoleLabel,
  onSave,
  onCancel,
  loading,
  canManageSettlement,
}) => {
  const addExpenseItem = () => {
    setSocialData((prev) => ({
      ...prev,
      expense_items: [...prev.expense_items, { title: '', amount: 0, participants: [] }],
    }));
  };

  const removeExpenseItem = (index) => {
    setSocialData((prev) => {
      const newItems = prev.expense_items.filter((_, idx) => idx !== index);
      const totalCost = prev.total_cost || 0;
      const errors = {};
      if (totalCost > 0) {
        newItems.forEach((item, idx) => {
          const otherItemsSum = newItems.reduce((sum, itm, idx2) => {
            if (idx2 !== idx) {
              return sum + (Number.isFinite(itm.amount) ? itm.amount : 0);
            }
            return sum;
          }, 0);
          if (item.amount + otherItemsSum > totalCost) {
            const maxAllowed = Math.max(0, totalCost - otherItemsSum);
            errors[idx] = `비용 항목의 합계가 총 비용(${totalCost.toLocaleString()}원)을 초과할 수 없습니다. 최대 입력 가능 금액: ${maxAllowed.toLocaleString()}원`;
          }
        });
      }
      setExpenseItemErrors(errors);
      return {
        ...prev,
        expense_items: newItems,
      };
    });
  };

  const updateExpenseItem = (index, field, value) => {
    setSocialData((prev) => ({
      ...prev,
      expense_items: prev.expense_items.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    }));
  };

  const toggleExpenseItemParticipant = (itemIndex, participantId) => {
    setSocialData((prev) => ({
      ...prev,
      expense_items: prev.expense_items.map((item, idx) => {
        if (idx !== itemIndex) return item;
        const participants = item.participants || [];
        const updatedParticipants = participants.includes(participantId)
          ? participants.filter((id) => id !== participantId)
          : [...participants, participantId];
        return { ...item, participants: updatedParticipants };
      }),
    }));
  };

  const totalSocialCost = socialData.expense_items.reduce(
    (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
    0,
  );

  const allParticipants = new Set();
  socialData.expense_items.forEach((item) => {
    (item.participants || []).forEach((participantId) => {
      if (participantId !== 'UNSETTLED') {
        allParticipants.add(participantId);
      }
    });
  });
  const participantCount = allParticipants.size;
  const hasEmptyParticipants = socialData.expense_items.some(
    (item) => !item.participants || item.participants.length === 0
  );
  const totalCost = socialData.total_cost || totalSocialCost;
  const remainingAmount = socialData.exclude_remaining_amount
    ? 0
    : Math.max(0, socialData.total_cost - totalSocialCost);
  const shouldCheckRemainingAmount = !socialData.exclude_remaining_amount;

  const isDisabled =
    loading ||
    !canManageSettlement ||
    (socialData.exclude_remaining_amount
      ? totalCost === 0
      : allParticipants.size === 0 ||
        hasEmptyParticipants ||
        totalCost === 0 ||
        (shouldCheckRemainingAmount && remainingAmount !== 0));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p className="text-xs text-blue-700">
          회비 등으로 처리하는 경우, 하단의 체크박스에 체크하시면 됩니다.
          <br />
          항목 추가 버튼을 클릭하여 비용 항목을 추가하세요.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">총 비용 (원)</label>
        <input
          type="text"
          inputMode="numeric"
          value={socialData.total_cost}
          onKeyPress={(e) => {
            const char = String.fromCharCode(e.which);
            if (!/[0-9]/.test(char) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            let value = e.target.value;
            value = value.replace(/[^0-9]/g, '');
            if (value.length > 1 && value.startsWith('0')) {
              value = value.replace(/^0+/, '') || '0';
            }
            const newTotalCost = value === '' ? 0 : parseInt(value, 10) || 0;
            setSocialData((prev) => ({
              ...prev,
              total_cost: newTotalCost,
            }));

            if (newTotalCost > 0) {
              const errors = {};
              socialData.expense_items.forEach((item, idx) => {
                const otherItemsSum = socialData.expense_items.reduce((sum, itm, index) => {
                  if (index !== idx) {
                    return sum + (Number.isFinite(itm.amount) ? itm.amount : 0);
                  }
                  return sum;
                }, 0);
                if (item.amount + otherItemsSum > newTotalCost) {
                  const maxAllowed = Math.max(0, newTotalCost - otherItemsSum);
                  errors[idx] = `비용 항목의 합계가 총 비용(${newTotalCost.toLocaleString()}원)을 초과할 수 없습니다. 최대 입력 가능 금액: ${maxAllowed.toLocaleString()}원`;
                }
              });
              setExpenseItemErrors(errors);
            } else {
              setExpenseItemErrors({});
            }
          }}
          className="block w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">남은 금액 (원)</label>
        <input
          type="number"
          value={remainingAmount}
          disabled
          className="block w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-neutral-500 cursor-not-allowed"
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-md font-medium text-neutral-900">비용 항목</h4>
          <button
            type="button"
            onClick={addExpenseItem}
            className="rounded bg-green-600 px-2.5 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            항목 추가
          </button>
        </div>
        <div className="space-y-4">
          {socialData.expense_items.map((item, index) => (
            <div key={index} className="rounded-lg border border-neutral-200 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateExpenseItem(index, 'title', e.target.value)}
                    placeholder="비용 항목명"
                    className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={item.amount === 0 ? '' : item.amount}
                    onKeyPress={(e) => {
                      const char = String.fromCharCode(e.which);
                      if (!/[0-9]/.test(char) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      let value = e.target.value;
                      value = value.replace(/[^0-9]/g, '');
                      if (value.length > 1 && value.startsWith('0')) {
                        value = value.replace(/^0+/, '') || '0';
                      }
                      const numValue = value === '' ? 0 : parseInt(value, 10) || 0;

                      const totalCost = socialData.total_cost || 0;
                      if (totalCost > 0) {
                        const otherItemsSum = socialData.expense_items.reduce((sum, itm, idx) => {
                          if (idx !== index) {
                            return sum + (Number.isFinite(itm.amount) ? itm.amount : 0);
                          }
                          return sum;
                        }, 0);

                        if (numValue + otherItemsSum > totalCost) {
                          const maxAllowed = Math.max(0, totalCost - otherItemsSum);
                          setExpenseItemErrors((prev) => ({
                            ...prev,
                            [index]: `비용 항목의 합계가 총 비용(${totalCost.toLocaleString()}원)을 초과할 수 없습니다. 최대 입력 가능 금액: ${maxAllowed.toLocaleString()}원`,
                          }));
                          if (numValue > maxAllowed) {
                            updateExpenseItem(index, 'amount', maxAllowed);
                            return;
                          }
                        } else {
                          setExpenseItemErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors[index];
                            return newErrors;
                          });
                        }
                      }

                      updateExpenseItem(index, 'amount', numValue);
                    }}
                    placeholder="금액"
                    className={`block w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 ${
                      expenseItemErrors[index] ? 'border-red-300' : 'border-neutral-300'
                    }`}
                  />
                  {expenseItemErrors[index] && (
                    <p className="mt-1 text-xs text-red-500">{expenseItemErrors[index]}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeExpenseItem(index)}
                  className="text-red-500 transition-colors hover:text-red-700"
                >
                  ✕
                </button>
              </div>
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium text-neutral-600">정산 대상자 선택</p>
                <div className="space-y-2 min-h-[60px] rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  {participants.length === 0 ? (
                    <p className="text-xs text-neutral-500">참가자 목록을 불러오는 중...</p>
                  ) : (
                    <>
                      {(() => {
                        const itemParticipants = item.participants || [];
                        const allParticipantIds = participants.map((p) => p.id);
                        const isAllSelected = allParticipantIds.length > 0 && 
                          allParticipantIds.every((id) => itemParticipants.includes(id));
                        
                        return (
                          <label className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1 rounded">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={() => {
                                if (isAllSelected) {
                                  // 전체 선택 해제 - 빈 배열로 설정
                                  updateExpenseItem(index, 'participants', []);
                                } else {
                                  // 전체 선택 - 모든 참가자 ID 추가
                                  updateExpenseItem(index, 'participants', allParticipantIds);
                                }
                              }}
                              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-neutral-700">전체 선택</span>
                          </label>
                        );
                      })()}
                      {(() => {
                        const itemParticipants = item.participants || [];
                        const allParticipantIds = participants.map((p) => p.id);
                        const isAllSelected = allParticipantIds.length > 0 && 
                          allParticipantIds.every((id) => itemParticipants.includes(id));
                        
                        return !isAllSelected ? (
                          <div className="mt-2">
                            {participants.map((participant) => (
                              <label
                                key={participant.id}
                                className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={(itemParticipants || []).includes(participant.id)}
                                  onChange={() => toggleExpenseItemParticipant(index, participant.id)}
                                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-neutral-700">
                                  {participant.name || participant.email || '알 수 없음'}
                                  {participant.role && (
                                    <span className="ml-1 text-xs text-neutral-500">({getRoleLabel(participant.role)})</span>
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-md font-medium text-neutral-900">총 정산 대상자</h4>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-sm text-neutral-600">전체 정산 대상자: {participantCount}명</p>
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2 mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={socialData.exclude_remaining_amount}
            onChange={(e) =>
              setSocialData((prev) => ({
                ...prev,
                exclude_remaining_amount: e.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-neutral-700">나머지 금액 정산 제외</span>
        </label>
        <p className="text-xs text-neutral-500 ml-6 mb-2">회비 등으로 처리하는 경우 체크하세요</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">기타 사항</label>
        <textarea
          value={socialData.notes}
          onChange={(e) =>
            setSocialData((prev) => ({
              ...prev,
              notes: e.target.value,
            }))
          }
          rows={3}
          placeholder="특이사항이나 기록할 것들을 입력하세요"
          className="block w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {participantCount > 0 && totalCost > 0 && (() => {
        // 각 참가자별 실제 지불 금액 계산
        const participantAmounts = {};
        socialData.expense_items.forEach((item) => {
          const amount = Number(item.amount) || 0;
          const itemParticipants = item.participants || [];
          if (itemParticipants.length > 0) {
            const amountPerPerson = Math.round(amount / itemParticipants.length);
            itemParticipants.forEach((participantId) => {
              if (participantId && participantId !== 'UNSETTLED') {
                if (!participantAmounts[participantId]) {
                  participantAmounts[participantId] = 0;
                }
                participantAmounts[participantId] += amountPerPerson;
              }
            });
          }
        });

        const hasDifferentAmounts = Object.keys(participantAmounts).length > 0 && 
          new Set(Object.values(participantAmounts)).size > 1;

        return (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h5 className="mb-2 text-sm font-medium text-blue-900">정산 요약</h5>
            <div className="text-sm text-blue-700">
              <p>총 비용: {totalCost.toLocaleString()}원</p>
              {socialData.exclude_remaining_amount && remainingAmount > 0 && (
                <p>정산 제외 비용: {remainingAmount.toLocaleString()}원</p>
              )}
              <p>정산 대상자: {participantCount}명</p>
              {socialData.exclude_remaining_amount && hasDifferentAmounts ? (
                <div className="mt-2">
                  <p className="text-xs font-medium text-blue-800 mb-1">참가자별 금액:</p>
                  {participants
                    .filter((p) => participantAmounts[p.id])
                    .map((p) => (
                      <p key={p.id} className="text-xs text-blue-700">
                        {p.name}: {participantAmounts[p.id].toLocaleString()}원
                      </p>
                    ))}
                </div>
              ) : (
                <p>
                  인당 비용:{' '}
                  {socialData.exclude_remaining_amount
                    ? participantCount > 0
                      ? Math.round(totalSocialCost / participantCount).toLocaleString()
                      : 0
                    : participantCount > 0
                    ? Math.round(totalCost / participantCount).toLocaleString()
                    : 0}
                  원
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {shouldCheckRemainingAmount && remainingAmount !== 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700">모든 정산금액이 확정되어야 정산을 생성할 수 있습니다.</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isDisabled}
          className="rounded-lg bg-primary-600 px-4 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '생성 중...' : '정산 생성'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-neutral-100 px-4 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
        >
          취소
        </button>
      </div>
    </div>
  );
};

const SettlementManager = ({
  meetingId,
  meetingType,
  canSettle = false,
  canManageSettlement = false,
  participants: rawParticipants = [],
  onSettlementCreated,
  onConfirmSettlement,
  meeting = null,
}) => {
  // 상태 관리
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSettlement, setLoadingSettlement] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('정산이 성공적으로 생성되었습니다.');
  const [showOtherExpenseDetailModal, setShowOtherExpenseDetailModal] = useState(false);
  const [showParticipantDetailModal, setShowParticipantDetailModal] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);

  // 라운딩 정산 폼 데이터
  const [roundingData, setRoundingData] = useState({
    all_covered_by_fee: false,
    green_fee_covered_by_fee: false,
    caddy_fee_covered_by_fee: false,
    cart_fee_covered_by_fee: false,
    total_cost: 0,
    total_cost_participants: [],
    total_cost_exempted: [],
    green_fee: 0,
    green_fee_participants: [],
    green_fee_exempted: [],
    cart_fee: 0,
    cart_fee_participants: [],
    cart_fee_exempted: [],
    caddy_fee: 0,
    caddy_fee_participants: [],
    caddy_fee_exempted: [],
    other_expense_items: [],
    notes: '',
    exclude_remaining_amount: false,
  });

  // 소셜 정산 폼 데이터
  const [socialData, setSocialData] = useState({
    expense_items: [],
    settlement_targets: [],
    total_cost: 0,
    notes: '',
    exclude_remaining_amount: false,
  });

  const [expenseItemErrors, setExpenseItemErrors] = useState({});

  // 참가자 목록 변환
  const participants = React.useMemo(() => {
    return (rawParticipants || []).map((p) => ({
      id: p.user_id || p.id,
      name: p.user_name || p.name || p.nickname,
      email: p.user_email || p.email,
      role: p.role,
    }));
  }, [rawParticipants]);

  // 역할 한글 변환
  const getRoleLabel = (role) => {
    const roleMap = {
      ORGANIZER: '개설자',
      PARTICIPANT: '참가자',
      CO_ORGANIZER: '공동 주최자',
    };
    return roleMap[role] || role;
  };

  // 소셜 정산에서 각 참가자별 실제 지불 금액 계산
  const calculateParticipantAmounts = React.useMemo(() => {
    if (!settlement || (meetingType !== 'SOCIAL' && meetingType !== 'social') || !settlement.expense_items) {
      return {};
    }

    const participantAmounts = {};
    
    settlement.expense_items.forEach((item) => {
      const amount = Number(item.amount) || 0;
      const itemParticipants = item.participants || [];
      
      if (itemParticipants.length > 0) {
        const amountPerPerson = Math.round(amount / itemParticipants.length);
        itemParticipants.forEach((participantId) => {
          if (participantId && participantId !== 'UNSETTLED') {
            if (!participantAmounts[participantId]) {
              participantAmounts[participantId] = 0;
            }
            participantAmounts[participantId] += amountPerPerson;
          }
        });
      }
    });

    return participantAmounts;
  }, [settlement, meetingType]);

  // 참가자별 정산 비용 상세 계산 함수 (라운딩/소셜 정산 모두 지원)
  const calculateParticipantSettlement = React.useCallback((participantId) => {
    if (!settlement || !participantId) return null;

    if (meetingType === 'ROUND' || meetingType === 'round') {
      // 전체 회비 처리 여부 확인 (settlement 또는 roundingData에서)
      const allCoveredByFee = settlement.all_covered_by_fee || roundingData.all_covered_by_fee || false;
      
      // 전체 회비 처리 시 모든 참가자 부담 비용을 0원으로 설정
      if (allCoveredByFee) {
        return {
          items: [],
          total: 0,
        };
      }

      // 라운딩 정산 계산
      const items = [];
      let total = 0;

      // 그린피
      const greenFee = Number(settlement.green_fee) || 0;
      const greenFeeParticipants = settlement.green_fee_participants || [];
      const greenFeeCoveredByFee = settlement.green_fee_covered_by_fee || roundingData.green_fee_covered_by_fee || false;
      if (greenFee > 0 && greenFeeParticipants.includes(participantId) && !greenFeeCoveredByFee) {
        const amountPerPerson = Math.round(greenFee / greenFeeParticipants.length);
        items.push({
          name: '그린피',
          amount: amountPerPerson,
          totalAmount: greenFee,
          participantCount: greenFeeParticipants.length,
          coveredByFee: false,
        });
        total += amountPerPerson;
      } else if (greenFee > 0 && greenFeeParticipants.includes(participantId) && greenFeeCoveredByFee) {
        // 회비 처리된 경우 표시만 함
        items.push({
          name: '그린피 (회비 처리)',
          amount: 0,
          totalAmount: greenFee,
          participantCount: greenFeeParticipants.length,
          coveredByFee: true,
        });
      }

      // 캐디피
      const caddyFee = Number(settlement.caddy_fee) || 0;
      const caddyFeeParticipants = settlement.caddy_fee_participants || [];
      const caddyFeeCoveredByFee = settlement.caddy_fee_covered_by_fee || roundingData.caddy_fee_covered_by_fee || false;
      if (caddyFee > 0 && caddyFeeParticipants.includes(participantId) && !caddyFeeCoveredByFee) {
        const amountPerPerson = Math.round(caddyFee / caddyFeeParticipants.length);
        items.push({
          name: '캐디피',
          amount: amountPerPerson,
          totalAmount: caddyFee,
          participantCount: caddyFeeParticipants.length,
          coveredByFee: false,
        });
        total += amountPerPerson;
      } else if (caddyFee > 0 && caddyFeeParticipants.includes(participantId) && caddyFeeCoveredByFee) {
        // 회비 처리된 경우 표시만 함
        items.push({
          name: '캐디피 (회비 처리)',
          amount: 0,
          totalAmount: caddyFee,
          participantCount: caddyFeeParticipants.length,
          coveredByFee: true,
        });
      }

      // 카트비
      const cartFee = Number(settlement.cart_fee) || 0;
      const cartFeeParticipants = settlement.cart_fee_participants || [];
      const cartFeeCoveredByFee = settlement.cart_fee_covered_by_fee || roundingData.cart_fee_covered_by_fee || false;
      if (cartFee > 0 && cartFeeParticipants.includes(participantId) && !cartFeeCoveredByFee) {
        const amountPerPerson = Math.round(cartFee / cartFeeParticipants.length);
        items.push({
          name: '카트비',
          amount: amountPerPerson,
          totalAmount: cartFee,
          participantCount: cartFeeParticipants.length,
          coveredByFee: false,
        });
        total += amountPerPerson;
      } else if (cartFee > 0 && cartFeeParticipants.includes(participantId) && cartFeeCoveredByFee) {
        // 회비 처리된 경우 표시만 함
        items.push({
          name: '카트비 (회비 처리)',
          amount: 0,
          totalAmount: cartFee,
          participantCount: cartFeeParticipants.length,
          coveredByFee: true,
        });
      }

      // 기타 비용
      const otherExpenseItems = settlement.other_expense_items || [];
      otherExpenseItems.forEach((item) => {
        const itemAmount = Number(item.amount) || 0;
        const itemParticipants = item.participants || [];
        if (itemAmount > 0 && itemParticipants.includes(participantId)) {
          const amountPerPerson = Math.round(itemAmount / itemParticipants.length);
          items.push({
            name: item.title || '기타 비용',
            amount: amountPerPerson,
            totalAmount: itemAmount,
            participantCount: itemParticipants.length,
            coveredByFee: false,
          });
          total += amountPerPerson;
        }
      });

      return {
        items,
        total,
      };
    } else {
      // 소셜 정산 계산
      const items = [];
      let total = 0;

      const expenseItems = settlement.expense_items || [];
      expenseItems.forEach((item) => {
        const itemAmount = Number(item.amount) || 0;
        const itemParticipants = item.participants || [];
        if (itemAmount > 0 && itemParticipants.includes(participantId)) {
          const amountPerPerson = Math.round(itemAmount / itemParticipants.length);
          items.push({
            name: item.title || '비용 항목',
            amount: amountPerPerson,
            totalAmount: itemAmount,
            participantCount: itemParticipants.length,
          });
          total += amountPerPerson;
        }
      });

      return {
        items,
        total,
      };
    }
  }, [settlement, meetingType, roundingData]);

  // 정산 조회
  const fetchSettlement = useCallback(async () => {
    if (!meetingId) return;
    try {
      setLoadingSettlement(true);
      const response = await roundsApi.getMeetingSettlement(meetingId);
      console.log('정산 조회 응답 (전체):', response);
      console.log('정산 조회 응답 (response.data):', response.data);
      console.log('정산 조회 응답 (response.settlement):', response.settlement);
      
      // API 응답 구조: axios 인터셉터가 response.data를 반환하므로
      // response 자체가 {settlement: {...} 또는 null} 형태일 수 있음
      let settlementData = null;
      
      // 1. response.settlement이 있는 경우 (가장 일반적)
      if (response.settlement !== undefined) {
        settlementData = response.settlement;
      }
      // 2. response.data가 있고 settlement 속성이 있는 경우
      else if (response.data && 'settlement' in response.data) {
        settlementData = response.data.settlement;
      }
      // 3. response.data 자체가 정산 데이터인 경우
      else if (response.data && (response.data.id || response.data.total_cost !== undefined)) {
        settlementData = response.data;
      }
      // 4. response 자체가 정산 데이터인 경우
      else if (response.id || response.total_cost !== undefined) {
        settlementData = response;
      }
      
      console.log('정산 데이터 (파싱 후):', settlementData);
      console.log('정산 데이터 total_cost:', settlementData?.total_cost);
      console.log('정산 데이터 total_participants:', settlementData?.total_participants);
      console.log('정산 데이터 amount_per_person:', settlementData?.amount_per_person);
      
      // null이 아닌 경우에만 설정 (null이면 정산이 없는 것)
      setSettlement(settlementData);
    } catch (err) {
      if (err?.response?.status !== 404) {
        console.error('정산 조회 실패:', err);
        console.error('정산 조회 에러 응답:', err?.response?.data);
      }
      setSettlement(null);
    } finally {
      setLoadingSettlement(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchSettlement();
  }, [fetchSettlement]);

  // 정산 생성 버튼 활성화 조건
  // 라운딩 모임의 경우 rounding_completed_at이 설정되어야 정산 생성 가능
  const canCreateSettlement = 
    settlement === null && 
    canSettle && 
    canManageSettlement &&
    (!meeting || !meeting.settlement_confirmed) &&
    (meetingType !== 'ROUND' || meeting?.rounding_completed_at !== null);

  // 정산 수정 버튼 표시 조건
  const canEditSettlement = settlement !== null && canManageSettlement && (!meeting || !meeting.settlement_confirmed);

  // 정산 확정 버튼 표시 조건
  const canConfirmSettlement = settlement !== null && 
    canManageSettlement && 
    onConfirmSettlement && 
    (!meeting || !meeting.settlement_confirmed);

  // 필수 필드 검증 (총비용, 그린피, 카트비, 캐디피) - SettlementManager에서 계산
  const hasAllRequiredFields = 
    roundingData.total_cost !== null && roundingData.total_cost !== undefined &&
    roundingData.green_fee !== null && roundingData.green_fee !== undefined &&
    roundingData.cart_fee !== null && roundingData.cart_fee !== undefined &&
    roundingData.caddy_fee !== null && roundingData.caddy_fee !== undefined;

  // 라운딩 정산 생성
  const handleRoundingSettlement = async () => {
    // 필수 필드 검증 (총비용, 그린피, 카트비, 캐디피)
    if (!hasAllRequiredFields) {
      setError('총비용, 그린피, 카트비, 캐디피를 모두 입력해주세요.');
      return;
    }

    // 필수 필드별 정산 대상자 확인 (회비 처리되지 않은 경우만)
    const needsGreenFeeParticipants = !roundingData.all_covered_by_fee && !roundingData.green_fee_covered_by_fee;
    const needsCartFeeParticipants = !roundingData.all_covered_by_fee && !roundingData.cart_fee_covered_by_fee;
    const needsCaddyFeeParticipants = !roundingData.all_covered_by_fee && !roundingData.caddy_fee_covered_by_fee;

    if (
      (needsGreenFeeParticipants && (roundingData.green_fee_participants || []).length === 0) ||
      (needsCartFeeParticipants && (roundingData.cart_fee_participants || []).length === 0) ||
      (needsCaddyFeeParticipants && (roundingData.caddy_fee_participants || []).length === 0)
    ) {
      setError('회비 처리되지 않은 필수 필드의 정산 대상자를 선택해주세요.');
      return;
    }

    // 면제자가 정산 대상자에 포함되지 않았는지 검증 (총 비용 제외)
    const checkExemptedInParticipants = (participants, exempted, fieldName) => {
      if (!exempted || exempted.length === 0) return null;
      const exemptedInParticipants = exempted.filter((id) => participants.includes(id));
      if (exemptedInParticipants.length > 0) {
        return `${fieldName}에서 면제자가 정산 대상자에 포함되어 있습니다.`;
      }
      return null;
    };

    const exemptedErrors = [
      checkExemptedInParticipants(
        roundingData.green_fee_participants || [],
        roundingData.green_fee_exempted || [],
        '그린피'
      ),
      checkExemptedInParticipants(
        roundingData.cart_fee_participants || [],
        roundingData.cart_fee_exempted || [],
        '카트비'
      ),
      checkExemptedInParticipants(
        roundingData.caddy_fee_participants || [],
        roundingData.caddy_fee_exempted || [],
        '캐디피'
      ),
    ].filter((error) => error !== null);

    if (exemptedErrors.length > 0) {
      setError(exemptedErrors[0]);
      return;
    }

    // 기타 비용 항목 검증 (모두 회비에서 처리되지 않은 경우만)
    if (!roundingData.all_covered_by_fee) {
      const hasEmptyOtherExpenseParticipants = (roundingData.other_expense_items || []).some(
        (item) => !item.participants || item.participants.length === 0
      );
      if (hasEmptyOtherExpenseParticipants) {
        setError('기타 비용 항목의 정산 대상자를 선택해주세요.');
        return;
      }
    }

    // 나머지 금액 검증 (exclude_remaining_amount가 false일 때)
    if (!roundingData.exclude_remaining_amount) {
      const otherExpenseTotal = (roundingData.other_expense_items || []).reduce(
        (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
        0
      );
      const totalOtherCosts =
        (roundingData.green_fee || 0) +
        (roundingData.caddy_fee || 0) +
        (roundingData.cart_fee || 0) +
        otherExpenseTotal;
    }

    const isEdit = settlement !== null;
    setLoading(true);
    setError(null);
    try {
      // 전체 정산 대상자 수집 (중복 제거, 총 비용 제외)
      const allSettlementTargets = new Set();
      [
        ...(roundingData.green_fee_participants || []),
        ...(roundingData.cart_fee_participants || []),
        ...(roundingData.caddy_fee_participants || []),
      ].forEach((id) => allSettlementTargets.add(id));
      (roundingData.other_expense_items || []).forEach((item) => {
        (item.participants || []).forEach((id) => {
          if (id !== 'UNSETTLED') allSettlementTargets.add(id);
        });
      });

      // 기타 비용 합계 계산
      const otherExpenseTotal = (roundingData.other_expense_items || []).reduce(
        (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
        0
      );
      
      // 총 비용 자동 계산
      const calculatedTotalCost =
        (roundingData.green_fee || 0) +
        (roundingData.caddy_fee || 0) +
        (roundingData.cart_fee || 0) +
        otherExpenseTotal;

      // 전체 면제자 수집 (총 비용 제외)
      const allExempted = new Set();
      [
        ...(roundingData.green_fee_exempted || []),
        ...(roundingData.cart_fee_exempted || []),
        ...(roundingData.caddy_fee_exempted || []),
      ].forEach((id) => allExempted.add(id));

      // 백엔드에 전송할 데이터 구조
      const settlementPayload = {
        total_cost: calculatedTotalCost,
        green_fee: roundingData.green_fee || 0,
        green_fee_participants: roundingData.green_fee_participants || [],
        green_fee_exempted: roundingData.green_fee_exempted || [],
        cart_fee: roundingData.cart_fee || 0,
        cart_fee_participants: roundingData.cart_fee_participants || [],
        cart_fee_exempted: roundingData.cart_fee_exempted || [],
        caddy_fee: roundingData.caddy_fee || 0,
        caddy_fee_participants: roundingData.caddy_fee_participants || [],
        caddy_fee_exempted: roundingData.caddy_fee_exempted || [],
        other_fee: otherExpenseTotal, // 기타 비용 합계
        other_expense_items: roundingData.other_expense_items || [],
        settlement_targets: Array.from(allSettlementTargets), // 전체 정산 대상자 (면제자 제외)
        exempted_participants: Array.from(allExempted), // 전체 면제자
        exclude_remaining_amount: roundingData.exclude_remaining_amount || false,
        notes: roundingData.notes || '',
        all_covered_by_fee: roundingData.all_covered_by_fee || false,
        green_fee_covered_by_fee: roundingData.green_fee_covered_by_fee || false,
        caddy_fee_covered_by_fee: roundingData.caddy_fee_covered_by_fee || false,
        cart_fee_covered_by_fee: roundingData.cart_fee_covered_by_fee || false,
      };

      await roundsApi.createRoundingSettlement(meetingId, settlementPayload);
      setShowForm(false);
      setRoundingData({
        total_cost: 0,
          total_cost_participants: [],
          total_cost_exempted: [],
        green_fee: 0,
          green_fee_participants: [],
          green_fee_exempted: [],
        cart_fee: 0,
          cart_fee_participants: [],
          cart_fee_exempted: [],
          caddy_fee: 0,
          caddy_fee_participants: [],
          caddy_fee_exempted: [],
          other_expense_items: [],
        notes: '',
          exclude_remaining_amount: false,
          all_covered_by_fee: false,
          green_fee_covered_by_fee: false,
          caddy_fee_covered_by_fee: false,
          cart_fee_covered_by_fee: false,
      });
      await fetchSettlement();
      // 모달을 먼저 표시하고, 확인 버튼을 눌렀을 때만 onSettlementCreated 호출
      setSuccessModalMessage(isEdit ? '정산이 성공적으로 수정되었습니다.' : '정산이 성공적으로 생성되었습니다.');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('라운딩 정산 생성 실패:', err);
      setError(err?.response?.data?.detail || err?.message || '정산 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 소셜 정산 생성
  const handleSocialSettlement = async () => {
    const isEdit = settlement !== null;
    // 나머지 금액 정산 제외가 아닌 경우에만 참가자 검증
    if (!socialData.exclude_remaining_amount) {
      const allParticipants = new Set();
      socialData.expense_items.forEach((item) => {
        (item.participants || []).forEach((participantId) => {
          allParticipants.add(participantId);
        });
      });

      const hasEmptyParticipants = socialData.expense_items.some(
        (item) => !item.participants || item.participants.length === 0
      );

      if (hasEmptyParticipants) {
        setError('각 항목에 정산 대상자를 선택해주세요.');
        return;
      }

      if (allParticipants.size === 0) {
        setError('정산 대상자를 선택해주세요.');
        return;
      }

      // 남은 금액 검증
      const totalCost = socialData.total_cost || 0;
      const expenseItemsTotal = socialData.expense_items.reduce(
        (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
        0,
      );
      const remainingAmount = Math.max(0, totalCost - expenseItemsTotal);
      if (remainingAmount !== 0) {
        setError('모든 정산금액이 확정되어야 정산을 생성할 수 있습니다.');
        return;
      }
    }

    // 총 비용 검증
    const totalCost = socialData.total_cost || 0;
    if (totalCost === 0) {
      setError('총 비용을 입력해주세요.');
      return;
    }

    // settlement_targets 계산
    let settlementTargets = [];
    if (!socialData.exclude_remaining_amount) {
      const allParticipants = new Set();
      socialData.expense_items.forEach((item) => {
        (item.participants || []).forEach((participantId) => {
          allParticipants.add(participantId);
        });
      });
      settlementTargets = Array.from(allParticipants);
    }

    setLoading(true);
    setError(null);
    try {
      const settlementData = {
        ...socialData,
        settlement_targets: settlementTargets,
      };
      await roundsApi.createEventSettlement(meetingId, settlementData);
      setShowForm(false);
      setSocialData({
        expense_items: [],
        settlement_targets: [],
        total_cost: 0,
        notes: '',
        exclude_remaining_amount: false,
      });
      setExpenseItemErrors({});
      await fetchSettlement();
      // 모달을 먼저 표시하고, 확인 버튼을 눌렀을 때만 onSettlementCreated 호출
      setSuccessModalMessage(isEdit ? '정산이 성공적으로 수정되었습니다.' : '정산이 성공적으로 생성되었습니다.');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('소셜 정산 생성 실패:', err);
      setError(err?.response?.data?.detail || err?.message || '정산 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 정산 수정 시 데이터 로드 및 초기화
  useEffect(() => {
    if (showForm && settlement) {
      if (meetingType === 'ROUND') {
        // 기존 정산 데이터를 새로운 구조로 변환
        // 백엔드에서 필드별 participants를 받지 못하는 경우, 전체 정산 대상자를 각 필드에 할당
        const allTargets =
          settlement.settlement_targets ||
          settlement.participants?.filter((p) => p.is_settlement_target !== false).map((p) => p.user_id) ||
          [];

        // 기타 비용 항목 처리
        let otherExpenseItems = [];
        if (settlement.other_expense_items && Array.isArray(settlement.other_expense_items)) {
          otherExpenseItems = settlement.other_expense_items.map((item) => ({
            title: item.title || '',
            amount: item.amount || 0,
            participants: item.participants || [],
          }));
        } else if (settlement.other_fee && settlement.other_fee > 0) {
          // 기존 구조에서 기타 비용이 있으면 항목으로 변환
          otherExpenseItems = [
            {
              title: '기타 비용',
              amount: settlement.other_fee,
              participants: allTargets,
            },
          ];
        }

        setRoundingData({
          total_cost: settlement.total_cost || 0,
          total_cost_participants:
            settlement.total_cost_participants || allTargets, // 백엔드에서 받지 못하면 전체 대상자 사용
          total_cost_exempted: settlement.total_cost_exempted || [],
          green_fee: settlement.green_fee || 0,
          green_fee_participants: settlement.green_fee_participants || allTargets,
          green_fee_exempted: settlement.green_fee_exempted || [],
          cart_fee: settlement.cart_fee || 0,
          cart_fee_participants: settlement.cart_fee_participants || allTargets,
          cart_fee_exempted: settlement.cart_fee_exempted || [],
          caddy_fee: settlement.caddy_fee || 0,
          caddy_fee_participants: settlement.caddy_fee_participants || allTargets,
          caddy_fee_exempted: settlement.caddy_fee_exempted || [],
          other_expense_items: otherExpenseItems,
          notes: settlement.notes || '',
          exclude_remaining_amount: settlement.exclude_remaining_amount || false,
          all_covered_by_fee: settlement.all_covered_by_fee === true || settlement.all_covered_by_fee === 1,
          green_fee_covered_by_fee: settlement.green_fee_covered_by_fee === true || settlement.green_fee_covered_by_fee === 1,
          caddy_fee_covered_by_fee: settlement.caddy_fee_covered_by_fee === true || settlement.caddy_fee_covered_by_fee === 1,
          cart_fee_covered_by_fee: settlement.cart_fee_covered_by_fee === true || settlement.cart_fee_covered_by_fee === 1,
        });
      } else {
        const loadedExpenseItems = (settlement.expense_items || []).map((item) => {
          const participants = item?.participants || item?.participant_ids || [];
          return {
            title: item?.title || item?.name || '',
            amount: item?.amount || 0,
            participants: Array.isArray(participants) ? participants : [],
          };
        });
        let targets =
          settlement.settlement_targets ||
          settlement.participants?.filter((p) => p.is_settlement_target === true).map((p) => p.user_id) ||
          [];
        if (settlement.exclude_remaining_amount && targets.length === 0 && loadedExpenseItems.length > 0) {
          const allParticipants = new Set();
          loadedExpenseItems.forEach((item) => {
            (item.participants || []).forEach((participantId) => {
              if (participantId !== 'UNSETTLED') {
                allParticipants.add(participantId);
              }
            });
          });
          targets = Array.from(allParticipants);
        }
        setSocialData({
          expense_items: loadedExpenseItems,
          settlement_targets: targets,
          total_cost: settlement.total_cost || 0,
          notes: settlement.notes || '',
          exclude_remaining_amount: settlement.exclude_remaining_amount || false,
        });
      }
    } else if (showForm && !settlement) {
      // 새로 생성하는 경우 초기화
      if (meetingType === 'ROUND') {
        // 참가자 목록이 로드되었고 비어있지 않을 때만 전체 선택으로 초기화
        // 이미 초기화된 경우(participants가 설정되어 있음) 중복 초기화 방지
        if (participants.length > 0) {
          const allParticipantIds = participants.map((p) => p.id);
          // 현재 데이터가 초기 상태(모든 participants가 빈 배열)인지 확인
          const isInitialState =
            roundingData.total_cost_participants.length === 0 &&
            roundingData.green_fee_participants.length === 0 &&
            roundingData.cart_fee_participants.length === 0 &&
            roundingData.caddy_fee_participants.length === 0;

          // 초기 상태이거나, 현재 설정된 participants가 로드된 participants와 다를 때만 업데이트
          if (isInitialState) {
        // meeting 데이터에서 green_fee, caddy_fee, cart_fee 값을 가져옴
        const meetingGreenFee = meeting?.green_fee || 0;
        const meetingCaddyFee = meeting?.caddy_fee || 0;
        const meetingCartFee = meeting?.cart_fee || 0;
        const meetingTotalCost = meetingGreenFee + meetingCaddyFee + meetingCartFee;
        
        setRoundingData({
          total_cost: meetingTotalCost,
          total_cost_participants: allParticipantIds,
          total_cost_exempted: [],
          green_fee: meetingGreenFee,
          green_fee_participants: allParticipantIds,
          green_fee_exempted: [],
          cart_fee: meetingCartFee,
          cart_fee_participants: allParticipantIds,
          cart_fee_exempted: [],
          caddy_fee: meetingCaddyFee,
          caddy_fee_participants: allParticipantIds,
          caddy_fee_exempted: [],
          other_expense_items: [],
          notes: '',
          exclude_remaining_amount: false,
          all_covered_by_fee: false,
          green_fee_covered_by_fee: false,
          caddy_fee_covered_by_fee: false,
          cart_fee_covered_by_fee: false,
        });
          } else {
            // 이미 데이터가 있지만 participants가 변경된 경우, 기존 participants가 현재 participants에 없는 경우에만 업데이트
            const currentParticipantIds = new Set(participants.map((p) => p.id));
            const needsUpdate = [
              roundingData.total_cost_participants,
              roundingData.green_fee_participants,
              roundingData.cart_fee_participants,
              roundingData.caddy_fee_participants,
            ].some((participantList) =>
              participantList.some((id) => !currentParticipantIds.has(id))
            );

            if (needsUpdate) {
              // 기존에 선택된 participants 중 현재 participants에 있는 것만 유지
              const filterValidParticipants = (participantList) =>
                participantList.filter((id) => currentParticipantIds.has(id));

              setRoundingData((prev) => ({
                ...prev,
                total_cost_participants: filterValidParticipants(prev.total_cost_participants),
                green_fee_participants: filterValidParticipants(prev.green_fee_participants),
                cart_fee_participants: filterValidParticipants(prev.cart_fee_participants),
                caddy_fee_participants: filterValidParticipants(prev.caddy_fee_participants),
              }));
            }
          }
        }
      } else {
        setSocialData({
          expense_items: [],
          settlement_targets: [],
          total_cost: 0,
          notes: '',
          exclude_remaining_amount: false,
        });
      }
    }
  }, [showForm, settlement, meetingType, participants]);

  // 폼이 열려있으면 폼을 표시
  if (showForm) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900">
            {meetingType === 'ROUND' ? '라운딩 정산' : '소셜 정산'}
          </h3>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setError(null);
            }}
            className="text-neutral-500 transition-colors hover:text-neutral-700 p-1 sm:p-2 text-lg sm:text-xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-red-700">
            {error}
          </div>
        )}

        {meetingType === 'ROUND' && (
          <div className="mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={roundingData.all_covered_by_fee || false}
                onChange={(e) =>
                  setRoundingData((prev) => ({
                    ...prev,
                    all_covered_by_fee: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700">모두 회비에서 처리</span>
            </label>
          </div>
        )}

        {meetingType === 'ROUND' ? (
          <RoundingSettlementForm
            roundingData={roundingData}
            setRoundingData={setRoundingData}
            participants={participants}
            getRoleLabel={getRoleLabel}
            onSave={handleRoundingSettlement}
            onCancel={() => setShowForm(false)}
            loading={loading}
            canManageSettlement={canManageSettlement}
            showOtherExpenseDetailModal={showOtherExpenseDetailModal}
            setShowOtherExpenseDetailModal={setShowOtherExpenseDetailModal}
          />
        ) : (
          <SocialSettlementForm
            socialData={socialData}
            setSocialData={setSocialData}
            expenseItemErrors={expenseItemErrors}
            setExpenseItemErrors={setExpenseItemErrors}
            participants={participants}
            getRoleLabel={getRoleLabel}
            onSave={handleSocialSettlement}
            onCancel={() => setShowForm(false)}
            loading={loading}
            canManageSettlement={canManageSettlement}
          />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900">정산 관리</h3>
        {canCreateSettlement && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setShowForm(true);
            }}
            className="rounded-lg bg-primary-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            정산 생성
          </button>
        )}
      </div>

      {loadingSettlement ? (
        <p className="text-xs sm:text-sm text-neutral-500">정산 정보를 불러오는 중...</p>
      ) : settlement ? (
        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
            <div className="mb-1.5 sm:mb-2 flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-medium text-blue-900">정산 정보</h4>
              <button
                type="button"
                onClick={() => {
                  setShowParticipantDetailModal(true);
                  // 첫 번째 정산 대상자를 기본 선택
                  const firstParticipant = participants.find((p) => {
                    if (meetingType === 'ROUND') {
                      const allTargets = settlement.settlement_targets || 
                        settlement.participants?.filter((p) => p.is_settlement_target !== false).map((p) => p.user_id) || [];
                      return allTargets.includes(p.id);
                    } else {
                      const allTargets = new Set();
                      (settlement.expense_items || []).forEach((item) => {
                        (item.participants || []).forEach((pid) => allTargets.add(pid));
                      });
                      return allTargets.has(p.id);
                    }
                  });
                  setSelectedParticipantId(firstParticipant?.id || participants[0]?.id || null);
                }}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                상세보기
              </button>
            </div>
            <div className="space-y-1 text-xs sm:text-sm text-blue-700">
              <p>
                총 비용: {settlement.total_cost ? Number(settlement.total_cost).toLocaleString() : 0}원
              </p>
              <p>
                정산 대상자: {settlement.total_participants || 0}명
                {settlement.total_participants === 0 && (settlement.all_covered_by_fee === true || settlement.all_covered_by_fee === 1) && (
                  <span className="text-blue-600"> (모두 회비에서 처리합니다.)</span>
                )}
              </p>
              {settlement.exclude_remaining_amount && (meetingType === 'SOCIAL' || meetingType === 'social') && Object.keys(calculateParticipantAmounts).length > 0 ? (
                <div className="mt-2">
                  <p className="text-xs font-medium text-blue-800 mb-1">참가자별 금액:</p>
                  {participants
                    .filter((p) => calculateParticipantAmounts[p.id])
                    .map((p) => (
                      <p key={p.id} className="text-xs text-blue-700">
                        {p.name}: {calculateParticipantAmounts[p.id].toLocaleString()}원
                      </p>
                    ))}
                </div>
              ) : (
                <p>
                  인당 비용:{' '}
                  {settlement.amount_per_person
                    ? Number(settlement.amount_per_person).toLocaleString()
                    : settlement.total_participants > 0 && settlement.total_cost
                    ? Math.round(Number(settlement.total_cost) / settlement.total_participants).toLocaleString()
                    : 0}
                  원
                </p>
              )}
              {settlement.notes && <p className="mt-2 text-xs text-blue-600">비고: {settlement.notes}</p>}
            </div>
          </div>

          {meetingType === 'ROUND' && canManageSettlement && (
            <div className="space-y-6">
              <div>
                <h4 className="mb-4 text-md font-medium text-neutral-900">비용 정보</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">전체 비용 (원)</label>
                    <input
                      type="number"
                      value={settlement.total_cost || 0}
                      disabled
                      className="block w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-neutral-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">그린피 (원)</label>
                    <input
                      type="number"
                      value={settlement.green_fee || 0}
                      disabled
                      className="block w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-neutral-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">캐디피 (원)</label>
                    <input
                      type="number"
                      value={settlement.caddy_fee || 0}
                      disabled
                      className="block w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-neutral-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">카트비 (원)</label>
                    <input
                      type="number"
                      value={settlement.cart_fee || 0}
                      disabled
                      className="block w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-neutral-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-medium text-neutral-700">기타 비용 (원)</label>
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
                    <input
                      type="number"
                      value={settlement.other_fee || 0}
                      disabled
                      className="block w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-neutral-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {meetingType === 'SOCIAL' && canManageSettlement && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">총 비용 (원)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={settlement.total_cost ? Number(settlement.total_cost).toLocaleString() : 0}
                  disabled
                  className="block w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-neutral-500 cursor-not-allowed"
                />
              </div>

              {(settlement.expense_items || []).length > 0 && (
                <div>
                  <h4 className="mb-4 text-md font-medium text-neutral-900">비용 항목</h4>
                  <div className="space-y-4">
                    {settlement.expense_items.map((item, index) => (
                      <div key={index} className="rounded-lg border border-neutral-200 p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={item.title || ''}
                              disabled
                              placeholder="비용 항목명"
                              className="block w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-500 cursor-not-allowed"
                            />
                          </div>
                          <div className="w-32">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.amount ? Number(item.amount).toLocaleString() : 0}
                              disabled
                              placeholder="금액"
                              className="block w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-500 cursor-not-allowed"
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="mb-2 text-xs font-medium text-neutral-600">정산 대상자 선택</p>
                          <div className="space-y-2 min-h-[60px] rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                            {participants.length === 0 ? (
                              <p className="text-xs text-neutral-500">참가자 목록을 불러오는 중...</p>
                            ) : (
                              participants.map((participant) => (
                                <div key={participant.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={(item.participants || []).includes(participant.id)}
                                    disabled
                                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 cursor-not-allowed"
                                  />
                                  <span className="text-sm text-neutral-700">
                                    {participant.name || participant.email || '알 수 없음'}
                                    {participant.role && (
                                      <span className="ml-1 text-xs text-neutral-500">({getRoleLabel(participant.role)})</span>
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

              {settlement.exclude_remaining_amount !== undefined && (
                <div>
                  <label className="flex items-center space-x-2 mb-2 cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={settlement.exclude_remaining_amount}
                      disabled
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 cursor-not-allowed"
                    />
                    <span className="text-sm font-medium text-neutral-700">나머지 금액 정산 제외</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {canEditSettlement && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setShowForm(true);
              }}
              className="w-full rounded-lg bg-primary-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              정산 수정
            </button>
          )}

          {/* 정산 확정 버튼: 정산이 있고 아직 확정되지 않았을 때만 표시 */}
          {canConfirmSettlement && (
            <button
              type="button"
              onClick={onConfirmSettlement}
              className="w-full rounded-lg bg-indigo-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              정산 확정
            </button>
          )}

          {/* 정산 확정 완료 메시지 */}
          {settlement && meeting && meeting.settlement_confirmed && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm font-medium text-green-800">정산이 확정되었습니다.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {!canSettle ? (
            <p className="text-sm text-amber-600">
              모임이 완료된 후 정산을 진행할 수 있습니다.
            </p>
          ) : !canManageSettlement ? (
            <p className="text-sm text-amber-600">
              정산 생성은 개설자 또는 참가신청한 리더/매니저만 가능합니다.
            </p>
          ) : meetingType === 'ROUND' && !meeting?.rounding_completed_at ? (
            <p className="text-sm text-amber-600">
              라운딩이 종료된 후 정산을 생성할 수 있습니다.
            </p>
          ) : (
            <p className="text-sm text-neutral-600">
              모임 완료 후 참가자들과의 비용을 정산할 수 있습니다.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 sm:mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4">
          <div className="rounded-lg bg-white p-4 sm:p-6 shadow-lg max-w-md w-full mx-3 sm:mx-4">
            <div className="text-center">
              <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-neutral-900">정산 완료</h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-neutral-500">{successModalMessage}</p>
              <div className="mt-4 sm:mt-6">
                <button
                  type="button"
                  onClick={async () => {
                    setShowSuccessModal(false);
                    setShowForm(false);
                    await fetchSettlement();
                    onSettlementCreated?.();
                  }}
                  className="w-full rounded-lg bg-primary-600 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 기타 비용 상세보기 모달 */}
      {showOtherExpenseDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4">
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
              {(roundingData.other_expense_items || []).length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-8">기타 비용 항목이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {(roundingData.other_expense_items || []).map((item, index) => {
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
                        {((roundingData.other_expense_items || []).reduce(
                          (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
                          0
                        )).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 정산 조회 화면용 기타 비용 상세보기 모달 */}
      {showOtherExpenseDetailModal && settlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4">
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

      {/* 참가자별 정산 비용 상세보기 모달 */}
      {showParticipantDetailModal && settlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900">참가자별 정산 비용</h2>
              <button
                type="button"
                onClick={() => {
                  setShowParticipantDetailModal(false);
                  setSelectedParticipantId(null);
                }}
                className="rounded-lg p-1.5 sm:p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              >
                <FaTimes className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6" style={{ paddingBottom: '3rem', minHeight: 0 }}>
              {/* 참가자 선택 영역 */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-medium text-neutral-900">참가자 선택</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {participants.map((participant) => {
                    const isSelected = selectedParticipantId === participant.id;
                    return (
                      <button
                        key={participant.id}
                        type="button"
                        onClick={() => setSelectedParticipantId(participant.id)}
                        className={`rounded-lg border-2 px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                          isSelected
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300 hover:bg-primary-50'
                        }`}
                      >
                        {participant.name || participant.email || '알 수 없음'}
                        {participant.role && (
                          <span className="ml-1 text-[10px] text-neutral-500">({getRoleLabel(participant.role)})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 정산 비용 상세 영역 */}
              {selectedParticipantId && (() => {
                const participant = participants.find((p) => p.id === selectedParticipantId);
                const settlementDetail = calculateParticipantSettlement(selectedParticipantId);

                if (!settlementDetail || settlementDetail.items.length === 0) {
                  return (
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
                      <p className="text-sm text-neutral-500">
                        {participant?.name || '선택한 참가자'}님은 정산 대상자가 아닙니다.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
                      <h4 className="mb-2 text-sm font-semibold text-primary-900">
                        {participant?.name || participant?.email || '알 수 없음'}
                        {participant?.role && (
                          <span className="ml-2 text-xs font-normal text-primary-700">
                            ({getRoleLabel(participant.role)})
                          </span>
                        )}
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {settlementDetail.items.map((item, index) => (
                        <div key={index} className="rounded-lg border border-neutral-200 bg-white p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-semibold text-neutral-900">{item.name}</h5>
                            <p className="text-base font-bold text-primary-600">
                              {item.amount.toLocaleString()}원
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-neutral-100">
                            <p className="text-xs text-neutral-500">
                              총액: {item.totalAmount.toLocaleString()}원 / {item.participantCount}명 분할
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t-2 border-neutral-300" style={{ marginBottom: '2rem' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-neutral-900">총 정산 비용</span>
                        <span className="text-xl font-bold text-primary-600">
                          {settlementDetail.total.toLocaleString()}원
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

export default SettlementManager;

