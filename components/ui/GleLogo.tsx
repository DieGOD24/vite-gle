import React from 'react';

interface GleLogoProps {
    className?: string;
    style?: React.CSSProperties;
    logo?: string | null;
}

const GleLogo: React.FC<GleLogoProps> = ({ className, style, logo }) => {
    if (logo) {
        return <img src={logo} alt="Company Logo" className={className} style={{ ...style, objectFit: 'contain' }} />;
    }
    
    // Default text-based logo
    return (
        <div className={className} style={style}>
            <span 
                className="font-black text-gle-red text-shadow-outline"
                style={{ fontSize: 'clamp(2rem, 10vw, 4rem)', lineHeight: 1 }}
                aria-label="GLE Logo"
            >
                GLE
            </span>
        </div>
    );
};

export default GleLogo;
