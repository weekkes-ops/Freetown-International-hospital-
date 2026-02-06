import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <svg viewBox="0 0 450 450" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Teal Bar - Top Left */}
        <rect x="70" y="100" width="120" height="35" transform="rotate(-40 70 100)" fill="#1d96a8" />
        
        {/* Tan Bar - Middle Left */}
        <rect x="115" y="165" width="85" height="35" transform="rotate(-40 115 165)" fill="#bca06c" />
        
        {/* Grey Bar - Top Middle */}
        <rect x="220" y="110" width="80" height="30" transform="rotate(-40 220 110)" fill="#d3cdc0" />
        
        {/* Light Grey/Tan Bar - Upper Center */}
        <rect x="180" y="215" width="40" height="35" transform="rotate(-40 180 215)" fill="#d3cdc0" />
        
        {/* Main Red Stylized 'A' Shape */}
        <path d="M190 155L245 235L215 285L245 315L275 255L355 315L385 270L320 200L260 185L190 155Z" fill="#d84c3e" />
        
        {/* Olive Bar - Right Middle */}
        <rect x="365" y="200" width="60" height="35" transform="rotate(-40 365 200)" fill="#737e42" />
        
        {/* Olive Bar - Lower Right */}
        <rect x="245" y="310" width="110" height="35" transform="rotate(-40 245 310)" fill="#737e42" />
        
        {/* Orange Bar - Bottom Right */}
        <rect x="270" y="380" width="85" height="35" transform="rotate(-40 270 380)" fill="#e19830" />
      </svg>
    </div>
  );
};

export default Logo;