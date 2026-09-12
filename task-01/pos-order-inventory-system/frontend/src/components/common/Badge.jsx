import React from 'react';

const badgeVariants = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
  info: 'bg-blue-50 text-blue-700 border-blue-200/80',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
};

const dotColors = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-blue-500',
  purple: 'bg-purple-500',
  neutral: 'bg-slate-400',
};

const Badge = ({
  children,
  variant = 'neutral',
  dot = false,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${badgeVariants[variant] || badgeVariants.neutral} ${sizeClasses} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.neutral} shrink-0 animate-pulse`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
