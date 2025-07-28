import React from 'react';

interface WalletIconProps {
  className?: string;
  size?: number;
}

const WalletIcon: React.FC<WalletIconProps> = ({ className = '', size = 16 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M21 18V6c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM7 6h12v2H7V6zm0 4h12v8H5V6h2v4z"/>
      <circle cx="16" cy="12" r="1"/>
    </svg>
  );
};

export default WalletIcon; 