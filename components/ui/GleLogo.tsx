import React from 'react';
import logoImg from '../../assets/logo.jpg';  // Ajusta la ruta según donde esté tu componente

interface GleLogoProps {
    className?: string;
    style?: React.CSSProperties;
    logo?: string | null;
}

const GleLogo: React.FC<GleLogoProps> = ({ className, style, logo }) => {
    const finalLogo = logo ?? logoImg;

    if (finalLogo) {
        return (
            <img
                src={finalLogo}
                alt="Company Logo"
                className={className}
                style={{ ...style, objectFit: 'contain' }}
            />
        );
    }

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
