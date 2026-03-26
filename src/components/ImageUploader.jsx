import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, Camera, Crop as CropIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { loadFaceModels, detectSingleFace, areModelsLoaded } from '@/utils/faceRecognition';

// Helper to center the crop initially
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

const ImageUploader = ({ onFileChange, initialPreview, aspectRatio = 3.5 / 4.5, showCrop = true, showCamera = true, showInstruction = true, requireFaceDetection = true }) => {
  const [preview, setPreview] = useState(initialPreview);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  
  // Face detection states
  const [isDetectingFace, setIsDetectingFace] = useState(false);
  const [faceDetectionError, setFaceDetectionError] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    setPreview(initialPreview);
  }, [initialPreview]);

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    if (file) {
      if (!showCrop) {
        onFileChange(file);
        setPreview(URL.createObjectURL(file));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setIsCropOpen(true);
      };
      reader.readAsDataURL(file);
    }
  }, [onFileChange, showCrop]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    },
    multiple: false,
  });

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  }

  const getCroppedImg = async (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        1
      );
    });
  };

  // Track pending crop blob for "Save Anyway" functionality
  const [pendingCropBlob, setPendingCropBlob] = useState(null);

  // Detect face in image
  const detectFaceInImage = async (imageElement) => {
    try {
      // Load models if not already loaded
      if (!areModelsLoaded()) {
        setLoadingModels(true);
        await loadFaceModels((progress) => console.log('[ImageUploader] ' + progress));
        setLoadingModels(false);
      }

      setIsDetectingFace(true);
      setFaceDetectionError(null);
      setFaceDetected(false);

      const detection = await detectSingleFace(imageElement);
      
      if (detection) {
        console.log('[ImageUploader] Face detected with confidence:', detection.detection.score);
        setFaceDetected(true);
        setFaceDetectionError(null);
        return true;
      } else {
        console.log('[ImageUploader] No face detected in image');
        setFaceDetected(false);
        setFaceDetectionError('Face not detected automatically. You can still save the photo if it looks correct.');
        return false;
      }
    } catch (error) {
      console.error('[ImageUploader] Face detection error:', error);
      setFaceDetectionError('Face detection failed. You can still save the photo.');
      return false;
    } finally {
      setIsDetectingFace(false);
    }
  };

  // Save the cropped photo (used by both normal save and "Save Anyway")
  const saveCroppedPhoto = (croppedImageBlob) => {
    const file = new File([croppedImageBlob], "profile_photo.jpg", { type: "image/jpeg" });
    onFileChange(file);
    const previewUrl = URL.createObjectURL(croppedImageBlob);
    setPreview(previewUrl);
    setIsCropOpen(false);
    setFaceDetectionError(null);
    setPendingCropBlob(null);
  };

  const handleCropSave = async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      try {
        const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
        
        // If face detection is required, validate before accepting
        if (requireFaceDetection) {
          // Create a temporary image element for face detection
          const tempImg = new Image();
          const tempUrl = URL.createObjectURL(croppedImageBlob);
          
          await new Promise((resolve, reject) => {
            tempImg.onload = resolve;
            tempImg.onerror = reject;
            tempImg.src = tempUrl;
          });

          const hasFace = await detectFaceInImage(tempImg);
          URL.revokeObjectURL(tempUrl);
          
          if (!hasFace) {
            // Store blob for "Save Anyway" button
            setPendingCropBlob(croppedImageBlob);
            return;
          }
        }

        saveCroppedPhoto(croppedImageBlob);
      } catch (e) {
        console.error(e);
        setFaceDetectionError('Error processing image. Please try again.');
      }
    }
  };

  // Allow saving photo even if face detection failed
  const handleSaveAnyway = () => {
    if (pendingCropBlob) {
      saveCroppedPhoto(pendingCropBlob);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    onFileChange(null);
    setImageSrc(null);
    setFaceDetectionError(null);
    setFaceDetected(false);
  };

  return (
    <>
      <div className="space-y-2">
        {showInstruction && (
          <p className="text-sm text-yellow-500 font-medium">
            Please upload your passport size photo (H:4.5cm x W:3.5cm)
          </p>
        )}
        
        {/* Compact mode when showInstruction is false */}
        {!showInstruction ? (
          <div
            {...getRootProps()}
            onClick={open}
            className={`border-2 border-dashed rounded-lg p-2 text-center transition-colors cursor-pointer
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'}
              w-full aspect-[3.5/4.5] flex flex-col items-center justify-center bg-black/10`}
          >
            <input {...getInputProps()} />
            
            {preview ? (
              <div className="relative w-full h-full group">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-full object-cover rounded-md" 
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemove}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1">
                <Camera className="w-6 h-6 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">Click to upload</p>
              </div>
            )}
          </div>
        ) : (
          /* Full mode with buttons */
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ease-in-out
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              relative w-full min-h-[200px] flex flex-col items-center justify-center gap-4 bg-black/20`}
          >
            <input {...getInputProps()} />
            
            {preview ? (
              <div className="relative w-32 h-40 group">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-full object-cover rounded-md border-2 border-muted shadow-sm" 
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemove}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-muted/10 rounded-lg flex items-center justify-center border border-muted/20">
                  <UploadCloud className="w-8 h-8 text-muted-foreground" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Drag & drop a file or use the buttons
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={open}
                    className="gap-2"
                  >
                    <UploadCloud className="w-4 h-4" /> Upload File
                  </Button>
                  {showCamera && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={open}
                      className="gap-2"
                    >
                      <Camera className="w-4 h-4" /> Use Camera
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 250KB
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Crop Photo</DialogTitle>
            <p className="text-center text-sm text-muted-foreground">
              Drag the corners to resize. Move the box to position.
            </p>
          </DialogHeader>
          
          <div className="flex justify-center p-4 bg-black/5 rounded-lg">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                className="max-h-[60vh]"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imageSrc}
                  onLoad={onImageLoad}
                  style={{ maxHeight: '60vh', width: 'auto' }}
                />
              </ReactCrop>
            )}
          </div>

          {/* Face Detection Status */}
          {requireFaceDetection && (
            <div className="px-4">
              {loadingModels && (
                <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-600 dark:text-blue-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading face detection models...
                </div>
              )}
              {isDetectingFace && !loadingModels && (
                <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-600 dark:text-blue-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Detecting face in image...
                </div>
              )}
              {faceDetectionError && (
                <div className="flex flex-col items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm font-medium border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {faceDetectionError}
                  </div>
                </div>
              )}
              {faceDetected && (
                <div className="flex items-center justify-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-green-600 dark:text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Face detected successfully!
                </div>
              )}
            </div>
          )}

          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={() => { setIsCropOpen(false); setFaceDetectionError(null); setPendingCropBlob(null); }}>
              Cancel
            </Button>
            {faceDetectionError && pendingCropBlob && (
              <Button 
                onClick={handleSaveAnyway} 
                variant="outline"
                className="gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Anyway
              </Button>
            )}
            <Button 
              onClick={handleCropSave} 
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isDetectingFace || loadingModels}
            >
              {isDetectingFace || loadingModels ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CropIcon className="w-4 h-4" /> Crop & Save Photo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageUploader;
