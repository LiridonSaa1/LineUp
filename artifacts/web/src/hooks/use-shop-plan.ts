import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useOwnerShop } from "./use-owner-shop";

export interface ShopPlan {
  id: "solo" | "duo" | "team";
  label: string;
  maxBarbers: number;
  status: string;
  isSubscribed: boolean;
}

const PADDLE_PRODUCTS = {
  solo: 'pro_01ky8dvr6p8qf70p0y717t69p5',
  duo: 'pro_01ky8e81zvf8wz9p7z6k1v3v4e',
  team: 'pro_01ky8eapq2pvetack6ad8pnkbw'
};

export function useShopPlan() {
  const { data: shop } = useOwnerShop();
  const shopId = shop?.id;
  const ownerId = (shop as any)?.owner_id || shopId;

  return useQuery({
    queryKey: ["shop-plan", shopId],
    queryFn: async (): Promise<ShopPlan> => {
      if (!shopId) throw new Error("No shop ID");

      // 1. Fetch subscription from Supabase (Source of Truth)
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("product_id, employee_limit, status")
        .eq("customer_id", ownerId)
        .maybeSingle();

      let planId: "solo" | "duo" | "team" = "solo";
      let maxBarbers = 1;
      let status = sub?.status || "inactive";
      let isSubscribed = status === "active";

      if (sub) {
        const pid = (sub.product_id || "").toLowerCase();

        if (pid.includes("solo") || pid === PADDLE_PRODUCTS.solo) {
          planId = "solo";
          maxBarbers = 1;
        } else if (pid.includes("duo") || pid === PADDLE_PRODUCTS.duo) {
          planId = "duo";
          maxBarbers = 2;
        } else if (pid.includes("team") || pid === PADDLE_PRODUCTS.team) {
          planId = "team";
          maxBarbers = sub.employee_limit || 100;
        } else {
          // Fallback based on employee limit if ID is custom
          if (sub.employee_limit) {
            maxBarbers = sub.employee_limit;
          } else if ((shop as any)?.max_barbers || (shop as any)?.max_employees) {
            maxBarbers = (shop as any)?.max_barbers || (shop as any)?.max_employees;
          }
          planId = maxBarbers === 1 ? "solo" : maxBarbers === 2 ? "duo" : "team";
        }
      } else {
        // Fallback for no subscription record: use shop table columns
        const workers = (shop as any)?.max_barbers || (shop as any)?.max_employees || 1;
        maxBarbers = workers;
        planId = workers === 1 ? "solo" : workers === 2 ? "duo" : "team";

        // If shop has explicit active status but no sub record (legacy)
        if ((shop as any)?.subscription_status === "active") {
          isSubscribed = true;
          status = "active";
        }
      }

      const labels = { solo: "Solo", duo: "Duo", team: "Team" };

      return {
        id: planId,
        label: labels[planId],
        maxBarbers,
        status,
        isSubscribed
      };
    },
    enabled: !!shopId,
    staleTime: 30_000,
  });
}
