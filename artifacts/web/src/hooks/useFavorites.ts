import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { AuthRequiredModal } from "@/components/auth/AuthRequiredModal";

export function useFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    async function loadFavorites() {
      if (!user?.id) {
        setFavorites([]);
        return;
      }
      try {
        const { data } = await supabase
          .from("favorites")
          .select("*, barbershops(*)")
          .eq("user_id", user.id);
        if (data) setFavorites(data);
      } catch (err) {
        console.warn("Failed to fetch favorites:", err);
      }
    }
    loadFavorites();
  }, [user?.id]);

  const isFavorite = (shopId: number | string) => {
    return favorites.some((f) => String(f.shop_id) === String(shopId));
  };

  const toggleFavorite = async (shop: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      setIsAuthModalOpen(true);
      return false;
    }

    const shopId = typeof shop === "object" ? shop.id : shop;
    const isFav = isFavorite(shopId);

    if (isFav) {
      setFavorites((prev) => prev.filter((f) => String(f.shop_id) !== String(shopId)));
      try {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("shop_id", shopId);
        toast({
          title: "U hoq nga të ruajturat",
          description: "Salloni u hoq nga lista juaj e të ruajturave.",
        });
      } catch (err) {
        console.warn("Error removing favorite:", err);
      }
    } else {
      const newFav = { user_id: user.id, shop_id: shopId };
      setFavorites((prev) => [...prev, newFav]);
      try {
        await supabase.from("favorites").insert({
          user_id: user.id,
          shop_id: shopId,
        });
        toast({
          title: "U ruajt me sukses",
          description: "Salloni u shtua në listën tuaj të të ruajturave.",
        });
      } catch (err) {
        console.warn("Error adding favorite:", err);
      }
    }
    return true;
  };

  const AuthModal = React.useCallback(
    () => (
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    ),
    [isAuthModalOpen]
  );

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    isAuthModalOpen,
    openAuthModal: () => setIsAuthModalOpen(true),
    closeAuthModal: () => setIsAuthModalOpen(false),
    AuthModal,
  };
}
