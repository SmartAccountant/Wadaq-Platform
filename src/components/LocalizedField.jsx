import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Languages, Loader2 } from 'lucide-react';
import { Wadaq } from '@/api/WadaqClient';
import { useLanguage } from '@/components/LanguageContext';

export default function LocalizedField({
  label,
  labelEn,
  value,
  valueEn,
  onChange,
  onChangeEn,
  placeholder,
  placeholderEn,
  type = 'text',
  multiline = false,
  className = ''
}) {
  const [translating, setTranslating] = React.useState(false);
  const { language } = useLanguage();

  const handleAutoTranslate = async () => {
    if (!value && !valueEn) return;
    
    setTranslating(true);
    try {
      if (value && !valueEn) {
        // Translate Arabic to English
        const response = await Wadaq.functions.invoke('translateText', {
          text: value,
          from_lang: 'Arabic',
          to_lang: 'English'
        });
        onChangeEn(response.data.translation);
      } else if (valueEn && !value) {
        // Translate English to Arabic
        const response = await Wadaq.functions.invoke('translateText', {
          text: valueEn,
          from_lang: 'English',
          to_lang: 'Arabic'
        });
        onChange(response.data.translation);
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslating(false);
    }
  };

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">
          {language === 'ar' ? label : labelEn}
        </Label>
        {(value || valueEn) && (value ? !valueEn : !value) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAutoTranslate}
            disabled={translating}
            className="h-7 text-xs text-blue-600 hover:text-blue-700"
          >
            {translating ? (
              <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />
            ) : (
              <Languages className="w-3.5 h-3.5 ml-1" strokeWidth={1.5} />
            )}
            {language === 'ar' ? 'ترجمة تلقائية' : 'Auto Translate'}
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <InputComponent
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
          <p className="text-xs text-gray-400 mt-1 font-light">
            {language === 'ar' ? 'عربي' : 'Arabic'}
          </p>
        </div>
        
        <div>
          <InputComponent
            placeholder={placeholderEn}
            value={valueEn || ''}
            onChange={(e) => onChangeEn(e.target.value)}
            className="text-sm"
            dir="ltr"
          />
          <p className="text-xs text-gray-400 mt-1 font-light">
            {language === 'ar' ? 'إنجليزي' : 'English'}
          </p>
        </div>
      </div>
    </div>
  );
}