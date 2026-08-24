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
}

export const KpiCard: React.FC<Props> = ({ title, value, icon: Icon, trend, color = 'text-blue-600' }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
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
