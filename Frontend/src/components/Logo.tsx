import { useState } from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  textColor?: string;
}

export default function Logo({ className = "w-9 h-9", showText = false, textColor = "text-white" }: LogoProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-center gap-2.5">
      {!imgError ? (
        <img 
          src="/assets/logo.svg" 
          alt="LearnSphere Logo" 
          className={`${className} object-contain transition-transform duration-300`}
          onError={() => setImgError(true)} 
        />
      ) : (
        <svg 
          className={`${className} shrink-0`} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M50 15 L88 34 L50 53 L12 34 Z" fill="#0F8B8D" />
          <path d="M26 44.5 V58 C26 66 36 72 50 72 C64 72 74 66 74 58 V44.5 L50 56 Z" fill="#143642" />
          <path d="M50 34 L78 45 V63" stroke="#EC9A29" strokeWidth="3" strokeLinecap="round" />
          <circle cx="78" cy="63" r="4.5" fill="#EC9A29" />
        </svg>
      )}
      {showText && (
        <span className={`font-display font-black text-lg tracking-wide ${textColor}`}>
          LearnSphere
        </span>
      )}
    </div>
  );
}
