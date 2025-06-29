import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, User, ArrowLeft, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserSearch } from "@/hooks/useUserSearch";

interface UserSearchSectionProps {
  onUserSelect: (userId: string) => void;
  onBack?: () => void;
}

export const UserSearchSection = ({ onUserSelect, onBack }: UserSearchSectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { users, loading, searchUsers, clearUsers } = useUserSearch();

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchUsers(searchTerm);
    } else {
      clearUsers();
    }
  };

  const handleUserClick = (user: any) => {
    onUserSelect(user.id);
  };

  const isAdminUser = (email: string) => {
    return email === 'mr.federex@gmail.com';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            size="icon"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <h1 className="text-4xl font-bold text-white">Buscar Usuarios</h1>
      </div>

      {/* Search Bar */}
      <Card className="bg-gray-900/50 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Encuentra a otros usuarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <Input
                placeholder="Buscar por nombre de usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="pl-12 py-4 text-lg bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-xl focus:ring-4 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-xl"
              disabled={loading}
            >
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {users.length > 0 && (
        <Card className="bg-gray-900/50 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-xl">Resultados de búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="flex items-center space-x-4 p-4 rounded-xl hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-white/20"
                >
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-purple-500/20 text-white text-lg">
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-white font-semibold truncate text-lg">
                        {user.username || 'Usuario'}
                      </p>
                      {isAdminUser(user.email) && (
                        <Badge variant="destructive" className="bg-red-600 text-white flex items-center gap-1 text-sm">
                          <Shield className="w-3 h-3" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-base truncate">
                      Usuario desde {new Date(user.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="text-gray-400">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No results */}
      {searchTerm && users.length === 0 && !loading && (
        <Card className="bg-gray-900/50 backdrop-blur-lg border-white/20">
          <CardContent className="py-12">
            <div className="text-center text-gray-400">
              <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">No se encontraron usuarios</p>
              <p className="text-base mt-2">Intenta con otro término de búsqueda</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initial state */}
      {!searchTerm && users.length === 0 && (
        <Card className="bg-gray-900/50 backdrop-blur-lg border-white/20">
          <CardContent className="py-12">
            <div className="text-center text-gray-400">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Comienza tu búsqueda</p>
              <p className="text-base mt-2">Escribe el nombre de usuario para encontrar a otros usuarios</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
