import { useQuery } from "@tanstack/react-query";
import type { Barbershop } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";

async function fetchOwnerShop(): Promise<Barbershop> {
  const token = localStorage.getItem("barber_token");
  const response = await fetch("/api/barbershops/mine", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Could not load your barbershop");
  }

  return response.json();
}

export function useOwnerShop() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["owner-shop", user?.id],
    queryFn: fetchOwnerShop,
    enabled: !!user && (user.role === "owner" || user.role === "admin"),
    staleTime: 60_000,
  });
}
