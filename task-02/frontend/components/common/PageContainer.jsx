import React from 'react';

export const PageContainer = ({
  children,
  size = 'default',
  className = '',
  as: Component = 'div',
  ...props
}) => {
  const maxWidthMap = {
    sm: 'max-w-3xl',
    default: 'max-w-6xl',
    lg: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <Component
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${maxWidthMap[size] || maxWidthMap.default} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default PageContainer;
