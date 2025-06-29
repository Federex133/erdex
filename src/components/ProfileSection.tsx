import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Camera, Save, Edit, Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAndroid } from "@/hooks/useIsAndroid";
import { ProfileCustomization } from "./ProfileCustomization";
import { PublicarProductoTutorial } from "./PublicarProductoTutorial";

interface ProfileSectionProps {
  onLogout?: () => void;
}

export const ProfileSection = ({ onLogout }: ProfileSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const isAndroid = useIsAndroid();
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    description: "",
    avatar_url: "",
    phone: "",
    background_url: "",
    presentation_video_url: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const {
        data: profileData,
        error
      } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el perfil",
          variant: "destructive"
        });
        return;
      }
      if (profileData) {
        setProfile({
          username: profileData.username || "",
          email: profileData.email || user.email || "",
          description: profileData.description || "",
          avatar_url: profileData.avatar_url || "",
          phone: profileData.phone || "",
          background_url: profileData.background_url || "",
          presentation_video_url: profileData.presentation_video_url || ""
        });
      } else {
        // Si no existe perfil, usar datos del usuario autenticado
        setProfile(prev => ({
          ...prev,
          email: user.email || "",
          username: user.email?.split('@')[0] || ""
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Actualizar o insertar perfil
      const {
        error: profileError
      } = await supabase.from('profiles').upsert({
        id: user.id,
        username: profile.username,
        email: profile.email,
        description: profile.description,
        avatar_url: profile.avatar_url,
        phone: profile.phone,
        background_url: profile.background_url,
        presentation_video_url: profile.presentation_video_url,
        updated_at: new Date().toISOString()
      });
      if (profileError) throw profileError;
      setIsEditing(false);
      toast({
        title: "Perfil actualizado",
        description: "Tu información se ha guardado correctamente"
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      // Crear un nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Subir archivo a Supabase Storage usando el bucket 'avatars'
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(fileName, file, {
        upsert: true
      });
      if (uploadError) throw uploadError;

      // Obtener URL pública del archivo
      const {
        data
      } = supabase.storage.from('avatars').getPublicUrl(fileName);

      // Actualizar estado local
      setProfile(prev => ({
        ...prev,
        avatar_url: data.publicUrl
      }));
      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil se ha actualizado correctamente"
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la foto de perfil",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }
    setChangingPassword(true);
    try {
      const {
        error
      } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      if (error) throw error;
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña se ha cambiado correctamente"
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña",
        variant: "destructive"
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleConfirmLogout = async () => {
    if (isLoggingOut || !onLogout) return;
    
    try {
      console.log("Iniciando proceso de cierre de sesión...");
      setIsLoggingOut(true);
      await onLogout();
      console.log("Cierre de sesión completado");
    } catch (error) {
      console.error("Error durante el cierre de sesión:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (showSettings) {
    return (
      <div className="space-y-6 min-h-screen relative" style={{
        backgroundImage: profile.background_url ? `url(${profile.background_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        {profile.background_url && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />}
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
              <p className="text-gray-300">Gestiona la seguridad de tu cuenta</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowSettings(false)} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Volver al Perfil
              </Button>
              
              {/* Logout button in settings */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 border-red-600 text-white"
                    disabled={isLoggingOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-900 border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">¿Cerrar sesión?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-300">
                      ¿Estás seguro de que quieres cerrar tu sesión? Tendrás que iniciar sesión nuevamente para acceder a tu cuenta.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleConfirmLogout}
                      disabled={isLoggingOut}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Solo mantener el cambio de contraseña */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-white">Cambiar Contraseña</CardTitle>
              <CardDescription className="text-gray-300">
                Actualiza tu contraseña para mantener tu cuenta segura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-white">Contraseña Actual</Label>
                <Input id="current-password" type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(prev => ({
                ...prev,
                currentPassword: e.target.value
              }))} placeholder="Ingresa tu contraseña actual" className="border-white/20 text-white bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-white">Nueva Contraseña</Label>
                <Input id="new-password" type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(prev => ({
                ...prev,
                newPassword: e.target.value
              }))} placeholder="Ingresa tu nueva contraseña" className="border-white/20 text-white bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-white">Confirmar Nueva Contraseña</Label>
                <Input id="confirm-password" type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(prev => ({
                ...prev,
                confirmPassword: e.target.value
              }))} placeholder="Confirma tu nueva contraseña" className="border-white/20 text-white bg-slate-50" />
              </div>
              <Button onClick={handleChangePassword} disabled={changingPassword} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                {changingPassword ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
            </CardContent>
          </Card>

          {/* Información de Seguridad */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Información de Seguridad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <p className="text-lg font-bold text-white">Última sesión</p>
                  <p className="text-gray-300 text-sm">Hace 2 minutos</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <p className="text-lg font-bold text-white">Dispositivos activos</p>
                  <p className="text-gray-300 text-sm">1 dispositivo</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <p className="text-lg font-bold text-white">Cuenta creada</p>
                  <p className="text-gray-300 text-sm">Hace 30 días</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 min-h-screen relative" style={{
      backgroundImage: profile.background_url ? `url(${profile.background_url})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Overlay para mejorar legibilidad */}
      {profile.background_url && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />}
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
            <p className="text-gray-300">Gestiona tu información personal</p>
          </div>
          <div className="flex gap-3">
            {/* NUEVO: Botón Tutorial */}
            <Button 
              variant="outline"
              className="bg-white/10 border-purple-400 text-purple-300 hover:bg-purple-800 hover:text-white"
              onClick={() => setShowTutorial(true)}
            >
              Tutorial
            </Button>
            <Button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
              disabled={saving} 
              size={isAndroid ? "sm" : "lg"} 
              className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 ${
                isAndroid 
                  ? "px-4 py-2 text-sm font-medium" 
                  : "px-8 py-4 text-lg font-semibold"
              }`}
            >
              {isEditing ? (
                <>
                  <Save className={`${isAndroid ? "w-4 h-4 mr-2" : "w-6 h-6 mr-3"}`} />
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </>
              ) : (
                <>
                  <Edit className={`${isAndroid ? "w-4 h-4 mr-2" : "w-6 h-6 mr-3"}`} />
                  Editar Perfil
                </>
              )}
            </Button>
            
            {/* Main logout button in profile */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 border-red-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoggingOut}
                >
                  <LogOut className="w-6 h-6 mr-3" />
                  {isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">¿Cerrar sesión?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    ¿Estás seguro de que quieres cerrar tu sesión? Tendrás que iniciar sesión nuevamente para acceder a tu cuenta.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleConfirmLogout}
                    disabled={isLoggingOut}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}
                  </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Video de presentación */}
        {profile.presentation_video_url && !isEditing && <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Video de Presentación</CardTitle>
            </CardHeader>
            <CardContent>
              <video src={profile.presentation_video_url} className="w-full max-w-2xl mx-auto rounded-lg" controls preload="metadata" />
            </CardContent>
          </Card>}

        {/* Personalización del perfil (solo en modo edición) */}
        <ProfileCustomization backgroundUrl={profile.background_url} videoUrl={profile.presentation_video_url} onBackgroundChange={url => setProfile(prev => ({
        ...prev,
        background_url: url
      }))} onVideoChange={url => setProfile(prev => ({
        ...prev,
        presentation_video_url: url
      }))} isEditing={isEditing} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profile.avatar_url} alt={profile.username} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl">
                    {profile.username ? profile.username.substring(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && <>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" id="avatar-upload" disabled={uploading} />
                    <label htmlFor="avatar-upload">
                      <Button size="sm" className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-purple-600 hover:bg-purple-700" disabled={uploading} asChild>
                        <span className="cursor-pointer">
                          <Camera className="w-4 h-4" />
                        </span>
                      </Button>
                    </label>
                  </>}
              </div>
              <p className="text-gray-300 text-sm text-center">
                {isEditing ? uploading ? "Subiendo imagen..." : "Haz clic en el ícono para cambiar tu foto" : "Tu foto de perfil actual"}
              </p>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="lg:col-span-2 bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Información Personal</CardTitle>
              <CardDescription className="text-gray-300">
                Actualiza tu información de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Nombre de Usuario</Label>
                  <Input id="username" value={profile.username} onChange={e => setProfile({
                  ...profile,
                  username: e.target.value
                })} disabled={!isEditing} placeholder="Tu nombre de usuario" className="border-white/20 text-white disabled:opacity-50 bg-slate-950" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input id="email" type="email" value={profile.email} onChange={e => setProfile({
                  ...profile,
                  email: e.target.value
                })} disabled={!isEditing} placeholder="tu@email.com" className="border-white/20 text-white disabled:opacity-50 bg-slate-950" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">Teléfono</Label>
                <Input id="phone" value={profile.phone} onChange={e => setProfile({
                ...profile,
                phone: e.target.value
              })} disabled={!isEditing} placeholder="+1234567890" className="border-white/20 text-white disabled:opacity-50 bg-slate-950" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Descripción</Label>
                <Textarea id="description" value={profile.description} onChange={e => setProfile({
                ...profile,
                description: e.target.value
              })} disabled={!isEditing} rows={4} className="bg-white/10 border-white/20 text-white disabled:opacity-50 resize-none" placeholder="Cuéntanos sobre ti y tus productos..." />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Stats */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Estadísticas de la Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">24</p>
                <p className="text-gray-300 text-sm">Productos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">156</p>
                <p className="text-gray-300 text-sm">Ventas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">4.8</p>
                <p className="text-gray-300 text-sm">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">$2,847</p>
                <p className="text-gray-300 text-sm">Ingresos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Mostrar el tutorial si showTutorial está true */}
      {showTutorial && (
        <PublicarProductoTutorial onClose={() => setShowTutorial(false)} />
      )}
    </div>
  );
};
