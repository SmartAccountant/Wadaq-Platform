import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';

export default function KeyboardShortcuts() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  React.useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if user is typing in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // F2 - Search (focus search input)
      if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="بحث"], input[placeholder*="Search"]');
        if (searchInput) {
          searchInput.focus();
        }
      }

      // F3 - New Invoice
      if (e.key === 'F3') {
        e.preventDefault();
        navigate(createPageUrl('Invoices') + '?action=new');
      }

      // F4 - New Product
      if (e.key === 'F4') {
        e.preventDefault();
        const addButton = document.querySelector('[data-shortcut="add-product"]');
        if (addButton) {
          addButton.click();
        }
      }

      // F5 - Refresh (allow default)
      // F6 - New Customer
      if (e.key === 'F6') {
        e.preventDefault();
        const addButton = document.querySelector('[data-shortcut="add-customer"]');
        if (addButton) {
          addButton.click();
        }
      }

      // F9 - Save (trigger save button)
      if (e.key === 'F9') {
        e.preventDefault();
        const saveButton = document.querySelector('button[type="submit"], button[data-shortcut="save"]');
        if (saveButton && !saveButton.disabled) {
          saveButton.click();
        }
      }

      // Ctrl/Cmd + K - Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate(createPageUrl('Dashboard'));
      }

      // Ctrl/Cmd + I - Invoices
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        navigate(createPageUrl('Invoices'));
      }

      // Ctrl/Cmd + P - Products
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        navigate(createPageUrl('Products'));
      }

      // Ctrl/Cmd + U - Customers
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        navigate(createPageUrl('Customers'));
      }

      // Ctrl/Cmd + R - Reports
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        navigate(createPageUrl('Reports'));
      }

      // ESC - Close modals/dialogs
      if (e.key === 'Escape') {
        const closeButton = document.querySelector('[data-close-modal], [data-close-dialog]');
        if (closeButton) {
          closeButton.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  return null;
}

// Keyboard shortcuts help component
export function KeyboardShortcutsHelp() {
  const { language } = useLanguage();
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShow(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!show) return null;

  const shortcuts = [
    { key: 'F2', description: language === 'ar' ? 'بحث' : 'Search' },
    { key: 'F3', description: language === 'ar' ? 'فاتورة جديدة' : 'New Invoice' },
    { key: 'F4', description: language === 'ar' ? 'منتج جديد' : 'New Product' },
    { key: 'F6', description: language === 'ar' ? 'عميل جديد' : 'New Customer' },
    { key: 'F9', description: language === 'ar' ? 'حفظ' : 'Save' },
    { key: 'Ctrl+K', description: language === 'ar' ? 'لوحة التحكم' : 'Dashboard' },
    { key: 'Ctrl+I', description: language === 'ar' ? 'الفواتير' : 'Invoices' },
    { key: 'Ctrl+P', description: language === 'ar' ? 'المنتجات' : 'Products' },
    { key: 'Ctrl+U', description: language === 'ar' ? 'العملاء' : 'Customers' },
    { key: 'ESC', description: language === 'ar' ? 'إغلاق' : 'Close' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShow(false)}
    >
      <div 
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white mb-4">
          {language === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
        </h3>
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-white">{shortcut.description}</span>
              <kbd className="px-3 py-1 bg-white/20 rounded-lg text-white font-mono text-sm">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-slate-400 text-sm mt-4 text-center">
          {language === 'ar' ? 'اضغط Shift + ? لإخفاء' : 'Press Shift + ? to hide'}
        </p>
      </div>
    </div>
  );
}