export interface Keyword {
  id: string;
  text: string;
  selected: boolean;
}

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  date: string;
  source: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
} 