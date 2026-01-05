import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type AddProjectItemRequest, type UpdateProjectItemRequest } from "@shared/routes";

export function useAddProjectItem(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<AddProjectItemRequest, 'projectId'>) => {
      const url = buildUrl(api.projectItems.add.path, { id: projectId });
      const res = await fetch(url, {
        method: api.projectItems.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to add item to project");
      return api.projectItems.add.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, projectId] });
    },
  });
}

export function useUpdateProjectItem(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: number; updates: UpdateProjectItemRequest }) => {
      const url = buildUrl(api.projectItems.update.path, { id: projectId, itemId });
      const res = await fetch(url, {
        method: api.projectItems.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update item status");
      return api.projectItems.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, projectId] });
    },
  });
}

export function useDeleteProjectItem(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number) => {
      const url = buildUrl(api.projectItems.delete.path, { id: projectId, itemId });
      const res = await fetch(url, {
        method: api.projectItems.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to remove item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, projectId] });
    },
  });
}
