import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import LoginRequired from '../../components/LoginRequired';

const RecordsPage = () => {
  const { isAuthenticated } = useAuth();

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <LoginRequired 
        message="로그인 후 이용가능합니다"
        description="기록을 보려면 로그인이 필요합니다."
      />
    );
  }

  // 로그인한 경우 - 기록 페이지 내용 (추후 구현)
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">기록</h1>
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <p className="text-neutral-600">기록 페이지는 준비 중입니다.</p>
        </div>
      </div>
    </div>
  );
};

export default RecordsPage;

