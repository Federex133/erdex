
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const CartIcon = ({ onClick }: { onClick: () => void }) => {
    const { cartCount } = useCart();
    
    return (
        <Button onClick={onClick} variant="ghost" className="relative text-white hover:bg-white/10 hover:text-white">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0 bg-purple-600 text-white border-2 border-gray-900">
                    {cartCount}
                </Badge>
            )}
            <span className="sr-only">Ver carrito</span>
        </Button>
    );
};
