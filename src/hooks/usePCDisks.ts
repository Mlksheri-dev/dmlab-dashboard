import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function usePCDisks(deviceId: string) {
  return useQuery({
    queryKey: ["disks", deviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disks")
        .select("*")
        .eq("device_id", deviceId);

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });
}
