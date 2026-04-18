import React from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const PLAN_LIMITS = {
  trial: {
    invoices: 10,
    products: 20,
    customers: 15,
  },
  basic: {
    invoices: 100,
    products: 100,
    customers: 50,
  },
  advanced: {
    invoices: 500,
    products: 500,
    customers: 200,
  },
  smart: {
    invoices: 2000,
    products: 2000,
    customers: 1000,
  },
  golden: {
    invoices: Infinity,
    products: Infinity,
    customers: Infinity,
  },
};

export function checkPlanLimit(plan, limitType, currentCount) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.trial;
  const limit = limits[limitType];
  
  return {
    canCreate: currentCount < limit,
    limit: limit,
    current: currentCount,
    percentage: limit === Infinity ? 0 : (currentCount / limit) * 100,
  };
}

export default function PlanLimitGuard({ plan, limitType, currentCount, children, entityName }) {
  const { language } = useLanguage();
  
  const limitCheck = checkPlanLimit(plan, limitType, currentCount);

  const entityNames = {
    invoices: language === 'ar' ? 'الفواتير' : 'Invoices',
    products: language === 'ar' ? 'المنتجات' : 'Products',
    customers: language === 'ar' ? 'العملاء' : 'Customers',
  };

  if (!limitCheck.canCreate) {
    return (
      <Card className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            {language === 'ar' ? 'وصلت للحد الأقصى' : 'Limit Reached'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-200">
            {language === 'ar' 
              ? `لقد وصلت للحد الأقصى من ${entityNames[limitType]} (${limitCheck.limit}) في باقتك الحالية.`
              : `You've reached the maximum ${entityNames[limitType]} (${limitCheck.limit}) for your current plan.`}
          </p>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">{language === 'ar' ? 'الاستخدام' : 'Usage'}</span>
              <span className="text-white font-bold">{currentCount} / {limitCheck.limit}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <Link to={createPageUrl('Pricing')}>
            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Crown className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'ترقية الباقة' : 'Upgrade Plan'}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Show warning when approaching limit (80%)
  if (limitCheck.percentage >= 80 && limitCheck.limit !== Infinity) {
    return (
      <>
        <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="flex-1">
              <p className="text-white font-medium">
                {language === 'ar' ? 'تحذير: اقتربت من الحد الأقصى' : 'Warning: Approaching Limit'}
              </p>
              <p className="text-sm text-slate-300">
                {language === 'ar' 
                  ? `${currentCount} من ${limitCheck.limit} ${entityNames[limitType]}`
                  : `${currentCount} of ${limitCheck.limit} ${entityNames[limitType]}`}
              </p>
            </div>
            <Link to={createPageUrl('Pricing')}>
              <Button size="sm" variant="outline">
                {language === 'ar' ? 'ترقية' : 'Upgrade'}
              </Button>
            </Link>
          </div>
        </div>
        {children}
      </>
    );
  }

  return children;
}