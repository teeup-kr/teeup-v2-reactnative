import React from 'react';
import { FaTimes, FaCheckCircle, FaClock } from 'react-icons/fa';

const RoundingCompleteModal = ({ isOpen, onClose, onInputNow, onInputLater }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 sm:px-6 sm:py-4 rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900">라운딩 종료</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 sm:p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <FaTimes className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          <p className="text-sm sm:text-base text-neutral-700 mb-4 sm:mb-6">
            라운딩을 종료하시겠습니까?
            <br />
            점수 입력은 지금 하거나 나중에 마이페이지에서 할 수 있습니다.
          </p>

          <div className="space-y-2 sm:space-y-3">
            {/* 지금 입력하기 버튼 */}
            <button
              type="button"
              onClick={() => {
                onInputNow();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-xl bg-primary-600 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-primary-700 active:bg-primary-800"
            >
              <FaCheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              지금 입력하기
            </button>

            {/* 나중에 입력하기 버튼 */}
            <button
              type="button"
              onClick={() => {
                onInputLater();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
            >
              <FaClock className="h-4 w-4 sm:h-5 sm:w-5" />
              나중에 입력하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundingCompleteModal;

