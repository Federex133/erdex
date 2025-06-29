import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, User, Shield } from "lucide-react";
import { useUserSearch } from "@/hooks/useUserSearch";

interface UserSearchDropdownProps {
  onUserSelect?: (userId: string) => void;
}

export const UserSearchDropdown = ({ onUserSelect }: UserSearchDropdownProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { users, loading, searchUsers, clearUsers } = useUserSearch();

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim()) {
        searchUsers(searchTerm);
        setIsOpen(true);
      } else {
        clearUsers();
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserClick = (user: any) => {
    setIsOpen(false);
    setSearchTerm("");
    clearUsers();
    
    // Llamar la función de callback si está disponible
    if (onUserSelect) {
      onUserSelect(user.id);
    }
  };

  const isAdminUser = (email: string) => {
    return email === 'mr.federex@gmail.com';
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-8 lg:left-10 top-1/2 transform -translate-y-1/2 text-gray-400 w-8 h-8 lg:w-10 lg:h-10" />
        <Input
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-20 lg:pl-24 pr-8 lg:pr-12 py-6 lg:py-8 text-2xl lg:text-4xl bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-3xl lg:rounded-[2rem] focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all h-20 lg:h-24 font-medium"
        />
      </div>

      {isOpen && (users.length > 0 || loading) && (
        <Card className="absolute top-full left-0 right-0 mt-4 lg:mt-6 bg-gray-900/95 backdrop-blur-lg border-white/20 z-50 max-h-96 lg:max-h-[32rem] overflow-y-auto rounded-3xl lg:rounded-[2rem] shadow-2xl">
          <CardContent className="p-6 lg:p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12 lg:py-16">
                <div className="text-gray-400 text-2xl lg:text-3xl">Buscando usuarios...</div>
              </div>
            ) : (
              <div className="space-y-4 lg:space-y-6">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="flex items-center space-x-6 lg:space-x-8 p-6 lg:p-8 rounded-2xl lg:rounded-3xl hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-white/20"
                  >
                    <Avatar className="w-20 h-20 lg:w-24 lg:h-24">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-purple-500/20 text-white text-2xl lg:text-3xl">
                        <User className="w-10 h-10 lg:w-12 lg:h-12" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-white font-semibold truncate text-2xl lg:text-3xl">
                          {user.username || 'Usuario'}
                        </p>
                        {isAdminUser(user.email) && (
                          <Badge variant="destructive" className="bg-red-600 text-white flex items-center gap-1 text-sm lg:text-base">
                            <Shield className="w-3 h-3 lg:w-4 lg:h-4" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-xl lg:text-2xl truncate">
                        Usuario desde {new Date(user.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isOpen && searchTerm && users.length === 0 && !loading && (
        <Card className="absolute top-full left-0 right-0 mt-4 lg:mt-6 bg-gray-900/95 backdrop-blur-lg border-white/20 z-50 rounded-3xl lg:rounded-[2rem] shadow-2xl">
          <CardContent className="p-12 lg:p-16">
            <div className="text-center text-gray-400">
              <User className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 lg:mb-8 opacity-50" />
              <p className="text-2xl lg:text-3xl">No se encontraron usuarios</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
