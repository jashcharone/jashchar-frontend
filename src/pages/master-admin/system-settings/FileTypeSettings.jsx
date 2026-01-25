import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, FileType, Image, HardDrive, Info, Video, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Helmet } from 'react-helmet';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FileTypeSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Default comprehensive settings
  const defaultFileSettings = {
    allowed_extensions: 'pdf, zip, doc, docx, xls, xlsx, ppt, pptx, txt, csv, odt, ods, odp, rtf, 7z, rar, tar, gz, mp3, wav, ogg, flac, apk, accdb, mdb, html, xml, json',
    allowed_mime_types: 'application/pdf, application/zip, application/x-zip-compressed, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, text/plain, text/csv, application/vnd.oasis.opendocument.text, application/vnd.oasis.opendocument.spreadsheet, application/vnd.oasis.opendocument.presentation, application/rtf, application/x-7z-compressed, application/x-rar-compressed, application/x-tar, application/gzip, audio/mpeg, audio/wav, audio/ogg, audio/flac, application/vnd.android.package-archive, application/msaccess, text/html, application/xml, application/json',
    upload_size_bytes: 104857600 // 100 MB
  };

  const defaultImageSettings = {
    allowed_extensions: 'jpg, jpeg, png, gif, bmp, svg, webp, ico, jfif, jpe, tiff, tif',
    allowed_mime_types: 'image/jpeg, image/png, image/gif, image/bmp, image/svg+xml, image/webp, image/x-icon, image/tiff',
    upload_size_bytes: 10485760 // 10 MB
  };

  const defaultVideoSettings = {
    allowed_extensions: 'mp4, webm, ogg, avi, mov, wmv, flv, mkv, 3gp, m4v',
    allowed_mime_types: 'video/mp4, video/webm, video/ogg, video/x-msvideo, video/quicktime, video/x-ms-wmv, video/x-flv, video/x-matroska, video/3gpp, video/x-m4v',
    upload_size_bytes: 524288000 // 500 MB
  };

  const [fileSettings, setFileSettings] = useState(defaultFileSettings);
  const [imageSettings, setImageSettings] = useState(defaultImageSettings);
  const [videoSettings, setVideoSettings] = useState(defaultVideoSettings);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch all file type settings
      const { data: settingsData, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['file_type_settings', 'image_type_settings', 'video_type_settings']);

      if (error) throw error;

      if (settingsData) {
        settingsData.forEach(setting => {
          const parsed = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
          if (setting.key === 'file_type_settings') {
            setFileSettings(prev => ({ ...prev, ...parsed }));
          } else if (setting.key === 'image_type_settings') {
            setImageSettings(prev => ({ ...prev, ...parsed }));
          } else if (setting.key === 'video_type_settings') {
            setVideoSettings(prev => ({ ...prev, ...parsed }));
          }
        });
      }
    } catch (error) {
      console.error('Error fetching file type settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load file type settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updates = [
        { key: 'file_type_settings', value: JSON.stringify(fileSettings), updated_at: new Date().toISOString() },
        { key: 'image_type_settings', value: JSON.stringify(imageSettings), updated_at: new Date().toISOString() },
        { key: 'video_type_settings', value: JSON.stringify(videoSettings), updated_at: new Date().toISOString() }
      ];

      const { error } = await supabase
        .from('system_settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'File type settings saved successfully. Changes will apply to all file uploads.'
      });
    } catch (error) {
      console.error('Error saving file type settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (type) => {
    if (type === 'file') {
      setFileSettings(defaultFileSettings);
    } else if (type === 'image') {
      setImageSettings(defaultImageSettings);
    } else if (type === 'video') {
      setVideoSettings(defaultVideoSettings);
    }
    toast({ title: 'Reset', description: `${type} settings reset to defaults. Click Save to apply.` });
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const bytesToMB = (bytes) => (bytes / (1024 * 1024)).toFixed(0);
  const mbToBytes = (mb) => Math.round(mb * 1024 * 1024);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>File Type Settings | Master Admin</title>
      </Helmet>
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileType className="h-7 w-7 text-primary" />
              File Types
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage allowed file, image, and video extensions, MIME types, and upload sizes
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save</>
            )}
          </Button>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            These settings control what types of files can be uploaded throughout the system. Changes will apply to all schools and all file upload areas.
          </AlertDescription>
        </Alert>

        {/* Setting For Files (Documents) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-blue-500" />
                  Setting For Files
                </CardTitle>
                <CardDescription>
                  Configure allowed file types for document uploads (PDF, Word, Excel, Audio, etc.)
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleReset('file')}>
                <RefreshCw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file_extensions">
                Allowed Extension <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="file_extensions"
                value={fileSettings.allowed_extensions}
                onChange={(e) => setFileSettings({ ...fileSettings, allowed_extensions: e.target.value })}
                placeholder="pdf, zip, doc, docx, xls, xlsx, ppt, pptx, txt, csv..."
                rows={3}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Comma-separated list of allowed file extensions (without dots)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file_mime">
                Allowed MIME Type <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="file_mime"
                value={fileSettings.allowed_mime_types}
                onChange={(e) => setFileSettings({ ...fileSettings, allowed_mime_types: e.target.value })}
                placeholder="application/pdf, application/zip, application/msword..."
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Comma-separated list of allowed MIME types
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file_size">
                  Upload Size (In Bytes) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="file_size"
                  type="number"
                  value={fileSettings.upload_size_bytes}
                  onChange={(e) => setFileSettings({ ...fileSettings, upload_size_bytes: parseInt(e.target.value) || 0 })}
                  placeholder="104857600"
                />
              </div>
              <div className="space-y-2">
                <Label>Upload Size (In MB)</Label>
                <Input
                  type="number"
                  value={bytesToMB(fileSettings.upload_size_bytes)}
                  onChange={(e) => setFileSettings({ ...fileSettings, upload_size_bytes: mbToBytes(parseFloat(e.target.value) || 0) })}
                  placeholder="100"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Maximum upload size: <strong className="text-blue-600">{formatBytes(fileSettings.upload_size_bytes)}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Setting For Image */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-green-500" />
                  Setting For Image
                </CardTitle>
                <CardDescription>
                  Configure allowed image types for photo/image uploads
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleReset('image')}>
                <RefreshCw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image_extensions">
                Allowed Extension <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="image_extensions"
                value={imageSettings.allowed_extensions}
                onChange={(e) => setImageSettings({ ...imageSettings, allowed_extensions: e.target.value })}
                placeholder="jpg, jpeg, png, gif, bmp, svg, webp"
                rows={2}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Comma-separated list of allowed image extensions (without dots)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_mime">
                Allowed MIME Type <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="image_mime"
                value={imageSettings.allowed_mime_types}
                onChange={(e) => setImageSettings({ ...imageSettings, allowed_mime_types: e.target.value })}
                placeholder="image/jpeg, image/png, image/gif, image/bmp..."
                rows={3}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Comma-separated list of allowed MIME types
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image_size">
                  Upload Size (In Bytes) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="image_size"
                  type="number"
                  value={imageSettings.upload_size_bytes}
                  onChange={(e) => setImageSettings({ ...imageSettings, upload_size_bytes: parseInt(e.target.value) || 0 })}
                  placeholder="10485760"
                />
              </div>
              <div className="space-y-2">
                <Label>Upload Size (In MB)</Label>
                <Input
                  type="number"
                  value={bytesToMB(imageSettings.upload_size_bytes)}
                  onChange={(e) => setImageSettings({ ...imageSettings, upload_size_bytes: mbToBytes(parseFloat(e.target.value) || 0) })}
                  placeholder="10"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Maximum upload size: <strong className="text-green-600">{formatBytes(imageSettings.upload_size_bytes)}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Setting For Video */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-500" />
                  Setting For Video
                </CardTitle>
                <CardDescription>
                  Configure allowed video types for video uploads
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleReset('video')}>
                <RefreshCw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video_extensions">
                Allowed Extension <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="video_extensions"
                value={videoSettings.allowed_extensions}
                onChange={(e) => setVideoSettings({ ...videoSettings, allowed_extensions: e.target.value })}
                placeholder="mp4, webm, ogg, avi, mov, wmv, flv, mkv"
                rows={2}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Comma-separated list of allowed video extensions (without dots)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_mime">
                Allowed MIME Type <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="video_mime"
                value={videoSettings.allowed_mime_types}
                onChange={(e) => setVideoSettings({ ...videoSettings, allowed_mime_types: e.target.value })}
                placeholder="video/mp4, video/webm, video/ogg, video/x-msvideo..."
                rows={3}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Comma-separated list of allowed MIME types
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="video_size">
                  Upload Size (In Bytes) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="video_size"
                  type="number"
                  value={videoSettings.upload_size_bytes}
                  onChange={(e) => setVideoSettings({ ...videoSettings, upload_size_bytes: parseInt(e.target.value) || 0 })}
                  placeholder="524288000"
                />
              </div>
              <div className="space-y-2">
                <Label>Upload Size (In MB)</Label>
                <Input
                  type="number"
                  value={bytesToMB(videoSettings.upload_size_bytes)}
                  onChange={(e) => setVideoSettings({ ...videoSettings, upload_size_bytes: mbToBytes(parseFloat(e.target.value) || 0) })}
                  placeholder="500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Maximum upload size: <strong className="text-purple-600">{formatBytes(videoSettings.upload_size_bytes)}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Save Button (Bottom) */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reload
          </Button>
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Settings</>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FileTypeSettings;

