import React from 'react';

/**
 * 재사용 가능한 카드 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} props.children - 카드 내용
 * @param {string} props.className - 추가 CSS 클래스
 * @param {boolean} props.shadow - 그림자 효과 여부
 * @param {string} props.padding - 패딩 크기 (sm, md, lg)
 */
const Card = ({
  children,
  className = '',
  shadow = true,
  padding = 'md',
  ...props
}) => {
  const baseClasses = 'bg-white rounded-lg border border-gray-200';
  const shadowClasses = shadow ? 'shadow-sm' : '';
  
  const paddingClasses = {
    sm: 'p-2 sm:p-3',
    md: 'p-3 sm:p-4',
    lg: 'p-4 sm:p-6',
  };
  
  const classes = `${baseClasses} ${shadowClasses} ${paddingClasses[padding]} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

/**
 * 카드 헤더 컴포넌트
 */
const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`border-b border-gray-200 pb-2 sm:pb-3 mb-3 sm:mb-4 ${className}`} {...props}>
    {children}
  </div>
);

/**
 * 카드 제목 컴포넌트
 */
const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-base sm:text-lg font-semibold text-gray-900 ${className}`} {...props}>
    {children}
  </h3>
);

/**
 * 카드 내용 컴포넌트
 */
const CardContent = ({ children, className = '', ...props }) => (
  <div className={`text-gray-600 ${className}`} {...props}>
    {children}
  </div>
);

/**
 * 카드 푸터 컴포넌트
 */
const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`border-t border-gray-200 pt-2 sm:pt-3 mt-3 sm:mt-4 ${className}`} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
