import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'gle-red' | 'gle-gray' | 'gle-blue';
  comparisonValue?: number; // e.g., 10 for +10%, -5 for -5%
  comparisonPeriod?: string; // e.g., "vs. mes anterior"
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color, comparisonValue, comparisonPeriod }) => {
  const isPositive = comparisonValue !== undefined && comparisonValue >= 0;
  const comparisonText = comparisonValue !== undefined 
    ? `${isPositive ? '+' : ''}${comparisonValue.toFixed(1)}% ${comparisonPeriod || ''}`
    : null;
  const comparisonColor = isPositive ? 'text-green-600' : 'text-red-600';

  const valueStr = String(value);
  // Adjust font size based on the length of the value string to prevent overflow
  const valueFontSize = valueStr.length > 9 ? 'text-2xl' : 'text-3xl';

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center text-center w-full h-full">
      <div className={`text-white rounded-full h-14 w-14 flex items-center justify-center shrink-0 bg-${color} text-2xl mb-3`}>
        <i className={`fas ${icon}`}></i>
      </div>
      
      <div className="flex flex-col items-center justify-center">
        <p className="text-gray-500 text-sm font-medium leading-tight">{title}</p>
        <p className={`${valueFontSize} font-bold text-gle-gray-dark break-all my-1`}>{value}</p>
        {comparisonText && (
            <p className={`text-xs font-semibold ${comparisonColor}`}>{comparisonText}</p>
        )}
      </div>
    </div>
  );
};

export default KpiCard;