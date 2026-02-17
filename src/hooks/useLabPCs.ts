import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function useLabPCs() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const resp = await apiFetch("/devices");
      // Inject server_time into each device for relative calculation
      return (resp.devices || []).map((d: any) => ({
        ...d,
        server_time: resp.server_time
      }));
    },
    refetchInterval: 10000,
    staleTime: 5000,
    gcTime: 30000
  });
}
