
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Plus, Upload, User, CheckCircle } from "lucide-react";

interface PublicarProductoTutorialProps {
  onClose?: () => void;
}

export const PublicarProductoTutorial: React.FC<PublicarProductoTutorialProps> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in overflow-auto">
    <Card className="max-w-lg w-[90vw] text-white relative">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-purple-400" />
            ¿Cómo publicar tu primer producto?
          </span>
        </CardTitle>
        <CardDescription className="text-gray-300">Te guiamos paso a paso para publicar en Digital Emporium Genesis Hub.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal list-inside space-y-5 text-base text-gray-200 mb-6">
          <li>
            <span className="font-semibold text-white">Haz clic en <Plus className="inline w-4 h-4 align-middle text-pink-400" /> “Publicar Producto”.</span>
            <br />
            Encuentra el botón en la esquina superior derecha de la sección <span className="font-semibold text-purple-200">Productos Digitales</span>.
          </li>
          <li>
            <span className="font-semibold text-white">Llena el formulario.</span>
            <br />
            Escribe el título, descripción y categoría de tu producto. Sube imágenes llamativas para tu producto.
          </li>
          <li>
            <span className="font-semibold text-white">Agrega el archivo digital y precio.</span>
            <br />
            Sube tu archivo (PDF, ZIP, etc.) y pon precio. También puedes marcar tu curso como <span className="font-semibold text-green-400">gratis</span>.
          </li>
          <li>
            <span className="font-semibold text-white">Haz clic en “Publicar Producto”.</span>
            <br />
            ¡Tu producto será visible para otros usuarios!
          </li>
          <li>
            <span className="font-semibold text-white">Sigue tu progreso.</span>
            <br />
            Desde tu perfil, puedes ver tus productos, ventas y estadísticas.
          </li>
        </ol>
        <div className="flex flex-col items-center mt-2">
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" /> ¡Entendido!
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);
