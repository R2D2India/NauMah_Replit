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
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0 data-[state=open]:bg-muted">
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('language.select')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => changeLanguage('en')}
          className={language === 'en' ? 'bg-muted font-medium' : ''}
        >
          <div className="flex items-center">
            <span className="mr-2">🇬🇧</span> {t('language.en')}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage('hi')}
          className={language === 'hi' ? 'bg-muted font-medium' : ''}
        >
          <div className="flex items-center">
            <span className="mr-2">🇮🇳</span> {t('language.hi')}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;