import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const ImageUploadField = ({ 
  label, 
  bucketName = 'school-logos', 
  folderPath = '', 
  acceptedTypes = ['image/jpeg', 'image/png'], 
  expectedDimensions = null, // { width: 369, height: 76, description: '369px x 76px' }
  currentImageUrl, 
  onImageUploaded 
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(currentImageUrl);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate Type
    if (!acceptedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: `Please upload ${acceptedTypes.map(t => t.split('/')[1]).join(', ')} files only.`
      });
      return;
    }

    // Validate Dimensions if required
    if (expectedDimensions) {
      const valid = await validateDimensions(file, expectedDimensions.width, expectedDimensions.height, expectedDimensions.description);
      if (!valid) {
        fileInputRef.current.value = ''; // Reset
        return; 
      }
    }

    // Upload
    await uploadFile(file);
  };

  const validateDimensions = (file, width, height, dimensionDescription = `${width}px x ${height}px`) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        if (img.width !== width || img.height !== height) {
          toast({
            variant: "destructive",
            title: "Invalid dimensions",
            description: `Image must be ${dimensionDescription}. Uploaded: ${img.width}px x ${img.height}px`
          });
          resolve(false);
        } else {
          resolve(true);
        }
      };
      img.onerror = () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to load image for validation." });
        resolve(false);
      };
    });
  };

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folderPath}${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      onImageUploaded(publicUrl);
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e) => {
    e.preventDefault();
    setPreview(null);
    onImageUploaded(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors relative min-h-[120px] flex flex-col items-center justify-center">
        {preview ? (
          <div className="relative w-full flex justify-center">
            <img src={preview} alt="Preview" className="max-h-[100px] object-contain rounded" />
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-2 pointer-events-none">
            <div className="flex justify-center">
              {uploading ? <Loader2 className="h-8 w-8 text-gray-400 animate-spin" /> : <ImageIcon className="h-8 w-8 text-gray-300" />}
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </div>
            <div className="text-[10px] text-gray-400 uppercase">
              {acceptedTypes.map(t => t.split('/')[1]).join(', ')} 
              {expectedDimensions && ` (${expectedDimensions.description || `${expectedDimensions.width}x${expectedDimensions.height}px`})`}
            </div>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          disabled={uploading}
        />
      </div>
    </div>
  );
};

export default ImageUploadField;
