import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Upload, Image, ImageIcon, Star, Shield, AlertTriangle, File, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMalwareScanner } from "@/hooks/useMalwareScanner";
import { useIsAndroid } from "@/hooks/useIsAndroid";
import { PaymentModal } from "./PaymentModal";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProduct: (productData: any) => Promise<{ data?: any; error?: any }>;
}

export const CreateProductModal = ({ isOpen, onClose, onCreateProduct }: CreateProductModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    paypalEmail: "",
    productFile: null as File | null,
    productImage: null as File | null,
    previewImages: [] as File[],
    isFree: false,
    makeFeatured: false
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewImageUrls, setPreviewImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingProductData, setPendingProductData] = useState<any>(null);
  const [fileSecurityStatus, setFileSecurityStatus] = useState<{
    scanned: boolean;
    safe: boolean;
    scanning: boolean;
  }>({ scanned: false, safe: false, scanning: false });

  const { user } = useAuth();
  const { toast } = useToast();
  const { scanFile, isScanning } = useMalwareScanner();
  const isAndroid = useIsAndroid();

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/products/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
      return null;
    }
  };

  const uploadProductFile = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/files/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({ ...prev, productImage: file }));
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handlePreviewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    const limitedFiles = imageFiles.slice(0, 5);
    
    setFormData(prev => ({ ...prev, previewImages: limitedFiles }));
    
    const urls = limitedFiles.map(file => URL.createObjectURL(file));
    setPreviewImageUrls(urls);
  };

  const removePreviewImage = (index: number) => {
    const newImages = formData.previewImages.filter((_, i) => i !== index);
    const newUrls = previewImageUrls.filter((_, i) => i !== index);
    
    URL.revokeObjectURL(previewImageUrls[index]);
    
    setFormData(prev => ({ ...prev, previewImages: newImages }));
    setPreviewImageUrls(newUrls);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, productFile: file }));
      
      // Iniciar escaneo automático de malware
      setFileSecurityStatus({ scanned: false, safe: false, scanning: true });
      
      toast({
        title: "🛡️ Escaneando archivo",
        description: "Verificando que el archivo no contenga malware...",
      });

      const scanResult = await scanFile(file);
      
      if (scanResult) {
        setFileSecurityStatus({
          scanned: true,
          safe: scanResult.is_safe,
          scanning: false
        });
      } else {
        setFileSecurityStatus({ scanned: false, safe: false, scanning: false });
      }
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, productImage: null }));
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const createProductWithData = async (productData: any, isFeatured: boolean = false): Promise<{ data?: any; error?: any }> => {
    const finalProductData = {
      ...productData,
      is_featured: isFeatured
    };

    console.log("Creating product with featured status:", isFeatured);
    
    const result = await onCreateProduct(finalProductData);
    
    if (!result.error) {
      // Reset form
      setFormData({
        title: "",
        description: "",
        price: "",
        category: "",
        paypalEmail: "",
        productFile: null,
        productImage: null,
        previewImages: [],
        isFree: false,
        makeFeatured: false
      });
      setImagePreview(null);
      setPreviewImageUrls([]);
      setPendingProductData(null);
      setFileSecurityStatus({ scanned: false, safe: false, scanning: false });
      onClose();
    }
    
    return result;
  };

  const handleFeaturedPaymentSuccess = async (transactionData: any) => {
    console.log("Featured payment successful:", transactionData);
    
    if (pendingProductData) {
      toast({
        title: "Pago confirmado",
        description: "Tu producto será destacado después de la publicación",
      });
      
      // Create the product as featured since payment was successful
      await createProductWithData(pendingProductData, true);
      setShowPaymentModal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar que el archivo haya pasado el escaneo de seguridad
    if (formData.productFile && (!fileSecurityStatus.scanned || !fileSecurityStatus.safe)) {
      toast({
        title: "Archivo no seguro",
        description: "El archivo debe pasar el escaneo de seguridad antes de ser publicado",
        variant: "destructive",
      });
      return;
    }

    setIsModerating(true);
    toast({
      title: "🤖 Moderando contenido...",
      description: "Revisando que tu producto cumpla con nuestras políticas.",
    });

    try {
      const { data: moderationData, error: moderationError } = await supabase.functions.invoke('moderate-product', {
        body: JSON.stringify({ title: formData.title, description: formData.description }),
      });
      
      if (moderationError) {
        throw new Error(moderationError.message);
      }

      const { safe, reason } = moderationData;

      if (!safe) {
        toast({
          title: "Producto Rechazado",
          description: reason || "Tu producto no cumple con las políticas de contenido.",
          variant: "destructive",
          duration: 10000,
        });
        setIsModerating(false);
        return;
      }

      toast({
        title: "Moderación Aprobada",
        description: "Tu producto ha pasado la revisión. Publicando...",
      });
    } catch (error) {
      console.error('Error during moderation:', error);
      toast({
        title: "Error de Moderación",
        description: "No se pudo verificar el contenido del producto. Se publicará sin revisión automática.",
        variant: "default",
      });
    } finally {
        setIsModerating(false);
    }

    setIsUploading(true);

    try {
      let imageUrl = null;
      let fileUrl = null;
      let previewImageUrls: string[] = [];

      if (formData.productImage) {
        imageUrl = await uploadImage(formData.productImage);
        if (!imageUrl) {
          setIsUploading(false);
          return;
        }
      }

      if (formData.previewImages.length > 0) {
        for (const file of formData.previewImages) {
          const url = await uploadImage(file);
          if (url) {
            previewImageUrls.push(url);
          }
        }
      }

      if (formData.productFile) {
        fileUrl = await uploadProductFile(formData.productFile);
        if (!fileUrl) {
          setIsUploading(false);
          return;
        }
      }

      const productData = {
        title: formData.title,
        description: formData.description,
        price: formData.isFree ? 0 : parseFloat(formData.price) || 0,
        category: formData.category,
        paypal_email: formData.isFree ? null : formData.paypalEmail || null,
        is_free: formData.isFree,
        status: 'active',
        image_url: imageUrl,
        file_url: fileUrl,
        preview_images: previewImageUrls
      };

      console.log("Product data prepared:", productData);

      // Si quiere destacar el producto, mostrar modal de pago (ahora para todos)
      if (formData.makeFeatured) {
        setPendingProductData(productData);
        setShowPaymentModal(true);
        setIsUploading(false);
      } else {
        // Crear producto normalmente (sin destacar)
        await createProductWithData(productData, false);
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setIsUploading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white/10 backdrop-blur-lg border-white/20 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Publicar Nuevo Producto</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">Título del Producto</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
                required
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
                rows={3}
                required
                disabled={isUploading}
              />
            </div>

            {/* Imagen principal del producto */}
            <div className="space-y-2">
              <Label className="text-white">Imagen Principal del Producto</Label>
              {!formData.productImage ? (
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/30 transition-colors">
                  <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-400 mb-2">Sube la imagen principal</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isUploading}
                  >
                    Seleccionar Imagen
                  </Button>
                </div>
              ) : (
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Image className="w-8 h-8 text-green-400" />
                      <div>
                        <p className="text-white font-medium">{formData.productImage.name}</p>
                        <p className="text-gray-400 text-sm">
                          {(formData.productImage.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeImage}
                      className="text-gray-400 hover:text-white hover:bg-white/20"
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {imagePreview && (
                    <div className="mt-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Imágenes de vista previa */}
            <div className="space-y-2">
              <Label className="text-white">Imágenes de Vista Previa (máx. 5)</Label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-white/30 transition-colors">
                <ImageIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-400 mb-2 text-sm">Sube capturas de pantalla o vistas previas del producto</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePreviewImagesChange}
                  className="hidden"
                  id="preview-images-upload"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => document.getElementById('preview-images-upload')?.click()}
                  disabled={isUploading}
                >
                  Seleccionar Imágenes
                </Button>
              </div>
              
              {formData.previewImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {previewImageUrls.map((url, index) => (
                    <div key={index} className="relative bg-white/10 rounded-lg p-2 border border-white/20">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePreviewImage(index)}
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 text-white hover:bg-black/70"
                        disabled={isUploading}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {formData.previewImages[index].name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkbox para producto gratuito */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFree"
                checked={formData.isFree}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFree: checked as boolean }))}
                className="border-white/20"
                disabled={isUploading}
              />
              <Label htmlFor="isFree" className="text-white">Producto gratuito</Label>
            </div>

            {/* Checkbox para producto destacado - AHORA disponible para todos los productos */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="makeFeatured"
                  checked={formData.makeFeatured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, makeFeatured: checked as boolean }))}
                  className="border-white/20"
                  disabled={isUploading}
                />
                <Label htmlFor="makeFeatured" className="text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Destacar producto (+$20 USD)
                </Label>
              </div>
              {formData.makeFeatured && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 ml-6">
                  <p className="text-sm text-yellow-300 font-medium">
                    ⚠️ PAGO REQUERIDO: Su producto aparecerá destacado SOLO después de completar el pago de $20 USD
                  </p>
                  <p className="text-xs text-yellow-400 mt-1">
                    Si cancela el pago, el producto se publicará normalmente sin destacar
                  </p>
                </div>
              )}
            </div>

            {!formData.isFree && (
              <div className="space-y-2">
                <Label htmlFor="price" className="text-white">Precio (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                  required
                  disabled={isUploading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="category" className="text-white">Categoría</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                disabled={isUploading}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  <SelectItem value="Educación">📚 Educación</SelectItem>
                  <SelectItem value="Diseño">🎨 Diseño Gráfico</SelectItem>
                  <SelectItem value="Desarrollo">💻 Desarrollo & Programación</SelectItem>
                  <SelectItem value="Marketing">📈 Marketing Digital</SelectItem>
                  <SelectItem value="Video">🎬 Video & Animación</SelectItem>
                  <SelectItem value="Audio">🎵 Audio & Música</SelectItem>
                  <SelectItem value="Fotografia">📷 Fotografía</SelectItem>
                  <SelectItem value="UI/UX">🖼️ UI/UX Design</SelectItem>
                  <SelectItem value="3D">🎯 Modelado 3D</SelectItem>
                  <SelectItem value="Plantillas">📋 Plantillas & Documentos</SelectItem>
                  <SelectItem value="Ilustracion">✏️ Ilustración</SelectItem>
                  <SelectItem value="Tipografia">📝 Tipografía & Fuentes</SelectItem>
                  <SelectItem value="Iconos">🔷 Iconos & Símbolos</SelectItem>
                  <SelectItem value="Presentaciones">📊 Presentaciones</SelectItem>
                  <SelectItem value="Logos">🏷️ Logos & Branding</SelectItem>
                  <SelectItem value="Gaming">🎮 Gaming & Apps</SelectItem>
                  <SelectItem value="Mockups">📱 Mockups</SelectItem>
                  <SelectItem value="Herramientas">🛠️ Herramientas & Utilidades</SelectItem>
                  <SelectItem value="Negocios">💼 Negocios & Finanzas</SelectItem>
                  <SelectItem value="Otros">📦 Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!formData.isFree && (
              <div className="space-y-2">
                <Label htmlFor="paypal" className="text-white">Email de PayPal (para recibir comisiones)</Label>
                <Input
                  id="paypal"
                  type="email"
                  value={formData.paypalEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, paypalEmail: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="tu@paypal.com"
                  required
                  disabled={isUploading}
                />
              </div>
            )}

            {/* Archivo del producto */}
            <div className="space-y-2">
              <Label htmlFor="file" className="text-white flex items-center gap-2">
                <File className="w-4 h-4" />
                Archivo del Producto
                {isAndroid && (
                  <div className="flex items-center gap-1 text-blue-400">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-xs">Android: Cualquier archivo</span>
                  </div>
                )}
                {fileSecurityStatus.scanning && (
                  <div className="flex items-center gap-1 text-blue-400">
                    <Shield className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Escaneando...</span>
                  </div>
                )}
                {fileSecurityStatus.scanned && fileSecurityStatus.safe && (
                  <div className="flex items-center gap-1 text-green-400">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs">Seguro</span>
                  </div>
                )}
                {fileSecurityStatus.scanned && !fileSecurityStatus.safe && (
                  <div className="flex items-center gap-1 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">Malware detectado</span>
                  </div>
                )}
              </Label>
              
              {isAndroid ? (
                // En Android: permitir cualquier tipo de archivo
                <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-white/30 transition-colors">
                  <File className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-400 mb-2">Sube cualquier archivo (APK, ZIP, PDF, etc.)</p>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading || isScanning}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isUploading || isScanning}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Seleccionar Archivo
                  </Button>
                </div>
              ) : (
                // En otros dispositivos: mantener restricciones originales
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="bg-white/10 border-white/20 text-white file:bg-white/20 file:border-0 file:text-white"
                  accept=".zip,.pdf,.png,.jpg,.jpeg,.mp4,.mov"
                  required
                  disabled={isUploading || isScanning}
                />
              )}

              {/* Mostrar archivo seleccionado */}
              {formData.productFile && (
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <File className="w-6 h-6 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">{formData.productFile.name}</p>
                        <p className="text-gray-400 text-sm">
                          {(formData.productFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <p className="text-gray-400 text-xs">
                          Tipo: {formData.productFile.type || 'Archivo'}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, productFile: null }))}
                      className="text-gray-400 hover:text-white hover:bg-white/20"
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Mostrar advertencia de seguridad si es necesario */}
                  {fileSecurityStatus.scanned && !fileSecurityStatus.safe && (
                    <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded">
                      <p className="text-red-300 text-xs">
                        ⚠️ Este archivo puede contener malware. Se recomienda no subirlo.
                      </p>
                    </div>
                  )}
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

            <DialogFooter>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose} 
                className="text-white hover:bg-white/20"
                disabled={isUploading || isScanning || isModerating}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={isUploading || isScanning || isModerating || (formData.productFile && (!fileSecurityStatus.scanned || !fileSecurityStatus.safe))}
              >
                {isUploading ? "Subiendo..." : isScanning ? "Escaneando..." : isModerating ? "Moderando..." : "Publicar Producto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Modal for Featured Products - SOLO se muestra si hay producto pendiente */}
      {showPaymentModal && pendingProductData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            // Si cancela el pago, crear producto sin destacar
            console.log("Payment cancelled, creating product without featured status");
            if (pendingProductData) {
              createProductWithData(pendingProductData, false);
            }
            setShowPaymentModal(false);
            setPendingProductData(null);
            setIsUploading(false);
          }}
          product={{
            id: Date.now(),
            title: `Destacar: ${pendingProductData.title}`,
            price: 20,
            seller: "Digital Emporium Genesis Hub",
            paypalEmail: "Mr.federex@gmail.com"
          }}
          onPaymentSuccess={handleFeaturedPaymentSuccess}
        />
      )}
    </>
  );
};
