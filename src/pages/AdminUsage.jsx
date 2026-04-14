import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Wadaq } from "@/api/WadaqClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsage() {
  const { language } = useLanguage();

  // Fetch all users (admin only)
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const currentUser = await Wadaq.auth.me();
      
      // Only allow admin access
      if (currentUser.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      return Wadaq.entities.User.list();
    },
  });

  // Calculate totals
  const totalCreditsUsed = users.reduce((sum, user) => sum + (user.ai_credit_used || 0), 0);
  const totalCreditsLimit = users.reduce((sum, user) => sum + (user.ai_credit_limit || 0), 0);
  
  // Estimate cost (assuming $0.01 per credit as example)
  const costPerCredit = 0.01;
  const totalEstimatedCost = totalCreditsUsed * costPerCredit;

  // Get high usage users
  const highUsageUsers = users.filter(user => {
    const used = user.ai_credit_used || 0;
    const limit = user.ai_credit_limit || 100;
    return (used / limit) >= 0.8;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {language === 'ar' ? 'الاستهلاك والتكاليف' : 'Usage & Costs'}
        </h1>
        <p className="text-slate-400">
          {language === 'ar' 
            ? 'مراقبة استهلاك الذكاء الاصطناعي لجميع المستخدمين' 
            : 'Monitor AI usage across all users'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Credits Used */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              {language === 'ar' ? 'إجمالي الاستهلاك' : 'Total Usage'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {totalCreditsUsed.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400">
              {language === 'ar' ? 'من' : 'of'} {totalCreditsLimit.toLocaleString()} {language === 'ar' ? 'عملية' : 'operations'}
            </p>
          </CardContent>
        </Card>

        {/* Estimated Cost */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              {language === 'ar' ? 'التكلفة التقديرية' : 'Estimated Cost'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {totalEstimatedCost.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}
            </div>
            <p className="text-xs text-slate-400">
              {language === 'ar' ? 'هذا الشهر' : 'This month'}
            </p>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              {language === 'ar' ? 'المستخدمين النشطين' : 'Active Users'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {users.filter(u => (u.ai_credit_used || 0) > 0).length}
            </div>
            <p className="text-xs text-slate-400">
              {language === 'ar' ? 'من' : 'of'} {users.length} {language === 'ar' ? 'مستخدم' : 'users'}
            </p>
          </CardContent>
        </Card>

        {/* High Usage Alert */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              {language === 'ar' ? 'استهلاك مرتفع' : 'High Usage'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {highUsageUsers.length}
            </div>
            <p className="text-xs text-slate-400">
              {language === 'ar' ? 'مستخدمين > 80%' : 'Users > 80%'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Table */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">
            {language === 'ar' ? 'تفاصيل استهلاك المستخدمين' : 'User Usage Details'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                  <TableHead className="text-slate-300 font-semibold">
                    {language === 'ar' ? 'اسم المستخدم' : 'User Name'}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center">
                    {language === 'ar' ? 'المستخدم' : 'Used'}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center">
                    {language === 'ar' ? 'الحد' : 'Limit'}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center">
                    {language === 'ar' ? 'النسبة' : 'Usage %'}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center">
                    {language === 'ar' ? 'التكلفة' : 'Cost'}
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                      {language === 'ar' ? 'لا توجد بيانات' : 'No data'}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const used = user.ai_credit_used || 0;
                    const limit = user.ai_credit_limit || 100;
                    const percentage = (used / limit) * 100;
                    const cost = used * costPerCredit;

                    const getStatusBadge = () => {
                      if (percentage >= 100) return { label: language === 'ar' ? 'مستنفد' : 'Exhausted', color: 'bg-rose-500/20 text-rose-300 border-rose-500/50' };
                      if (percentage >= 90) return { label: language === 'ar' ? 'حرج' : 'Critical', color: 'bg-rose-500/20 text-rose-300 border-rose-500/50' };
                      if (percentage >= 70) return { label: language === 'ar' ? 'تحذير' : 'Warning', color: 'bg-amber-500/20 text-amber-300 border-amber-500/50' };
                      return { label: language === 'ar' ? 'جيد' : 'Good', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' };
                    };

                    const status = getStatusBadge();

                    return (
                      <TableRow key={user.id} className="border-slate-700 hover:bg-slate-800/30">
                        <TableCell className="font-medium text-white">
                          {user.full_name || user.email?.split('@')[0]}
                          {user.role === 'admin' && (
                            <Badge className="ml-2 bg-purple-500/20 text-purple-300 border-purple-500/50">
                              Admin
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-400">{user.email}</TableCell>
                        <TableCell className="text-center text-white font-semibold">{used}</TableCell>
                        <TableCell className="text-center text-slate-400">{limit}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${
                            percentage >= 90 ? 'text-rose-400' : 
                            percentage >= 70 ? 'text-amber-400' : 
                            'text-emerald-400'
                          }`}>
                            {percentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-slate-300 font-semibold">
                          {cost.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown Info */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">
            {language === 'ar' ? 'معلومات التكلفة' : 'Cost Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-400">
          <p>• {language === 'ar' ? 'التكلفة التقديرية:' : 'Estimated cost:'} {costPerCredit.toFixed(4)} {language === 'ar' ? 'ر.س لكل عملية' : 'SAR per operation'}</p>
          <p>• {language === 'ar' ? 'يتم إعادة تعيين الحد الشهري تلقائياً في أول كل شهر' : 'Monthly limit resets automatically on the 1st of each month'}</p>
          <p>• {language === 'ar' ? 'قارن هذه الأرقام مع فاتورة Wadaq الشهرية' : 'Compare these numbers with your monthly Wadaq invoice'}</p>
          <p className="text-amber-400">⚠️ {language === 'ar' ? 'هذه تقديرات - التكلفة الفعلية قد تختلف' : 'These are estimates - actual costs may vary'}</p>
        </CardContent>
      </Card>
    </div>
  );
}