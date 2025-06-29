import { useState } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { CreateVideoModal } from "./CreateVideoModal";
import { RandomVideosViewer } from "./RandomVideosViewer";
import { useVideos } from "@/hooks/useVideos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Video, Shuffle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface VideosSectionProps {
  onUserSelect?: (userId: string) => void;
}
export const VideosSection = ({
  onUserSelect
}: VideosSectionProps) => {
  const {
    videos,
    loading,
    error
  } = useVideos();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showRandomViewer, setShowRandomViewer] = useState(false);
  const handleUserSelect = (userId: string) => {
    if (onUserSelect) {
      onUserSelect(userId);
    }
  };
  if (showRandomViewer) {
    return <RandomVideosViewer onBack={() => setShowRandomViewer(false)} onUserSelect={handleUserSelect} />;
  }
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Videos</h2>
          </div>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-white mt-4">Cargando videos...</p>
          </div>
        </div>
      </div>;
  }
  if (error) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Videos</h2>
            <div className="flex gap-2">
              <Button onClick={() => setShowRandomViewer(true)} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700" disabled={videos.length === 0}>
                <Shuffle className="w-4 h-4 mr-2" />
                Ver videos randoms
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                Crear Video
              </Button>
            </div>
          </div>
          
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">Error al cargar los videos</p>
            <p className="text-gray-500 text-sm">
              Intenta recargar la página
            </p>
          </div>

          <CreateVideoModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreateVideo={() => {}} />
        </div>
      </div>;
  }
  const filteredAndSortedVideos = videos.filter(video => video.title.toLowerCase().includes(searchTerm.toLowerCase()) || video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => {
    let aValue = a[sortBy as keyof typeof a];
    let bValue = b[sortBy as keyof typeof b];
    if (sortBy === "created_at") {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  return <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 bg-zinc-950">
      <div className="space-y-6 max-w-7xl mx-auto bg-zinc-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Videos</h2>
          
          <div className="flex gap-2">
            <Button onClick={() => setShowRandomViewer(true)} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700" disabled={videos.length === 0}>
              <Shuffle className="w-4 h-4 mr-2" />
              Ver videos randoms
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="w-4 h-4 mr-2" />
              Crear Video
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Buscar videos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Fecha</SelectItem>
              <SelectItem value="views">Vistas</SelectItem>
              <SelectItem value="likes">Likes</SelectItem>
              <SelectItem value="title">Título</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="border-white/20 text-white hover:bg-white/20">
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>

        {filteredAndSortedVideos.length === 0 ? <div className="text-center py-12 bg-zinc-800">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">
              {searchTerm ? "No se encontraron videos" : "No hay videos disponibles"}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              {searchTerm ? "Intenta con otros términos de búsqueda" : "Sé el primero en compartir un video"}
            </p>
            {!searchTerm && <Button onClick={() => setIsCreateModalOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                Crear mi primer video
              </Button>}
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAndSortedVideos.map(video => <VideoPlayer key={video.id} video={video} />)}
          </div>}

        <CreateVideoModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreateVideo={() => {}} />
      </div>
    </div>;
};