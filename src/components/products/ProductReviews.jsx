import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, Send, CheckCircle } from "lucide-react";
import { Wadaq } from "@/api/WadaqCore";
import { useLanguage } from "@/components/LanguageContext";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function ProductReviews({ product }) {
  const { language } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['productReviews', product.id],
    queryFn: () => Wadaq.entities.ProductReview.filter({ 
      product_id: product.id,
      is_approved: true 
    })
  });

  const createReviewMutation = useMutation({
    mutationFn: (data) => Wadaq.entities.ProductReview.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productReviews', product.id] });
      setShowForm(false);
      setComment("");
      setCustomerName("");
      setCustomerEmail("");
      setRating(5);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createReviewMutation.mutate({
      product_id: product.id,
      product_name: product.name,
      customer_name: customerName,
      customer_email: customerEmail,
      rating,
      comment,
      is_verified_purchase: false
    });
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }));

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {language === 'ar' ? 'التقييمات والمراجعات' : 'Reviews & Ratings'}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="text-xl font-bold">{averageRating}</span>
              </div>
              <span className="text-sm text-slate-500">
                ({reviews.length} {language === 'ar' ? 'تقييم' : 'reviews'})
              </span>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            {language === 'ar' ? 'إضافة تقييم' : 'Add Review'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Rating Distribution */}
        <div className="space-y-2">
          {ratingDistribution.map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-medium">{star}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </div>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-slate-600 w-12 text-left">{count}</span>
            </div>
          ))}
        </div>

        {/* Review Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-lg space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'التقييم' : 'Rating'}</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الاسم' : 'Name'} *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'التعليق' : 'Comment'}</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={language === 'ar' ? 'شارك تجربتك مع هذا المنتج' : 'Share your experience with this product'}
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={createReviewMutation.isPending}>
                <Send className="w-4 h-4 ml-2" />
                {language === 'ar' ? 'إرسال' : 'Submit'}
              </Button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-slate-500">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
          ) : reviews.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              {language === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
            </p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="p-4 bg-white border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{review.customer_name}</span>
                      {review.is_verified_purchase && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {language === 'ar' ? 'شراء موثق' : 'Verified'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">
                    {format(new Date(review.created_date), 'dd MMM yyyy', { 
                      locale: language === 'ar' ? ar : undefined 
                    })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-slate-600 text-sm mt-2">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}