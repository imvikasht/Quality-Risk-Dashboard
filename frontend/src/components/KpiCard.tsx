import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: string; // Tailwind class
  onClick?: () => void;
  selected?: boolean;
}

export const KpiCard: React.FC<Props> = ({ title, value, icon: Icon, trend, color = 'text-blue-600', onClick, selected = false }) => {
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border p-6 flex items-center justify-between transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : ''
      } ${selected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : 'border-gray-100'}`}
      onClick={onClick}
    >
      <div>
        <p className={`text-sm font-medium uppercase tracking-wider ${selected ? 'text-blue-700' : 'text-gray-500'}`}>{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        
        {trend && (
          <div className="mt-2 flex items-center text-sm">
            <span className={`font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}
            </span>
            <span className="ml-2 text-gray-500">from last month</span>
          </div>
        )}
      </div>
      <div className={`p-4 rounded-full bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
  );
};
