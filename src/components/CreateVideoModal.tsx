import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { X, Upload, Video, Image, AlertCircle, File, Smartphone } from "lucide-react";
import { useVideos } from "@/hooks/useVideos";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsAndroid } from "@/hooks/useIsAndroid";

interface CreateVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateVideo?: (videoData: any) => void;
}

export const CreateVideoModal = ({ isOpen, onClose, onCreateVideo }: CreateVideoModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { createVideo, uploadVideoFile, uploadThumbnail } = useVideos();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAndroid = useIsAndroid();

  const handleVideoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Video file selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo no puede superar los 100MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type - solo en dispositivos que no sean Android
      if (!isAndroid && !file.type.startsWith('video/')) {
        toast({
          title: "Formato no válido",
          description: "Por favor selecciona un archivo de video válido",
          variant: "destructive",
        });
        return;
      }

      setSelectedVideoFile(file);
    }
  };

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Thumbnail file selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Imagen muy grande",
          description: "La portada no puede superar los 5MB",
          variant: "destructive",
        });
        return;
      }

      if (file.type.startsWith('image/')) {
        setSelectedThumbnail(file);
        const url = URL.createObjectURL(file);
        setThumbnailPreview(url);
      }
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.onerror = () => {
        console.warn('Could not determine video duration');
        resolve(0); // Fallback if duration can't be determined
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedVideoFile(null);
    setSelectedThumbnail(null);
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(null);
    }
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Starting video submission process...');
    console.log('User authenticated:', !!user);
    console.log('Form data:', { title, description, hasVideo: !!selectedVideoFile, hasThumbnail: !!selectedThumbnail });

    // Validation
    if (!user) {
      toast({
        title: "Error de autenticación",
        description: "Debes estar logueado para publicar videos",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa el título y la descripción",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVideoFile) {
      toast({
        title: "Video requerido",
        description: "Por favor selecciona un archivo de video",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      console.log('Step 1: Getting video duration...');
      setUploadProgress(20);
      const duration = await getVideoDuration(selectedVideoFile);
      console.log('Video duration:', duration, 'seconds');
      
      console.log('Step 2: Uploading video file...');
      setUploadProgress(40);
      const videoUrl = await uploadVideoFile(selectedVideoFile);
      console.log('Video upload result:', videoUrl);
      
      if (!videoUrl) {
        throw new Error('Failed to upload video file - no URL returned');
      }

      setUploadProgress(70);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (selectedThumbnail) {
        console.log('Step 3: Uploading thumbnail...');
        setUploadProgress(80);
        thumbnailUrl = await uploadThumbnail(selectedThumbnail);
        console.log('Thumbnail upload result:', thumbnailUrl);
      }

      setUploadProgress(90);

      // Create video record in database
      console.log('Step 4: Creating video record in database...');
      const videoData = {
        title: title.trim(),
        description: description.trim(),
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration: formatDuration(duration),
        product_id: null,
        status: 'active'
      };

      console.log('Video data to insert:', videoData);
      const result = await createVideo(videoData);
      console.log('Create video result:', result);

      if (result.error) {
        throw new Error(result.error.message || 'Failed to create video record');
      }

      setUploadProgress(100);
      
      console.log('Video creation completed successfully!');
      
      // Reset form and close modal
      resetForm();
      onClose();

      if (onCreateVideo) {
        onCreateVideo(videoData);
      }
    } catch (error) {
      console.error('Error during video submission:', error);
      toast({
        title: "Error",
        description: `No se pudo subir el video: ${error.message || 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeVideoFile = () => {
    setSelectedVideoFile(null);
  };

  const removeThumbnail = () => {
    setSelectedThumbnail(null);
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/10 backdrop-blur-lg border-white/20 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            {isAndroid ? <File className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            <span>{isAndroid ? "Crear Contenido" : "Crear Video"}</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-blue-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  {isAndroid ? "Subiendo archivo..." : "Subiendo video..."}
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-400">{uploadProgress}% completado</p>
            </div>
          )}

          {/* Authentication warning */}
          {!user && (
            <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-sm">
                ⚠️ Debes estar logueado para publicar videos
              </p>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              {isAndroid ? "Título del Contenido" : "Título del Video"} *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isAndroid ? "Ej: Mi nuevo contenido increíble" : "Ej: Mi nuevo video increíble"}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              required
              disabled={isUploading}
              maxLength={100}
            />
            <p className="text-xs text-gray-400">{title.length}/100 caracteres</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Descripción *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isAndroid ? "Describe tu contenido..." : "Describe tu video..."}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[80px]"
              required
              disabled={isUploading}
              maxLength={500}
            />
            <p className="text-xs text-gray-400">{description.length}/500 caracteres</p>
          </div>

          {/* Upload Video */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2">
              <File className="w-4 h-4" />
              {isAndroid ? "Archivo" : "Archivo de Video"} *
              {isAndroid && (
                <div className="flex items-center gap-1 text-blue-400">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-xs">Android: Cualquier archivo</span>
                </div>
              )}
            </Label>
            {!selectedVideoFile ? (
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/30 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-400 mb-2">
                  {isAndroid ? "Sube cualquier archivo (máx. 100MB)" : "Sube tu video (máx. 100MB)"}
                </p>
                {!isAndroid && (
                  <p className="text-xs text-gray-500 mb-3">Formatos: MP4, MOV, AVI, WebM</p>
                )}
                {isAndroid && (
                  <p className="text-xs text-gray-500 mb-3">APK, ZIP, PDF, documentos, etc.</p>
                )}
                <input
                  type="file"
                  accept={isAndroid ? undefined : "video/*"}
                  onChange={handleVideoFileSelect}
                  className="hidden"
                  id="video-upload"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => document.getElementById('video-upload')?.click()}
                  disabled={isUploading}
                >
                  Seleccionar {isAndroid ? "Archivo" : "Video"}
                </Button>
              </div>
            ) : (
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">{selectedVideoFile.name}</p>
                      <p className="text-gray-400 text-sm">
                        {(selectedVideoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <p className="text-gray-400 text-xs">
                        Tipo: {selectedVideoFile.type || 'Archivo'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeVideoFile}
                    className="text-gray-400 hover:text-white hover:bg-white/20"
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Información adicional para Android */}
            {isAndroid && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-300 text-sm font-medium">
                  📱 Android: Puedes subir cualquier tipo de archivo
                </p>
                <p className="text-blue-400 text-xs mt-1">
                  APK, ZIP, PDF, documentos, imágenes, videos, etc.
                </p>
              </div>
            )}
          </div>

          {/* Upload Thumbnail */}
          <div className="space-y-2">
            <Label className="text-white">Portada del Video (opcional)</Label>
            {!selectedThumbnail ? (
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/30 transition-colors">
                <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-400 mb-2">Sube una portada (máx. 5MB)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                  id="thumbnail-upload"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => document.getElementById('thumbnail-upload')?.click()}
                  disabled={isUploading}
                >
                  Seleccionar Portada
                </Button>
              </div>
            ) : (
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Image className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-white font-medium">{selectedThumbnail.name}</p>
                      <p className="text-gray-400 text-sm">
                        {(selectedThumbnail.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeThumbnail}
                    className="text-gray-400 hover:text-white hover:bg-white/20"
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {thumbnailPreview && (
                  <div className="mt-2">
                    <img 
                      src={thumbnailPreview} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-white/20"
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={!user || !title.trim() || !description.trim() || !selectedVideoFile || isUploading}
            >
              {isUploading ? "Subiendo..." : isAndroid ? "Publicar Contenido" : "Publicar Video"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
