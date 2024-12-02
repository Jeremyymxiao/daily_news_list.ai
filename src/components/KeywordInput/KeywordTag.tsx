import { Keyword } from '@/types';
import { cn } from '@/lib/utils';

interface KeywordTagProps {
  keyword: Keyword;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export const KeywordTag = ({ keyword, onToggle, onRemove }: KeywordTagProps) => {
  return (
    <div
      className={cn(
        'group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200',
        'text-sm font-medium',
        keyword.selected
          ? 'bg-black text-white border-black'
          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
      )}
    >
      <input
        type="checkbox"
        checked={keyword.selected}
        onChange={() => onToggle(keyword.id)}
        className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black"
      />
      <span>{keyword.text}</span>
      <button
        onClick={() => onRemove(keyword.id)}
        className={cn(
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'ml-1 p-0.5 rounded-full hover:bg-black/10',
          keyword.selected && 'hover:bg-white/10'
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}; 