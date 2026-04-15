import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  iconGradient?: string;
  iconBgGradient?: string;
}

export function PageHeader({ 
  icon: Icon, 
  title, 
  subtitle, 
  iconGradient = 'from-purple-600 to-indigo-600',
  iconBgGradient = 'from-purple-50 to-indigo-50'
}: PageHeaderProps) {
  return (
    <div className="flex items-start gap-4 mb-8">
      <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${iconBgGradient} flex items-center justify-center shadow-lg border-2 border-white flex-shrink-0`}>
        <Icon className={`h-8 w-8 bg-gradient-to-br ${iconGradient} text-transparent`} style={{
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
        }} />
      </div>
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
