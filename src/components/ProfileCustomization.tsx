
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Video, Image, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProfileCustomizationProps {
  backgroundUrl?: string;
  videoUrl?: string;
  onBackgroundChange: (url: string) => void;
  onVideoChange: (url: string) => void;
  isEditing: boolean;
}

export const ProfileCustomization = ({
  backgroundUrl,
  videoUrl,
  onBackgroundChange,
  onVideoChange,
  isEditing
}: ProfileCustomizationProps) => {
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen válida",
        variant: "destructive",
      });
      return;
    }

    setUploadingBackground(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/background.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-media')
        .getPublicUrl(fileName);

      onBackgroundChange(data.publicUrl);

      toast({
        title: "Fondo actualizado",
        description: "Tu imagen de fondo se ha actualizado correctamente",
      });

    } catch (error) {
      console.error('Error uploading background:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen de fondo",
        variant: "destructive",
      });
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un video válido",
        variant: "destructive",
      });
      return;
    }

    // Verificar tamaño del archivo (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El video es muy grande. Máximo 50MB permitidos",
        variant: "destructive",
      });
      return;
    }

    setUploadingVideo(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/presentation.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-media')
        .getPublicUrl(fileName);

      onVideoChange(data.publicUrl);

      toast({
        title: "Video actualizado",
        description: "Tu video de presentación se ha actualizado correctamente",
      });

    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el video de presentación",
        variant: "destructive",
      });
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeBackground = () => {
    onBackgroundChange("");
    toast({
      title: "Fondo removido",
      description: "Se ha removido la imagen de fondo",
    });
  };

  const removeVideo = () => {
    onVideoChange("");
    toast({
      title: "Video removido",
      description: "Se ha removido el video de presentación",
    });
  };

  if (!isEditing) {
    return null;
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Personalización del Perfil</CardTitle>
        <CardDescription className="text-gray-300">
          Haz tu perfil más atractivo con fondos personalizados y videos de presentación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fondo personalizado */}
        <div className="space-y-4">
          <Label className="text-white text-lg font-semibold">Imagen de Fondo</Label>
          
          {backgroundUrl ? (
            <div className="relative">
              <div 
                className="w-full h-32 bg-cover bg-center rounded-lg border border-white/20"
                style={{ backgroundImage: `url(${backgroundUrl})` }}
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={removeBackground}
                className="absolute top-2 right-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-4">Sube una imagen de fondo para tu perfil</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="hidden"
                id="background-upload"
                disabled={uploadingBackground}
              />
              <label htmlFor="background-upload">
                <Button
                  size="sm"
                  disabled={uploadingBackground}
                  className="bg-purple-600 hover:bg-purple-700"
                  asChild
                >
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingBackground ? "Subiendo..." : "Seleccionar Imagen"}
                  </span>
                </Button>
              </label>
            </div>
          )}
        </div>

        {/* Video de presentación */}
        <div className="space-y-4">
          <Label className="text-white text-lg font-semibold">Video de Presentación</Label>
          
          {videoUrl ? (
            <div className="relative">
              <video 
                src={videoUrl} 
                className="w-full h-48 object-cover rounded-lg border border-white/20"
                controls
                preload="metadata"
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={removeVideo}
                className="absolute top-2 right-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">Sube un video de presentación</p>
              <p className="text-gray-400 text-sm mb-4">Máximo 50MB - Formatos: MP4, WebM, MOV</p>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                id="video-upload"
                disabled={uploadingVideo}
              />
              <label htmlFor="video-upload">
                <Button
                  size="sm"
                  disabled={uploadingVideo}
                  className="bg-purple-600 hover:bg-purple-700"
                  asChild
                >
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingVideo ? "Subiendo..." : "Seleccionar Video"}
                  </span>
                </Button>
              </label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
