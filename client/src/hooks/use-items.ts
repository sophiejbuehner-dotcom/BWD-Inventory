import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertItem } from "@shared/schema";

export function useItems(search?: string) {
  return useQuery({
    queryKey: [api.items.list.path, search],
    queryFn: async () => {
      const url = search 
        ? `${api.items.list.path}?search=${encodeURIComponent(search)}` 
        : api.items.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch items");
      return api.items.list.responses[200].parse(await res.json());
    },
  });
}

export function useItemBySku(sku: string | null) {
  return useQuery({
    queryKey: [api.items.getBySku.path, sku],
    queryFn: async () => {
      if (!sku) return null;
      const url = buildUrl(api.items.getBySku.path, { sku });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch item");
      
      return api.items.getBySku.responses[200].parse(await res.json());
    },
    enabled: !!sku && sku.length > 2, // Only fetch if SKU is provided and reasonable length
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertItem) => {
      const res = await fetch(api.items.create.path, {
        method: api.items.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.items.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create item");
      }
      
      return api.items.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
    },
  });
}

export function useUpdateItem(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<InsertItem>) => {
      const url = buildUrl(api.items.update.path, { id });
      const res = await fetch(url, {
        method: api.items.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update item");
      return api.items.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
    },
  });
}
