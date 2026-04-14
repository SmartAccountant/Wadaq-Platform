import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, Users, Package, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";
import { Wadaq } from "@/api/WadaqClient";
import { useLanguage } from "@/components/LanguageContext";
import { Badge } from "@/components/ui/badge";

export default function ImportData() {
  const { language } = useLanguage();
  const [importType, setImportType] = useState("customers");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [columns, setColumns] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const customerFields = [
    { key: "name", label: language === 'ar' ? "الاسم (عربي) *" : "Name (Arabic) *", required: true },
    { key: "name_en", label: language === 'ar' ? "الاسم (إنجليزي)" : "Name (English)" },
    { key: "phone", label: language === 'ar' ? "الهاتف" : "Phone" },
    { key: "email", label: language === 'ar' ? "البريد الإلكتروني" : "Email" },
    { key: "address", label: language === 'ar' ? "العنوان (عربي)" : "Address (Arabic)" },
    { key: "address_en", label: language === 'ar' ? "العنوان (إنجليزي)" : "Address (English)" },
    { key: "tax_number", label: language === 'ar' ? "الرقم الضريبي" : "Tax Number" },
  ];

  const productFields = [
    { key: "name", label: language === 'ar' ? "اسم المنتج (عربي) *" : "Product Name (Arabic) *", required: true },
    { key: "name_en", label: language === 'ar' ? "اسم المنتج (إنجليزي)" : "Product Name (English)" },
    { key: "code", label: language === 'ar' ? "رمز المنتج" : "Product Code" },
    { key: "barcode", label: language === 'ar' ? "الباركود" : "Barcode" },
    { key: "category", label: language === 'ar' ? "التصنيف" : "Category" },
    { key: "brand", label: language === 'ar' ? "العلامة التجارية" : "Brand" },
    { key: "cost_price", label: language === 'ar' ? "سعر التكلفة" : "Cost Price" },
    { key: "selling_price", label: language === 'ar' ? "سعر البيع *" : "Selling Price *", required: true },
    { key: "quantity", label: language === 'ar' ? "الكمية" : "Quantity" },
    { key: "unit", label: language === 'ar' ? "الوحدة" : "Unit" },
  ];

  const currentFields = importType === "customers" ? customerFields : productFields;

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      alert(language === 'ar' ? 'يرجى اختيار ملف CSV أو Excel' : 'Please select a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    setUploading(true);
    setImportResult(null);

    try {
      const { file_url } = await Wadaq.integrations.Core.UploadFile({ file: selectedFile });
      setFileUrl(file_url);

      // Extract first row to detect columns
      const schema = {
        type: "array",
        items: {
          type: "object",
          additionalProperties: { type: "string" }
        }
      };

      const result = await Wadaq.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });

      if (result.status === "success" && result.output?.length > 0) {
        const firstRow = result.output[0];
        const detectedColumns = Object.keys(firstRow);
        setColumns(detectedColumns);

        // Auto-map columns by similarity
        const autoMapping = {};
        detectedColumns.forEach(col => {
          const colLower = col.toLowerCase().trim();
          const match = currentFields.find(f => {
            const fieldLower = f.label.toLowerCase();
            return fieldLower.includes(colLower) || colLower.includes(f.key);
          });
          if (match) {
            autoMapping[col] = match.key;
          }
        });
        setColumnMapping(autoMapping);
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert(language === 'ar' ? 'فشل رفع الملف' : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!fileUrl) return;

    // Validate required mappings
    const requiredFields = currentFields.filter(f => f.required);
    const missingRequired = requiredFields.filter(f => 
      !Object.values(columnMapping).includes(f.key)
    );

    if (missingRequired.length > 0) {
      alert(
        language === 'ar' 
          ? `يرجى ربط الحقول المطلوبة: ${missingRequired.map(f => f.label).join(', ')}`
          : `Please map required fields: ${missingRequired.map(f => f.label).join(', ')}`
      );
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      // Extract data with proper schema
      const schema = {
        type: "array",
        items: {
          type: "object",
          additionalProperties: { type: "string" }
        }
      };

      const result = await Wadaq.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: schema
      });

      if (result.status !== "success" || !result.output) {
        throw new Error(result.details || 'Failed to extract data');
      }

      // Map and transform data
      const mappedData = result.output.map(row => {
        const mapped = {};
        Object.entries(columnMapping).forEach(([fileCol, dbField]) => {
          let value = row[fileCol];
          
          // Convert numeric fields
          if (['cost_price', 'selling_price', 'quantity'].includes(dbField)) {
            value = value ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0 : 0;
          }
          
          mapped[dbField] = value;
        });
        return mapped;
      });

      // Filter valid rows (must have required fields)
      const validData = mappedData.filter(item => {
        return requiredFields.every(f => item[f.key]);
      });

      if (validData.length === 0) {
        throw new Error(language === 'ar' ? 'لا توجد بيانات صالحة للاستيراد' : 'No valid data to import');
      }

      // Bulk create
      const entity = importType === "customers" ? "Customer" : "Product";
      await Wadaq.entities[entity].bulkCreate(validData);

      setImportResult({
        success: true,
        total: result.output.length,
        imported: validData.length,
        skipped: result.output.length - validData.length
      });

      // Reset after success
      setTimeout(() => {
        setFile(null);
        setFileUrl("");
        setColumns([]);
        setColumnMapping({});
      }, 3000);

    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        error: error.message
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const fields = importType === "customers" 
      ? ["Name", "Name_EN", "Phone", "Email", "Address", "Tax_Number"]
      : ["Product_Name", "Product_Name_EN", "Code", "Barcode", "Category", "Brand", "Cost_Price", "Selling_Price", "Quantity", "Unit"];
    
    const csvContent = fields.join(",") + "\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${importType}_template.csv`);
    link.click();
  };

  return (
    <Card className="border-t-4 border-t-emerald-600">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {language === 'ar' ? 'استيراد البيانات بالجملة' : 'Bulk Import Data'}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              {language === 'ar' ? 'استيراد العملاء والمنتجات من Excel أو CSV' : 'Import customers and products from Excel or CSV'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Import Type Selection */}
        <div className="space-y-2">
          <Label className="font-semibold">{language === 'ar' ? 'نوع البيانات' : 'Data Type'}</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={importType === "customers" ? "default" : "outline"}
              onClick={() => {
                setImportType("customers");
                setFile(null);
                setFileUrl("");
                setColumns([]);
                setColumnMapping({});
                setImportResult(null);
              }}
              className="h-20 flex-col gap-2"
            >
              <Users className="w-6 h-6" />
              <span>{language === 'ar' ? 'العملاء' : 'Customers'}</span>
            </Button>
            <Button
              type="button"
              variant={importType === "products" ? "default" : "outline"}
              onClick={() => {
                setImportType("products");
                setFile(null);
                setFileUrl("");
                setColumns([]);
                setColumnMapping({});
                setImportResult(null);
              }}
              className="h-20 flex-col gap-2"
            >
              <Package className="w-6 h-6" />
              <span>{language === 'ar' ? 'المنتجات' : 'Products'}</span>
            </Button>
          </div>
        </div>

        {/* Download Template */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                {language === 'ar' ? 'نموذج الملف' : 'File Template'}
              </p>
              <p className="text-xs text-blue-700">
                {language === 'ar' 
                  ? 'قم بتنزيل النموذج لمعرفة التنسيق الصحيح للبيانات'
                  : 'Download the template to see the correct data format'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 ml-2" />
              {language === 'ar' ? 'تنزيل' : 'Download'}
            </Button>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <Label className="font-semibold">{language === 'ar' ? 'رفع الملف' : 'Upload File'}</Label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            {!file ? (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
                <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="text-sm text-slate-600 mb-1">
                  {language === 'ar' ? 'اضغط لرفع ملف CSV أو Excel' : 'Click to upload CSV or Excel file'}
                </p>
                <p className="text-xs text-slate-500">
                  {language === 'ar' ? 'يدعم .csv, .xlsx, .xls' : 'Supports .csv, .xlsx, .xls'}
                </p>
              </label>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                <div className="text-right">
                  <p className="font-medium text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                {uploading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
              </div>
            )}
          </div>
        </div>

        {/* Column Mapping */}
        {columns.length > 0 && (
          <div className="space-y-3">
            <Label className="font-semibold">
              {language === 'ar' ? 'ربط الأعمدة' : 'Column Mapping'}
            </Label>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              {columns.map((col) => (
                <div key={col} className="grid grid-cols-2 gap-3 items-center">
                  <div className="text-sm font-medium text-slate-700 bg-white px-3 py-2 rounded border border-slate-200">
                    {col}
                  </div>
                  <Select
                    value={columnMapping[col] || ""}
                    onValueChange={(value) => {
                      setColumnMapping(prev => ({ ...prev, [col]: value }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر الحقل' : 'Select field'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>
                        {language === 'ar' ? 'تجاهل' : 'Skip'}
                      </SelectItem>
                      {currentFields.map(field => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import Button */}
        {columns.length > 0 && (
          <Button
            onClick={handleImport}
            disabled={importing}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                {language === 'ar' ? 'جاري الاستيراد...' : 'Importing...'}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 ml-2" />
                {language === 'ar' ? 'استيراد البيانات' : 'Import Data'}
              </>
            )}
          </Button>
        )}

        {/* Import Result */}
        {importResult && (
          <div className={`rounded-lg p-4 ${
            importResult.success 
              ? 'bg-emerald-50 border border-emerald-200' 
              : 'bg-rose-50 border border-rose-200'
          }`}>
            <div className="flex items-start gap-3">
              {importResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-semibold ${
                  importResult.success ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  {importResult.success 
                    ? (language === 'ar' ? 'تم الاستيراد بنجاح!' : 'Import Successful!')
                    : (language === 'ar' ? 'فشل الاستيراد' : 'Import Failed')}
                </p>
                {importResult.success ? (
                  <div className="mt-2 space-y-1 text-sm text-emerald-700">
                    <p>{language === 'ar' ? 'إجمالي السجلات:' : 'Total records:'} {importResult.total}</p>
                    <p>{language === 'ar' ? 'تم الاستيراد:' : 'Imported:'} {importResult.imported}</p>
                    {importResult.skipped > 0 && (
                      <p>{language === 'ar' ? 'تم التجاهل:' : 'Skipped:'} {importResult.skipped}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-rose-700 mt-1">{importResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>{language === 'ar' ? 'ملاحظات مهمة:' : 'Important Notes:'}</strong>
          </p>
          <ul className="text-sm text-amber-700 mt-2 space-y-1 mr-4 list-disc">
            <li>{language === 'ar' ? 'الحقول المطلوبة يجب أن تكون موجودة في الملف' : 'Required fields must be present in the file'}</li>
            <li>{language === 'ar' ? 'سيتم تجاهل الصفوف التي لا تحتوي على بيانات صالحة' : 'Rows with invalid data will be skipped'}</li>
            <li>{language === 'ar' ? 'الأسعار والكميات سيتم تحويلها تلقائياً إلى أرقام' : 'Prices and quantities will be automatically converted to numbers'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}