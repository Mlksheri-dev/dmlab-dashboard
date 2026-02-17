import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function usePCSessions(deviceId: string) {
  return useQuery({
    queryKey: ["sessions", deviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("device_id", deviceId)
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });
}
