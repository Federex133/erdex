
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, ShoppingBag, TrendingUp, User, Trophy, Video, Package, Play, Shield, Search, MessageCircle } from "lucide-react";
import { DownloadAPKButton } from "./DownloadAPKButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { CartIcon } from "./CartIcon";

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
  onUserSelect: (userId: string) => void;
}

export const Navbar = ({ activeSection, setActiveSection, onLogout, isAdmin, onUserSelect }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const navItems = [
    { id: "products", label: "Productos", icon: ShoppingBag },
    { id: "user-search", label: "Buscar Usuarios", icon: Search },
    { id: "chats", label: "Chats", icon: MessageCircle },
    { id: "sales", label: "Ventas", icon: TrendingUp },
    { id: "top-sellers", label: "Top Ventas", icon: Trophy },
    { id: "videos", label: "Videos", icon: Video },
    { id: "my-products", label: "Mis Productos", icon: Package },
    { id: "my-videos", label: "Mis Videos", icon: Play },
    { id: "profile", label: "Perfil", icon: User },
  ];

  // Add admin section if user is admin
  if (isAdmin) {
    navItems.push({ id: "admin", label: "Admin", icon: Shield });
  }

  const handleNavItemClick = (itemId: string) => {
    setActiveSection(itemId);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-black/90 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/976e1875-6ba2-49f1-93f2-d5287dfdc6e0.png" 
                alt="ERDEX - Your Digital Product Marketplace" 
                className="h-10 w-auto drop-shadow-lg hover:scale-105 transition-transform duration-200"
              />
            </div>

            {/* Desktop Navigation */}
            {!isMobile && (
              <div className="ml-10 flex items-baseline space-x-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                        activeSection === item.id
                          ? "bg-white/20 text-white"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <CartIcon onClick={() => setActiveSection("cart")} />
            {!isMobile && <DownloadAPKButton />}

            {/* Mobile Menu */}
            {isMobile && (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                  <SheetHeader>
                    <SheetTitle className="text-white text-left">Menú</SheetTitle>
                  </SheetHeader>
                  
                  <div className="flex flex-col space-y-4 mt-6">
                    {/* Navigation Items */}
                    <div className="space-y-2">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavItemClick(item.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-base font-medium flex items-center gap-3 transition-colors ${
                              activeSection === item.id
                                ? "bg-white/20 text-white"
                                : "text-gray-300 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Mobile Actions */}
                    <div className="border-t border-gray-700 pt-4 space-y-3">
                      <DownloadAPKButton />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
