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
  acceptedTypes = [
    'application/pdf', 
    'application/x-pdf',  // PDF alternate MIME type
    'image/jpeg', 
    'image/jpg',          // Some browsers use image/jpg
    'image/png', 
    'image/webp'
  ],
  onUploadComplete 
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Build accept string for file input - more permissive for browser compatibility
  const getAcceptString = () => {
    const types = [...acceptedTypes];
    // Add file extensions for better browser support
    if (types.some(t => t.includes('pdf'))) types.push('.pdf');
    if (types.some(t => t.includes('jpeg') || t.includes('jpg'))) types.push('.jpg', '.jpeg');
    if (types.some(t => t.includes('png'))) types.push('.png');
    if (types.some(t => t.includes('webp'))) types.push('.webp');
    return types.join(',');
  };

  // Check if file type is valid (more lenient)
  const isValidFileType = (fileType, fileName) => {
    // Check MIME type
    if (acceptedTypes.includes(fileType)) return true;
    
    // Check file extension as fallback (some browsers report wrong MIME)
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' && acceptedTypes.some(t => t.includes('pdf'))) return true;
    if ((ext === 'jpg' || ext === 'jpeg') && acceptedTypes.some(t => t.includes('jpeg') || t.includes('jpg'))) return true;
    if (ext === 'png' && acceptedTypes.some(t => t.includes('png'))) return true;
    if (ext === 'webp' && acceptedTypes.some(t => t.includes('webp'))) return true;
    
    return false;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isValidFileType(file.type, file.name)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: `Please upload valid documents (PDF, JPG, PNG, WEBP)`
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
      {label && <Label>{label}</Label>}
      <div className="border rounded-xl p-4 bg-muted/30 dark:bg-muted/20 border-border transition-colors">
        {uploadedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 truncate">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm truncate font-medium">{uploadedFile.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemove} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="relative border-dashed border-2 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? 'Uploading...' : 'Choose File'}
              <input 
                type="file" 
                ref={fileInputRef}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={handleFileSelect}
                accept={getAcceptString()}
                disabled={uploading}
              />
            </Button>
            <span className="text-xs text-muted-foreground">PDF, JPG, PNG, WEBP (Max 5MB)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploadField;
