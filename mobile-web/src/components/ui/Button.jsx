import React from 'react';

/**
 * 재사용 가능한 버튼 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} props.children - 버튼 내용
 * @param {string} props.variant - 버튼 스타일 변형 (primary, secondary, danger, outline)
 * @param {string} props.size - 버튼 크기 (sm, md, lg)
 * @param {boolean} props.disabled - 비활성화 상태
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.className - 추가 CSS 클래스
 * @param {Function} props.onClick - 클릭 이벤트 핸들러
 * @param {string} props.type - 버튼 타입 (button, submit, reset)
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-emerald-500',
  };
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm',
    md: 'px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm',
    lg: 'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
