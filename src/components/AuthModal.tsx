
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const AuthModal = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = isLogin 
        ? await signIn(email, password) 
        : await signUp(email, password);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else if (!isLogin) {
        toast({
          title: "¡Registro exitoso!",
          description: "Revisa tu email para confirmar tu cuenta",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Algo salió mal. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-black via-brand-gray to-brand-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <Card className="w-full max-w-md bg-brand-white/10 backdrop-blur-lg border-brand-gray-light/20 relative z-10">
        <CardHeader className="text-center px-0 py-[10px] my-0 mx-[10px]">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-24 flex items-center justify-center backdrop-blur-sm border border-brand-gray-light/20 p-3 bg-[#0d0d0d]/10 rounded-full mx-0 my-0 py-[15px] px-[15px]">
              <img 
                alt="ERDEX Logo" 
                src="/lovable-uploads/d1bf6873-c647-4471-bd2c-246647bc51be.png" 
                className="h-16 w-auto filter brightness-125 contrast-125 drop-shadow-lg object-scale-down" 
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-brand-white">
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </CardTitle>
          <CardDescription className="mx-0 px-[10px] py-0 text-lime-950 font-extrabold text-3xl">
            Tu marketplace de productos digitales
          </CardDescription>
        </CardHeader>
        
        <CardContent className="my-[10px] py-0 mx-[10px]">
          <form onSubmit={handleSubmit} className="space-y-4 py-0 my-[10px] px-0 mx-0">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-brand-white">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="border-brand-gray-light/20 text-brand-white placeholder:text-brand-gray bg-stone-950" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-brand-white">Contraseña</Label>
              <Input id="password" type="password" placeholder="********" value={password} onChange={e => setPassword(e.target.value)} required className="border-brand-gray-light/20 text-brand-white placeholder:text-brand-gray bg-stone-950" />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-red to-brand-green hover:from-brand-red/80 hover:to-brand-green/80 transition-all duration-200 text-zinc-950 bg-slate-50">
              {loading ? "Cargando..." : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </Button>
          </form>

          <p className="text-center text-sm mt-4 text-zinc-950">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="underline text-red-500">
              {isLogin ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
