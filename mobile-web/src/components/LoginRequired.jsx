import React from 'react';
import { Link } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';

const LoginRequired = ({ 
  message = "로그인 후 이용 가능합니다.",
  description = "이 기능을 사용하려면 로그인이 필요합니다."
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-emerald-600 mb-6">
            <FaLock className="mx-auto h-16 w-16" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">{message}</h3>
          <p className="text-gray-600 mb-8">{description}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/login"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex-1"
            >
              로그인
            </Link>
            <Link
              to="/register"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors flex-1"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRequired;