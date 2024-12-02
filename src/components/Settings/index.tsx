import { Button } from '../ui/Button';

interface SettingsProps {
  language: 'zh' | 'en';
  onLanguageChange: (lang: 'zh' | 'en') => void;
}

export const Settings = ({ language, onLanguageChange }: SettingsProps) => {
  return (
    <div className="fixed top-4 right-4 flex items-center gap-2">
      <Button
        variant={language === 'zh' ? 'primary' : 'secondary'}
        size="sm"
        onClick={() => onLanguageChange('zh')}
      >
        中文
      </Button>
      <Button
        variant={language === 'en' ? 'primary' : 'secondary'}
        size="sm"
        onClick={() => onLanguageChange('en')}
      >
        English
      </Button>
    </div>
  );
}; 