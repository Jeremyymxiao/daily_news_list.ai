import { ButtonProps } from '@/types';
import { cn } from '@/lib/utils';

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  children,
  ...props
}: ButtonProps) => {
  const baseStyles = 'rounded-full font-medium transition-all duration-200 flex items-center justify-center';
  
  const variants = {
    primary: 'bg-black text-white hover:bg-black/90 disabled:bg-black/70',
    secondary: 'bg-gray-100 text-black hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg'
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        loading && 'opacity-70 cursor-wait',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}; 