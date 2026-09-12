import React from 'react';

const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-subtle ${
        hover ? 'hover:shadow-card-hover hover:border-slate-300 transition-all duration-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  title,
  description,
  action,
  icon: Icon,
  className = '',
  children,
}) => {
  if (children) {
    return <div className={`p-5 pb-3 border-b border-slate-100 ${className}`}>{children}</div>;
  }

  return (
    <div className={`p-5 pb-3 border-b border-slate-100 flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          {title && <h3 className="text-base font-semibold text-slate-800">{title}</h3>}
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardBody = ({ children, className = '' }) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`p-4 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl ${className}`}>
      {children}
    </div>
  );
};

export default Card;
