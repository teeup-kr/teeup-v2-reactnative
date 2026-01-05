import React from 'react';
import { useSearchParams } from 'react-router-dom';

const DriveTokenCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';
  const state = searchParams.get('state') || '';

  const copy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Google Drive 토큰 발급 코드</h2>
          <p className="text-gray-600 mb-4">아래 <b>code</b> 값을 복사해 터미널 스크립트의 2번 단계에 붙여넣으세요.</p>

          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">code</div>
            <div className="flex items-center gap-2">
              <pre className="flex-1 bg-gray-100 p-3 rounded overflow-auto text-sm">{code || '(없음)'}</pre>
              <button onClick={() => copy(code)} className="px-3 py-2 bg-blue-600 text-white rounded">복사</button>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">state</div>
            <div className="flex items-center gap-2">
              <pre className="flex-1 bg-gray-100 p-3 rounded overflow-auto text-sm">{state || '(없음)'}</pre>
              <button onClick={() => copy(state)} className="px-3 py-2 bg-gray-600 text-white rounded">복사</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriveTokenCallbackPage;


