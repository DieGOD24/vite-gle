
import React, { useState, useEffect } from 'react';

interface ActiveVisit {
    clientName: string;
    startTime: number;
}

interface ActiveVisitBannerProps {
    activeVisit: ActiveVisit;
    onEndVisit: () => void;
}

const ActiveVisitBanner: React.FC<ActiveVisitBannerProps> = ({ activeVisit, onEndVisit }) => {
    const [elapsedTime, setElapsedTime] = useState('00:00:00');

    useEffect(() => {
        const timerId = setInterval(() => {
            const elapsed = Date.now() - activeVisit.startTime;
            const hours = String(Math.floor(elapsed / 3600000)).padStart(2, '0');
            const minutes = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, '0');
            const seconds = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
            setElapsedTime(`${hours}:${minutes}:${seconds}`);
        }, 1000);

        return () => clearInterval(timerId);
    }, [activeVisit.startTime]);

    return (
        <div className="bg-gle-red text-white p-3 shadow-lg z-20 flex justify-center items-center animate-pulse">
            <div className="flex justify-between items-center w-full px-4">
                <div className="flex items-center space-x-4">
                    <i className="fas fa-clock"></i>
                    <div>
                        <span className="font-bold">Visita activa:</span> {activeVisit.clientName}
                    </div>
                    <div className="font-mono bg-red-700 px-2 py-1 rounded text-sm">
                        {elapsedTime}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ActiveVisitBanner;
