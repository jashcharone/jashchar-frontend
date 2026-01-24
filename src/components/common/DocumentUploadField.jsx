import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const DocumentUploadField = ({ 
  label, 
  bucketName = 'student-photos', // Using existing public bucket
  folderPath = 'documents/', 
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  onUploadComplete 
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!acceptedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: `Please upload valid documents (${acceptedTypes.map(t => t.split('/')[1]).join(', ')})`
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Max file size is 5MB"
      });
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folderPath}${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      setUploadedFile({ name: file.name, url: publicUrl });
      if (onUploadComplete) onUploadComplete(publicUrl);
      
      toast({ title: "Success", description: "Document uploaded successfully" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e) => {
    e.preventDefault();
    setUploadedFile(null);
    if (onUploadComplete) onUploadComplete(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border rounded-md p-3 bg-white">
        {uploadedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-green-600 truncate">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm truncate font-medium">{uploadedFile.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemove} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="relative"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? 'Uploading...' : 'Choose File'}
              <input 
                type="file" 
                ref={fileInputRef}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={handleFileSelect}
                accept={acceptedTypes.join(',')}
                disabled={uploading}
              />
            </Button>
            <span className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploadField;
