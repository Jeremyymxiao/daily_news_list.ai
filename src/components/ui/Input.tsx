import { InputProps } from '@/types';
import { cn } from '@/lib/utils';

export const Input = ({
  className,
  label,
  error,
  ...props
}: InputProps) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-4 py-2 rounded-lg border border-gray-200',
          'focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20',
          'placeholder:text-gray-400',
          'transition-all duration-200',
          error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}; 