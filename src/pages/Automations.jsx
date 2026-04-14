import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Zap, 
  Bell, 
  Clock, 
  Package, 
  FileText, 
  RefreshCw,
  Play,
  Pause,
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Wadaq } from "@/api/WadaqClient";
import { useLanguage } from "@/components/LanguageContext";

export default function Automations() {
  const { language } = useLanguage();
  const [testingAutomation, setTestingAutomation] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const queryClient = useQueryClient();

  const { data: automations, isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: async () => {
      // Since we don't have list_automations tool access yet, return mock data
      return [
        {
          id: 'low-stock',
          name: language === 'ar' ? 'تنبيه المخزون المنخفض' : 'Low Stock Alert',
          description: language === 'ar' ? 'إرسال تنبيه عند انخفاض كمية المنتجات' : 'Send alert when product quantity is low',
          function_name: 'checkLowStock',
          schedule: language === 'ar' ? 'كل 6 ساعات' : 'Every 6 hours',
          icon: Package,
          color: 'text-amber-600 bg-amber-50',
          enabled: true,
          type: 'scheduled'
        },
        {
          id: 'overdue-invoices',
          name: language === 'ar' ? 'تنبيه الفواتير المتأخرة' : 'Overdue Invoices Alert',
          description: language === 'ar' ? 'التحقق من الفواتير المتأخرة يومياً وتحديث حالتها' : 'Check overdue invoices daily and update status',
          function_name: 'checkOverdueInvoices',
          schedule: language === 'ar' ? 'يومياً في 9 صباحاً' : 'Daily at 9 AM',
          icon: FileText,
          color: 'text-rose-600 bg-rose-50',
          enabled: true,
          type: 'scheduled'
        },
        {
          id: 'recurring-invoices',
          name: language === 'ar' ? 'الفواتير المتكررة' : 'Recurring Invoices',
          description: language === 'ar' ? 'إنشاء وإرسال الفواتير المتكررة تلقائياً' : 'Create and send recurring invoices automatically',
          function_name: 'sendRecurringInvoices',
          schedule: language === 'ar' ? 'يومياً في 8 صباحاً' : 'Daily at 8 AM',
          icon: RefreshCw,
          color: 'text-blue-600 bg-blue-50',
          enabled: true,
          type: 'scheduled'
        },
        {
          id: 'stripe-webhook',
          name: language === 'ar' ? 'تحديث حالة الدفع' : 'Payment Status Update',
          description: language === 'ar' ? 'تحديث حالة الفاتورة تلقائياً عند استلام الدفع عبر Stripe' : 'Auto-update invoice status when payment received via Stripe',
          function_name: 'stripeInvoiceWebhook',
          schedule: language === 'ar' ? 'عند الحدث' : 'On Event',
          icon: CheckCircle2,
          color: 'text-emerald-600 bg-emerald-50',
          enabled: true,
          type: 'webhook'
        }
      ];
    }
  });

  const testAutomation = async (automation) => {
    setTestingAutomation(automation.id);
    setTestResult(null);
    
    try {
      const response = await Wadaq.functions.invoke(automation.function_name, {});
      setTestResult({
        success: true,
        data: response.data
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setTestingAutomation(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-96"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            {language === 'ar' ? 'أتمتة العمليات' : 'Workflow Automation'}
          </h1>
          <p className="text-slate-500 mt-1">
            {language === 'ar' ? 'إدارة الأتمتة والتنبيهات التلقائية' : 'Manage automations and automatic alerts'}
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Zap className="w-5 h-5 ml-2" />
          {language === 'ar' ? 'إضافة أتمتة' : 'Add Automation'}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-t-4 border-t-blue-500 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">
                {language === 'ar' ? 'ما هي الأتمتة؟' : 'What is Automation?'}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {language === 'ar' 
                  ? 'الأتمتة تتيح لك تشغيل مهام متكررة تلقائياً دون تدخل يدوي، مثل إرسال تنبيهات المخزون، متابعة الفواتير المتأخرة، وإنشاء الفواتير المتكررة.' 
                  : 'Automation allows you to run repetitive tasks automatically without manual intervention, such as sending stock alerts, tracking overdue invoices, and creating recurring invoices.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automations List */}
      <div className="grid gap-4">
        {automations?.map((automation) => {
          const Icon = automation.icon;
          return (
            <Card key={automation.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${automation.color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg mb-1">
                          {automation.name}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {automation.description}
                        </p>
                      </div>
                      <Switch checked={automation.enabled} />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>{automation.schedule}</span>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {automation.type === 'scheduled' 
                          ? (language === 'ar' ? 'مجدول' : 'Scheduled')
                          : (language === 'ar' ? 'ويب هوك' : 'Webhook')}
                      </Badge>

                      {automation.enabled && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                          {language === 'ar' ? 'نشط' : 'Active'}
                        </Badge>
                      )}
                    </div>

                    {/* Test Result */}
                    {testResult && testingAutomation === null && (
                      <div className={`mt-4 p-3 rounded-lg border ${
                        testResult.success 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : 'bg-rose-50 border-rose-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          {testResult.success ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              testResult.success ? 'text-emerald-900' : 'text-rose-900'
                            }`}>
                              {testResult.success 
                                ? (language === 'ar' ? 'تم التشغيل بنجاح' : 'Executed Successfully')
                                : (language === 'ar' ? 'فشل التشغيل' : 'Execution Failed')}
                            </p>
                            {testResult.data && (
                              <p className="text-xs text-slate-600 mt-1">
                                {JSON.stringify(testResult.data, null, 2)}
                              </p>
                            )}
                            {testResult.error && (
                              <p className="text-xs text-rose-700 mt-1">
                                {testResult.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testAutomation(automation)}
                        disabled={testingAutomation === automation.id}
                      >
                        {testingAutomation === automation.id ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            {language === 'ar' ? 'جاري التشغيل...' : 'Running...'}
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 ml-2" />
                            {language === 'ar' ? 'تشغيل تجريبي' : 'Test Run'}
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4 ml-2" />
                        {language === 'ar' ? 'إعدادات' : 'Settings'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Setup Guide */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-0">
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'ar' ? 'إعداد الأتمتة' : 'Automation Setup'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {language === 'ar' ? 'تفعيل الأتمتة' : 'Enable Automation'}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {language === 'ar' 
                  ? 'استخدم المفتاح لتفعيل أو إيقاف الأتمتة'
                  : 'Use the switch to enable or disable automation'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {language === 'ar' ? 'تشغيل تجريبي' : 'Test Run'}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {language === 'ar' 
                  ? 'اضغط على "تشغيل تجريبي" للتأكد من عمل الأتمتة بشكل صحيح'
                  : 'Click "Test Run" to verify automation works correctly'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {language === 'ar' ? 'المراقبة والتعديل' : 'Monitor & Adjust'}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {language === 'ar' 
                  ? 'راقب نتائج الأتمتة وعدّل الإعدادات حسب الحاجة'
                  : 'Monitor automation results and adjust settings as needed'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}