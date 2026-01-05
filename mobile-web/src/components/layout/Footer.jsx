import React from 'react';

const Footer = ({ className = '' }) => {
  return (
    <footer className={`bg-gray-50 border-t border-gray-200 py-3 sm:py-4 ${className}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center text-xs sm:text-sm text-gray-500">
          <p>&copy; 2025 티업링크. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
