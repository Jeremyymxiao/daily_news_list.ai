'use client';

import { cn } from '@/lib/utils';

interface Props {
  text: string;
  selected: boolean;
  onRemove: () => void;
  onToggle: () => void;
}

export function KeywordTag({ text, selected, onRemove, onToggle }: Props) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors cursor-pointer",
        selected
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      )}
      onClick={onToggle}
    >
      <span>{text}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-1 hover:text-white/80"
      >
        <XIcon className="w-3 h-3" />
      </button>
    </div>
  );
}

const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    height="24"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="24"
  >
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
); 