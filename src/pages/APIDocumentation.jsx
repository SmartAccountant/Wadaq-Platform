import React, { useState } from "react";
import { Wadaq } from "@/api/WadaqClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Key, Code, BookOpen, Link as LinkIcon } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import PlanGuard from "@/components/auth/PlanGuard";

function APIDocumentationContent() {
  const { language } = useLanguage();
  const [user, setUser] = React.useState(null);
  const [copied, setCopied] = React.useState(null);

  React.useEffect(() => {
    Wadaq.auth.me().then(setUser).catch(() => {});
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const apiBaseUrl = `${window.location.origin}/apiGateway`;
  const apiKey = user?.api_key || 'YOUR_API_KEY';

  const endpoints = [
    {
      method: 'GET',
      path: '/invoices',
      description: language === 'ar' ? 'الحصول على جميع الفواتير' : 'Get all invoices',
      example: `curl -X GET "${apiBaseUrl}/invoices" \\
  -H "X-API-Key: ${apiKey}"`
    },
    {
      method: 'POST',
      path: '/invoices',
      description: language === 'ar' ? 'إنشاء فاتورة جديدة' : 'Create new invoice',
      example: `curl -X POST "${apiBaseUrl}/invoices" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customer_name": "محمد أحمد",
    "date": "2026-02-09",
    "items": [
      {
        "product_name": "منتج 1",
        "quantity": 2,
        "price": 100,
        "total": 200
      }
    ],
    "subtotal": 200,
    "tax_amount": 30,
    "total": 230
  }'`
    },
    {
      method: 'GET',
      path: '/customers',
      description: language === 'ar' ? 'الحصول على جميع العملاء' : 'Get all customers',
      example: `curl -X GET "${apiBaseUrl}/customers" \\
  -H "X-API-Key: ${apiKey}"`
    },
    {
      method: 'POST',
      path: '/customers',
      description: language === 'ar' ? 'إنشاء عميل جديد' : 'Create new customer',
      example: `curl -X POST "${apiBaseUrl}/customers" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "عميل جديد",
    "phone": "+966500000000",
    "email": "customer@example.com"
  }'`
    },
    {
      method: 'GET',
      path: '/products',
      description: language === 'ar' ? 'الحصول على جميع المنتجات' : 'Get all products',
      example: `curl -X GET "${apiBaseUrl}/products" \\
  -H "X-API-Key: ${apiKey}"`
    },
    {
      method: 'POST',
      path: '/products',
      description: language === 'ar' ? 'إنشاء منتج جديد' : 'Create new product',
      example: `curl -X POST "${apiBaseUrl}/products" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "منتج جديد",
    "selling_price": 150,
    "quantity": 10
  }'`
    },
    {
      method: 'GET',
      path: '/vouchers',
      description: language === 'ar' ? 'الحصول على السندات' : 'Get vouchers',
      example: `curl -X GET "${apiBaseUrl}/vouchers" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"type": "both"}'`
    },
    {
      method: 'POST',
      path: '/vouchers',
      description: language === 'ar' ? 'إنشاء سند جديد' : 'Create new voucher',
      example: `curl -X POST "${apiBaseUrl}/vouchers" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "voucher_type": "payment",
    "voucher_number": "PAY-001",
    "date": "2026-02-09",
    "beneficiary_name": "مورد 1",
    "amount": 1000,
    "account_name": "الخزينة الرئيسية"
  }'`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <Code className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
              {language === 'ar' ? 'توثيق API' : 'API Documentation'}
            </h1>
            <p className="text-gray-500 text-sm font-light tracking-wide">
              {language === 'ar' ? 'دليل استخدام واجهة برمجة التطبيقات' : 'API Integration Guide'}
            </p>
          </div>
        </div>
      </div>

      {/* API Key Card */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            {language === 'ar' ? 'مفتاح API الخاص بك' : 'Your API Key'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-white p-4 rounded-lg border">
            <code className="flex-1 text-sm font-mono">{apiKey}</code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(apiKey, 'apikey')}
            >
              {copied === 'apikey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {language === 'ar' 
              ? '⚠️ احتفظ بهذا المفتاح بشكل آمن ولا تشاركه مع أحد'
              : '⚠️ Keep this key secure and never share it publicly'}
          </p>
        </CardContent>
      </Card>

      {/* Base URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            {language === 'ar' ? 'عنوان API الأساسي' : 'Base URL'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-slate-50 p-4 rounded-lg border">
            <code className="flex-1 text-sm font-mono">{apiBaseUrl}</code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(apiBaseUrl, 'baseurl')}
            >
              {copied === 'baseurl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'المصادقة' : 'Authentication'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            {language === 'ar' 
              ? 'أضف مفتاح API في رأس الطلب:'
              : 'Include your API key in the request header:'}
          </p>
          <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            X-API-Key: {apiKey}
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-800">
          {language === 'ar' ? 'نقاط النهاية' : 'Endpoints'}
        </h2>
        {endpoints.map((endpoint, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className={
                  endpoint.method === 'GET' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }>
                  {endpoint.method}
                </Badge>
                <code className="text-sm font-mono">{endpoint.path}</code>
              </div>
              <p className="text-sm text-slate-600 mt-2">{endpoint.description}</p>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                  {endpoint.example}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 left-2"
                  onClick={() => copyToClipboard(endpoint.example, `endpoint-${index}`)}
                >
                  {copied === `endpoint-${index}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Response Format */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'تنسيق الاستجابة' : 'Response Format'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">
              {language === 'ar' ? 'نجاح (200/201):' : 'Success (200/201):'}
            </p>
            <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
{`{
  "success": true,
  "data": { ... }
}`}
            </pre>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">
              {language === 'ar' ? 'خطأ (4xx/5xx):' : 'Error (4xx/5xx):'}
            </p>
            <pre className="bg-slate-900 text-red-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
{`{
  "error": "Error message",
  "details": "Additional info"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function APIDocumentation() {
  const { language } = useLanguage();
  
  return (
    <PlanGuard 
      requiredPlans={['smart', 'golden']} 
      featureName={language === 'ar' ? 'واجهة API' : 'API Access'}
    >
      <APIDocumentationContent />
    </PlanGuard>
  );
}