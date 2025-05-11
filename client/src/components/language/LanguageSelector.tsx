import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/use-language';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  
  // Direct language change handlers to avoid any closure issues
  const handleChangeToEnglish = () => {
    console.log('Direct change to English');
    i18n.changeLanguage('en');
    document.documentElement.classList.remove('lang-hi');
    document.documentElement.classList.add('lang-en');
    // Also store in localStorage for persistence
    localStorage.setItem('preferredLanguage', 'en');
  };
  
  const handleChangeToHindi = () => {
    console.log('Direct change to Hindi');
    i18n.changeLanguage('hi');
    document.documentElement.classList.remove('lang-en');
    document.documentElement.classList.add('lang-hi');
    // Also store in localStorage for persistence
    localStorage.setItem('preferredLanguage', 'hi');
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0 data-[state=open]:bg-muted">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={handleChangeToEnglish}
          className={i18n.language === 'en' ? 'bg-muted font-medium' : ''}
        >
          <div className="flex items-center">
            <span className="mr-2">🇬🇧</span> English
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleChangeToHindi}
          className={i18n.language === 'hi' ? 'bg-muted font-medium' : ''}
        >
          <div className="flex items-center">
            <span className="mr-2">🇮🇳</span> हिन्दी
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;