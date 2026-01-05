import React from 'react';

/**
 * 재사용 가능한 입력 필드 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.type - 입력 타입 (text, email, password, number 등)
 * @param {string} props.placeholder - 플레이스홀더 텍스트
 * @param {string} props.value - 입력 값
 * @param {Function} props.onChange - 값 변경 핸들러
 * @param {string} props.label - 라벨 텍스트
 * @param {string} props.error - 에러 메시지
 * @param {boolean} props.required - 필수 입력 여부
 * @param {boolean} props.disabled - 비활성화 상태
 * @param {string} props.className - 추가 CSS 클래스
 * @param {string} props.id - 입력 필드 ID
 * @param {string} props.name - 입력 필드 이름
 */
const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  error,
  required = false,
  disabled = false,
  className = '',
  id,
  name,
  ...props
}) => {
  const inputId = id || name;
  
  const baseClasses = 'block w-full px-3 py-2 sm:px-3 sm:py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base';
  const errorClasses = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300';
  const classes = `${baseClasses} ${errorClasses} ${className}`;
  
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs sm:text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        id={inputId}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={classes}
        {...props}
      />
      {error && (
        <p className="text-xs sm:text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
