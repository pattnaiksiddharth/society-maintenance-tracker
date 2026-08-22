import React from 'react';

interface FrostedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glow' | 'danger' | 'highlight';
  hoverEffect?: boolean;
}

export const FrostedCard: React.FC<FrostedCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hoverEffect = false,
  ...props
}) => {
  let baseStyle = 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl';

  if (variant === 'danger') {
    baseStyle = 'bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-3xl';
  } else if (variant === 'glow') {
    baseStyle = 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-500/20 rounded-3xl';
  } else if (variant === 'highlight') {
    baseStyle = 'bg-white/10 backdrop-blur-xl border border-blue-500/30 rounded-3xl';
  }

  const hoverStyle = hoverEffect ? 'transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-blue-500/5' : '';

  return (
    <div className={`${baseStyle} ${hoverStyle} ${className}`} {...props}>
      {children}
    </div>
  );
};
