import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UploadCloud, X, File as FileIcon } from 'lucide-react';
import { Button } from './button';
import { v4 as uuidv4 } from 'uuid';

const FileUpload = ({ bucketName, folderName = 'public', onUploadSuccess, initialUrl, onRemove }) => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;
        const file = acceptedFiles[0];
        setLoading(true);

        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = folderName ? `${folderName}/${fileName}` : fileName;

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file);

        if (uploadError) {
            toast({ variant: 'destructive', title: 'Upload failed', description: uploadError.message });
            setLoading(false);
            return;
        }

        const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        if (data.publicUrl) {
            onUploadSuccess(data.publicUrl);
            toast({ title: 'Upload successful!' });
        } else {
            toast({ variant: 'destructive', title: 'Failed to get public URL' });
        }
        setLoading(false);
    }, [bucketName, folderName, onUploadSuccess, toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.gif', '.jpg'] },
        multiple: false,
    });
    
    if (initialUrl) {
        return (
            <div className="relative group w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center p-2">
                <img src={initialUrl} alt="Uploaded content" className="max-w-full max-h-full object-contain rounded" />
                <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemove()}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }


    return (
        <div
            {...getRootProps()}
            className={`w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
            }`}
        >
            <input {...getInputProps()} />
            {loading ? (
                <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
                </>
            ) : (
                <>
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                        {isDragActive ? 'Drop the file here...' : 'Drag & drop a file, or click to select'}
                    </p>
                </>
            )}
        </div>
    );
};

export default FileUpload;
