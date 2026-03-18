/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UPLOAD PAPERS
 * Upload scanned answer sheets for AI evaluation
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  File,
  Loader2,
  ArrowLeft,
  Trash2,
  Eye
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const UploadPapers = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection
  const handleFileSelect = (selectedFiles) => {
    const validFiles = Array.from(selectedFiles).filter(file => {
      const isValid = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isValid) {
        toast({ variant: 'destructive', title: `Invalid file type: ${file.name}` });
      }
      return isValid;
    });
    
    const newFiles = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  // Handle drag events
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  // Remove file
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Upload all files
  const handleUpload = async () => {
    if (files.length === 0) {
      toast({ variant: 'destructive', title: 'Please select files to upload' });
      return;
    }
    
    setUploading(true);
    
    try {
      for (const fileObj of files) {
        if (fileObj.status === 'uploaded') continue;
        
        setUploadProgress(prev => ({ ...prev, [fileObj.id]: 0 }));
        
        const formData = new FormData();
        formData.append('files', fileObj.file);
        
        try {
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, status: 'uploading' } : f
          ));
          
          const response = await api.post(`/ai-evaluation/sessions/${sessionId}/papers/upload`, formData);
          
          if (response?.success) {
            setUploadProgress(prev => ({ ...prev, [fileObj.id]: 100 }));
            setFiles(prev => prev.map(f => 
              f.id === fileObj.id 
                ? { ...f, status: 'uploaded', uploadedId: response.data?.[0]?.id }
                : f
            ));
          } else {
            throw new Error(response?.error || 'Upload failed');
          }
        } catch (error) {
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, status: 'error', error: error.message } : f
          ));
        }
      }
      
      toast({ title: 'Files uploaded successfully!' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Some files failed to upload' });
    } finally {
      setUploading(false);
    }
  };

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get file icon
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type === 'application/pdf') return File;
    return FileText;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/super-admin/ai-evaluation/sessions/${sessionId}`)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Upload className="w-7 h-7 text-blue-400" />
            Upload Answer Sheets
          </h1>
          <p className="text-gray-400 mt-1">Upload scanned answer papers for AI evaluation</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
          isDragging ? 'bg-blue-500/20' : 'bg-gray-700/50'
        }`}>
          <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
        </div>
        
        <h3 className="text-lg font-medium text-white mb-2">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </h3>
        <p className="text-gray-400 mb-4">or click to browse</p>
        <p className="text-sm text-gray-500">Supported: Images (JPG, PNG) and PDF files</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Selected Files ({files.length})
            </h2>
            <button
              onClick={() => setFiles([])}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {files.map(fileObj => {
              const Icon = getFileIcon(fileObj.type);
              const progress = uploadProgress[fileObj.id] || 0;
              
              return (
                <div
                  key={fileObj.id}
                  className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{fileObj.name}</p>
                    <p className="text-sm text-gray-400">{formatSize(fileObj.size)}</p>
                    
                    {fileObj.status === 'uploading' && (
                      <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {fileObj.status === 'pending' && (
                      <button
                        onClick={() => removeFile(fileObj.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    
                    {fileObj.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    )}
                    
                    {fileObj.status === 'uploaded' && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    
                    {fileObj.status === 'error' && (
                      <AlertTriangle className="w-5 h-5 text-red-400" title={fileObj.error} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          to={`/super-admin/ai-evaluation/sessions/${sessionId}`}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Session
        </Link>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {files.filter(f => f.status === 'uploaded').length} of {files.length} uploaded
          </span>
          
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0 || files.every(f => f.status === 'uploaded')}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Files
              </>
            )}
          </button>
        </div>
      </div>

      {/* Next Step */}
      {files.length > 0 && files.every(f => f.status === 'uploaded') && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400">All files uploaded successfully!</span>
          </div>
          <Link
            to={`/super-admin/ai-evaluation/sessions/${sessionId}/questions`}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Next: Map Questions →
          </Link>
        </div>
      )}
    </div>
  );
};

export default UploadPapers;
