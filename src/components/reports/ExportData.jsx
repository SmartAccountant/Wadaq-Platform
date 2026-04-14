import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import * as XLSX from 'xlsx';

export default function ExportData({ data, filename, title }) {
  const { language } = useLanguage();
  const [exporting, setExporting] = React.useState(false);

  const exportToJSON = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    downloadFile(blob, `${filename}.json`);
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title || 'Data');
      
      // Auto-size columns
      const maxWidth = data.reduce((w, r) => {
        return Math.max(w, ...Object.keys(r).map(k => String(r[k]).length));
      }, 10);
      ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }));
      
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(language === 'ar' ? 'فشل التصدير إلى Excel' : 'Failed to export to Excel');
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      downloadFile(blob, `${filename}.csv`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert(language === 'ar' ? 'فشل التصدير إلى CSV' : 'Failed to export to CSV');
    }
  };

  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={exportToJSON}
        variant="outline"
        size="sm"
        disabled={exporting}
      >
        <FileJson className="w-4 h-4 ml-2" />
        JSON
      </Button>
      <Button
        onClick={exportToExcel}
        variant="outline"
        size="sm"
        disabled={exporting}
      >
        <FileSpreadsheet className="w-4 h-4 ml-2" />
        Excel
      </Button>
      <Button
        onClick={exportToCSV}
        variant="outline"
        size="sm"
        disabled={exporting}
      >
        <FileText className="w-4 h-4 ml-2" />
        CSV
      </Button>
    </div>
  );
}