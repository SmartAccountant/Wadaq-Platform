import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { Wadaq } from '@/api/WadaqCore';
import { useLanguage } from '@/components/LanguageContext';

export default function ImageUpload({ 
  images = [], 
  onChange, 
  maxImages = 5,
  maxSizeMB = 2,
  compressQuality = 0.8 
}) {
  const { language } = useLanguage();
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if image is too large
          const maxDimension = 1920;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }));
            },
            'image/jpeg',
            compressQuality
          );
        };
      };
    });
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (images.length + files.length > maxImages) {
      alert(
        language === 'ar'
          ? `يمكنك رفع ${maxImages} صور كحد أقصى`
          : `You can upload maximum ${maxImages} images`
      );
      return;
    }

    setUploading(true);
    const newImages = [...images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));

      try {
        // Compress image
        const compressedFile = await compressImage(file);
        
        // Check size after compression
        const sizeMB = compressedFile.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
          alert(
            language === 'ar'
              ? `الصورة ${file.name} كبيرة جداً (${sizeMB.toFixed(1)}MB). الحد الأقصى ${maxSizeMB}MB`
              : `Image ${file.name} is too large (${sizeMB.toFixed(1)}MB). Maximum ${maxSizeMB}MB`
          );
          continue;
        }

        // Upload compressed image
        const { file_url } = await Wadaq.integrations.Core.UploadFile({ file: compressedFile });
        newImages.push(file_url);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(
          language === 'ar'
            ? `فشل رفع الصورة ${file.name}`
            : `Failed to upload ${file.name}`
        );
      }
    }

    onChange(newImages);
    setUploading(false);
    setUploadProgress(0);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={uploading || images.length >= maxImages}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload">
          <Button
            type="button"
            variant="outline"
            disabled={uploading || images.length >= maxImages}
            className="w-full cursor-pointer"
            asChild
          >
            <span>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  {language === 'ar' ? `جاري الرفع... ${uploadProgress}%` : `Uploading... ${uploadProgress}%`}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 ml-2" />
                  {language === 'ar' ? 'رفع صور' : 'Upload Images'}
                </>
              )}
            </span>
          </Button>
        </label>
        <p className="text-xs text-slate-500 mt-2">
          {language === 'ar'
            ? `يتم ضغط الصور تلقائياً. الحد الأقصى ${maxImages} صور، كل صورة ${maxSizeMB}MB`
            : `Images are automatically compressed. Max ${maxImages} images, ${maxSizeMB}MB each`}
        </p>
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={url}
                alt={`Product ${index + 1}`}
                loading="lazy"
                className="w-full h-full object-cover rounded-lg border-2 border-slate-200 group-hover:border-purple-400 transition-colors"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="w-4 h-4" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                  {language === 'ar' ? 'رئيسية' : 'Main'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}